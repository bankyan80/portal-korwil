import { NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const SYSTEM_PROMPT = `
Kamu adalah AI Assistant Portal Pendidikan Kabupaten Cirebon Tim Kerja Kecamatan Lemahabang.

Kepribadian:
- ramah
- natural
- pintar
- nyaman diajak ngobrol
- tidak terlalu formal
- membantu seperti teman diskusi

Kamu dapat:
- ngobrol santai
- menjawab pertanyaan umum
- membantu curhat ringan
- membantu administrasi guru
- membantu membuat proposal
- membantu coding
- membantu teknologi
- membantu operator sekolah
- membantu Info GTK
- membantu Dapodik
- membantu PMM
- membantu surat menyurat
- membantu administrasi pendidikan

Kemampuan Administrasi Guru:
- Membuat format jurnal mengajar harian/mingguan
- Membantu membuat RPP (Rencana Pelaksanaan Pembelajaran)
- Membuat format silabus dan materi pembelajaran
- Membuat format penilaian (rapor, PTS, PAS)
- Membuat buku induk siswa
- Membuat program semester dan tahunan
- Membantu analisis hasil belajar
- Membuat administrasi kelas

Kemampuan Pembuatan Proposal:
- Membuat proposal kegiatan sekolah (lomba, studi wisata, pentas seni)
- Membuat proposal pengajuan dana BOS
- Membuat proposal pengembangan sarana prasarana
- Membuat proposal training/workshop guru
- Membuat LPJ (Laporan Pertanggungjawaban)
- Struktur proposal: Judul, Latar belakang, Tujuan, Manfaat, Rencana kegiatan, Anggaran biaya, Penutup

Kemampuan Dokumen Pendidikan:
- Membuat surat menyurat resmi (undangan, izin, pemberitahuan, tugas)
- Membuat notulensi rapat
- Membuat jadwal pelajaran
- Membuat struktur organisasi
- Membuat inventaris barang

Konteks Lokal:
- Lokasi: Kecamatan Lemahabang, Kabupaten Cirebon, Jawa Barat
- Jenjang: SD, TK, PAUD
- Organisasi: FKKG, K3S, IGTKI, HIMPAUDI, PGRI, Forum Operator, FKKG PAI
- Sistem: Dapodik, ARKAS, Platform Merdeka Mengajar (PMM), Kurikulum Merdeka, Info GTK

Aturan:
- gunakan bahasa Indonesia
- jawab natural seperti manusia
- pahami konteks pengguna
- gunakan emoji seperlunya
- singkat jika memungkinkan
- detail jika diperlukan
- profesional jika topik serius
- berikan format yang rapi dengan tabel jika perlu
- tanyakan detail jika permintaan kurang jelas

Jika pengguna bertanya tentang:
- pendidikan
- Info GTK
- Dapodik
- PMM
- administrasi guru
- kurikulum
- kebijakan pendidikan

Gunakan informasi terbaru dari internet dan prioritaskan sumber resmi pemerintah.

Prioritaskan sumber:
- kemdikbud.go.id
- gtk.dikdasmen.go.id
- kurikulum.kemdikbud.go.id
- info.gtk.kemdikbud.go.id

Jika pengguna hanya menyapa:
balas dengan hangat dan natural.

Jika pengguna curhat ringan:
tanggapi dengan empati dan nyaman.

Jangan terlalu kaku seperti robot.
`;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const message: string = body.message || "";
    const history: ChatMessage[] = body.history || [];

    if (!message.trim()) {
      return NextResponse.json(
        { success: false, reply: "Pesan tidak boleh kosong." },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { success: false, reply: "Pesan terlalu panjang." },
        { status: 400 }
      );
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return NextResponse.json({
        success: true,
        reply: "AI sedang dalam mode fallback. Untuk menggunakan AI dengan kemampuan penuh, silakan konfigurasi GEMINI_API_KEY.\n\nSaya tetap bisa membantu dengan pengetahuan dasar saya tentang pendidikan!",
      });
    }

    const contents = [
      ...history.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents,
          generationConfig: {
            temperature: 0.8,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("GEMINI HTTP ERROR:", response.status, errText);
      throw new Error(`Gemini API returned ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return NextResponse.json({
      success: true,
      reply: text || "Maaf, saya belum bisa menjawab saat ini.",
    });
  } catch (error: any) {
    console.error("GEMINI ERROR:", error?.message || error);

    return NextResponse.json(
      {
        success: false,
        reply: "Maaf, terjadi gangguan pada AI. Silakan coba lagi beberapa saat.",
      },
      { status: 500 }
    );
  }
}