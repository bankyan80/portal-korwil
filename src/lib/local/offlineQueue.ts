import localforage from 'localforage';
import { db } from '@/lib/firebase';
import {
  doc, setDoc, updateDoc, deleteDoc, collection,
} from 'firebase/firestore';

const queueStore = localforage.createInstance({
  name: 'PortalDinas',
  storeName: 'offline_queue',
  description: 'Offline operation queue for failed Firebase writes',
});

export interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  docId: string;
  data?: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
  lastError?: string;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function enqueue(
  type: QueuedOperation['type'],
  coll: string,
  docId: string,
  data?: Record<string, unknown>,
): Promise<string> {
  const op: QueuedOperation = {
    id: generateId(),
    type,
    collection: coll,
    docId,
    data,
    createdAt: Date.now(),
    retryCount: 0,
  };
  await queueStore.setItem(op.id, op);
  return op.id;
}

export async function dequeue(id: string): Promise<void> {
  await queueStore.removeItem(id);
}

export async function getAllQueued(): Promise<QueuedOperation[]> {
  const result: QueuedOperation[] = [];
  await queueStore.iterate((value) => {
    result.push(value as QueuedOperation);
  });
  return result.sort((a, b) => a.createdAt - b.createdAt);
}

export async function processQueue(): Promise<{ success: number; failed: number }> {
  const ops = await getAllQueued();
  let success = 0;
  let failed = 0;

  for (const op of ops) {
    try {
      const ref = doc(collection(db!, op.collection), op.docId);
      if (op.type === 'create' || op.type === 'update') {
        await setDoc(ref, op.data || {}, { merge: true });
      } else if (op.type === 'delete') {
        await deleteDoc(ref);
      }
      await dequeue(op.id);
      success++;
    } catch (e) {
      op.retryCount++;
      op.lastError = String(e);
      await queueStore.setItem(op.id, op);
      if (op.retryCount >= 10) {
        await dequeue(op.id);
      }
      failed++;
    }
  }

  return { success, failed };
}

export async function queueCount(): Promise<number> {
  let count = 0;
  await queueStore.iterate(() => { count++; });
  return count;
}
