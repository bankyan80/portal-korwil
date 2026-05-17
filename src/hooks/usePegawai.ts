import { useQuery } from '@tanstack/react-query';

export function usePegawai(page = 1, search?: string) {
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('limit', '100');
  if (search) params.set('search', search);

  return useQuery({
    queryKey: ['pegawai', page, search],
    queryFn: async () => {
      const res = await fetch('/api/pegawai/all?' + params.toString());
      if (!res.ok) throw new Error('Gagal fetch data pegawai');
      return res.json();
    },
  });
}

export function usePegawaiAll(search?: string) {
  const params = new URLSearchParams();
  params.set('all', 'true');
  if (search) params.set('search', search);

  return useQuery({
    queryKey: ['pegawai', 'all', search],
    queryFn: async () => {
      const res = await fetch('/api/pegawai/all?' + params.toString());
      if (!res.ok) throw new Error('Gagal fetch semua data pegawai');
      return res.json();
    },
  });
}
