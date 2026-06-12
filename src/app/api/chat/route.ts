import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from '@google/genai';

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

// Simple in-memory rate limiter (IP-based, 20 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);
  
  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  
  if (limit.count >= 20) {
    return false;
  }
  
  limit.count++;
  return true;
}

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for') || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

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
- Membuat inventaris barang

Konteks Lokal:
- Lokasi: Kecamatan Lemahabang, Kabupaten Cirebon, Jawa Barat
- Jenjang: SD, TK, PAUD
- Organisasi: K3S, IGTKI, HIMPAUDI, PGRI, Forum Operator, FKKG PAI
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

export async function POST(req: NextRequest) {
  try {
    // Check auth
    const token = req.cookies.get('auth-token')?.value;
    let userRole = 'publik';
    if (token) {
      try {
        const { verifyCookieAuth } = await import('@/lib/server-auth');
        const auth = await verifyCookieAuth(token);
        if (auth?.role) userRole = auth.role;
      } catch {}
    }

    // Apply rate limiting based on role
    if (userRole !== 'super_admin') {
      const ip = getIp(req);
      if (!checkRateLimit(ip)) {
        return NextResponse.json(
          { success: false, reply: "Terlalu banyak permintaan. Silakan tunggu sebentar." },
          { status: 429 }
        );
      }
    }

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

    const ai = new GoogleGenAI({ apiKey: key });

    const contents = [
      ...history.map((msg) => ({
        role: msg.role === "assistant" ? "model" as const : "user" as const,
        parts: [{ text: msg.content }],
      })),
      { role: "user" as const, parts: [{ text: message }] },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents,
      config: {
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 4096,
      },
    });

    const text = response?.text;

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
