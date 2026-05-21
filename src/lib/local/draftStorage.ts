import localforage from 'localforage';

const draftStore = localforage.createInstance({
  name: 'PortalDinas',
  storeName: 'drafts',
  description: 'Form draft storage for autosave',
});

export interface DraftKey {
  userId: string;
  schoolId?: string;
  page: string;
  formType: string;
  docId?: string;
  bulan?: number;
  tahun?: number;
}

function serializeKey(k: DraftKey): string {
  const parts = [k.userId, k.schoolId || 'all', k.page, k.formType];
  if (k.docId) parts.push(k.docId);
  if (k.bulan != null && k.tahun != null) parts.push(`${k.bulan}-${k.tahun}`);
  return parts.join('::');
}

export async function saveDraft<T>(key: DraftKey, data: T): Promise<void> {
  try {
    await draftStore.setItem(serializeKey(key), {
      data,
      savedAt: Date.now(),
    });
  } catch (e) {
    console.warn('Draft save failed:', e);
  }
}

export async function loadDraft<T>(key: DraftKey): Promise<T | null> {
  try {
    const entry = await draftStore.getItem<{ data: T; savedAt: number }>(serializeKey(key));
    return entry?.data ?? null;
  } catch {
    return null;
  }
}

export async function removeDraft(key: DraftKey): Promise<void> {
  try {
    await draftStore.removeItem(serializeKey(key));
  } catch {}
}

export async function clearUserDrafts(userId: string): Promise<void> {
  const prefix = `${userId}::`;
  const keys: string[] = [];
  await draftStore.iterate((_value, key) => {
    if (key.startsWith(prefix)) keys.push(key);
  });
  await Promise.all(keys.map((k) => draftStore.removeItem(k)));
}
