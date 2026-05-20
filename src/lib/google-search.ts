export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

export interface GoogleSearchResponse {
  results: SearchResult[];
  error?: string;
}

export async function searchGoogle(query: string, numResults: number = 5): Promise<GoogleSearchResponse> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !cx) {
    return { results: [], error: 'GOOGLE_SEARCH_API_KEY atau GOOGLE_SEARCH_ENGINE_ID tidak dikonfigurasi' };
  }

  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('cx', cx);
    url.searchParams.set('q', query);
    url.searchParams.set('num', String(Math.min(numResults, 10)));
    url.searchParams.set('hl', 'id');
    url.searchParams.set('lr', 'lang_id');

    const response = await fetch(url.toString(), { next: { revalidate: 3600 } });

    if (!response.ok) {
      const errText = await response.text();
      return { results: [], error: `Google Search API error: ${response.status}` };
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return { results: [], error: 'Tidak ada hasil pencarian' };
    }

    const results: SearchResult[] = data.items.map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
    }));

    return { results };
  } catch (error: any) {
    return { results: [], error: error?.message || 'Gagal menghubungi Google Search API' };
  }
}

export function hasSearchIntent(input: string): boolean {
  const normalized = input.toLowerCase().trim();

  const patterns = [
    /\b(berita terbaru|kabar terbaru|info terbaru|perkembangan terbaru|terkini|update|breaking news)\b/i,
    /\b(regulasi terbaru|peraturan baru|kebijakan baru|undang-undang|permendikbud|permen (dikbud|panrb)|pp \d+|uu \d+)\b/i,
    /\b(harga|biaya|tarif|ongkos|berapa (biaya|harga))\b/i,
    /\b(jadwal|tanggal (pelaksanaan|pendaftaran|dimulai)|waktu (pelaksanaan|dimulai)|deadline|batas waktu)\b/i,
    /\b(kapan|dimana (lokasi|tempat))\b.*\b(dilaksanakan|diadakan|berlangsung|terbaru)\b/i,
    /\b(teknologi|aplikasi|software|framework|library|versi terbaru)\b.*\b(terbaru|rilis|update)\b/i,
    /\b(error|bug|troubleshoot|cara memperbaiki|gagal|tidak bisa|masalah)\b.*\b(npm|react|nextjs|node|javascript|typescript|library|dependensi)\b/i,
    /\b(rekomendasi|review|perbandingan|terbaik|rekomended)\b.*\b(aplikasi|website|sekolah|pendidikan|laptop|hp|guru|belajar)\b/i,
    /\b(cara (daftar|membuat|install|download|menggunakan|belajar))\b.*\b(aplikasi|website|software|platform|tools)\b/i,
    /\b(cuaca|ramalan|prakiraan)\b/i,
  ];

  return patterns.some(p => p.test(normalized));
}

export function hasInternalDataIntent(input: string): boolean {
  const normalized = input.toLowerCase().trim();

  const patterns = [
    /\b(data (siswa|guru|tendik|pegawai|sekolah) (di|pada) portal)\b/i,
    /\b(lihat|tampilkan|cari|tunjuk) (data )?(siswa|guru|tendik|pegawai)\b/i,
    /\b(rekap|laporan) (bulanan|sekolah) (saya|kami)\b/i,
    /\b(jumlah (siswa|guru|kelas|rombel) (di|pada|portal|sekolah))\b/i,
    /\b(status (laporan|tugas|verifikasi))\b/i,
    /\b(siapa (operator|kepala sekolah))\b/i,
    /\b(profil (sekolah|operator) (saya|kami))\b/i,
    /\b(sarpras|sarana prasarana) (sekolah|saya|kami)\b/i,
  ];

  return patterns.some(p => p.test(normalized));
}

export function formatSearchReply(results: SearchResult[], query: string): string {
  if (results.length === 0) {
    return 'HaloAI belum bisa mengambil informasi terbaru saat ini. Saya bantu jawab berdasarkan pengetahuan umum dulu ya.';
  }

  const snippets = results.slice(0, 3).map(r => r.snippet).filter(Boolean).join(' ');
  const summary = snippets.length > 300 ? snippets.slice(0, 300) + '...' : snippets;

  const sources = results.slice(0, 3).map(r => `- [${r.title}](${r.link})`).join('\n');

  return `Berdasarkan hasil pencarian terbaru, ${summary}\n\n**Sumber:**\n${sources}`;
}
