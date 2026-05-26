type WhereClause = { field: string; value: string };
type OrderClause = { field: string; dir?: 'asc' | 'desc' };

export async function apiGet(collection: string, opts?: { id?: string; where?: WhereClause; orderBy?: OrderClause; limit?: number }) {
  const params = new URLSearchParams();
  if (opts?.id) params.set('id', opts.id);
  if (opts?.where) { params.set('field', opts.where.field); params.set('value', opts.where.value); }
  if (opts?.orderBy) { params.set('orderBy', opts.orderBy.field); params.set('orderDir', opts.orderBy.dir || 'asc'); }
  if (opts?.limit) params.set('limit', String(opts.limit));
  const res = await fetch(`/api/firestore/${collection}?${params}`);
  return res.json();
}

export async function apiSet(collection: string, id: string | undefined, data: any, merge = true) {
  const res = await fetch(`/api/firestore/${collection}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, data, merge }),
  });
  return res.json();
}

export async function apiAdd(collection: string, data: any) {
  return apiSet(collection, undefined, data, false);
}

export async function apiDelete(collection: string, id: string) {
  const res = await fetch(`/api/firestore/${collection}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  return res.json();
}
