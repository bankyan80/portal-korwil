import { useQuery } from '@tanstack/react-query';

export interface PerKelasSekolah {
  name: string;
  jenjang: string;
  perKelas: Record<string, { l: number; p: number }>;
  totalL: number;
  totalP: number;
}

export function useRombel() {
  return useQuery({
    queryKey: ['rombel'],
    queryFn: async () => {
      const res = await fetch('/api/siswa/per-kelas');
      if (!res.ok) throw new Error('Gagal fetch data rombel');
      const json = await res.json();
      return (json.data || []) as PerKelasSekolah[];
    },
  });
}
