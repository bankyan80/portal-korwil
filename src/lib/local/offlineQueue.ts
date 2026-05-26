import localforage from 'localforage';

const queueStore = localforage.createInstance({
  name: 'PortalDinas',
  storeName: 'offline_queue',
  description: 'Offline operation queue for failed writes',
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

async function apiCall(op: QueuedOperation): Promise<void> {
  const url = `/api/firestore/${op.collection}`;
  if (op.type === 'create' || op.type === 'update') {
    const res = await fetch(`${url}?id=${encodeURIComponent(op.docId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: op.docId, data: op.data || {}, merge: true }),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
  } else if (op.type === 'delete') {
    const res = await fetch(`${url}?id=${encodeURIComponent(op.docId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
  }
}

export async function processQueue(): Promise<{ success: number; failed: number }> {
  const ops = await getAllQueued();
  let success = 0;
  let failed = 0;

  for (const op of ops) {
    try {
      await apiCall(op);
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
