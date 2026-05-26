import { supabaseAdmin } from '@/lib/supabase-admin';

export async function getAllBerita() {
  if (!supabaseAdmin) throw new Error('Database not configured');
  const { data, error } = await supabaseAdmin
    .from('app_data')
    .select('*')
    .eq('collection', 'berita')
    .order('data->>tanggal', { ascending: false });
  if (error) throw error;
  return (data || []).map(r => ({ id: r.id, ...(r.data as object) }));
}

export async function createBerita(data: any) {
  if (!supabaseAdmin) throw new Error('Database not configured');
  const id = crypto.randomUUID();
  const { error } = await supabaseAdmin
    .from('app_data')
    .insert({ id, collection: 'berita', data: { ...data, createdAt: Date.now(), updatedAt: Date.now() } });
  if (error) throw error;
  return id;
}
