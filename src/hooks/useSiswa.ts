import { useQuery } from '@tanstack/react-query';

export function useSiswa(jenjang?: string) {
  const params = new URLSearchParams();
  if (jenjang) params.set('jenjang', jenjang);

  return useQuery({
    queryKey: ['siswa', jenjang],
    queryFn: async () => {
      const res = await fetch('/api/siswa/list?' + params.toString());
      if (!res.ok) throw new Error('Gagal fetch data siswa');
      const json = await res.json();
      return json.siswa; // API asli membungkus di properti "siswa"
    },
  });
}
