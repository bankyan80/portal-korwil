import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_PRO_MODEL = 'gemini-2.5-pro';

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAI;
}

export function getModel(usePro: boolean = false): GenerativeModel {
  const ai = getGenAI();
  const modelName = usePro ? GEMINI_PRO_MODEL : GEMINI_MODEL;
  return ai.getGenerativeModel({ model: modelName });
}

export interface ChatContext {
  userRole: string;
  userName: string;
  schoolName?: string;
  schoolId?: string;
  currentPath: string;
  currentView: string;
}

export function buildSystemPrompt(ctx: ChatContext): string {
  const roleContext = (() => {
    switch (ctx.userRole) {
      case 'super_admin':
        return `Anda adalah HaloAI, asisten digital untuk Super Admin Portal Pendidikan Kecamatan Lemahabang.
User saat ini: ${ctx.userName} (Super Admin).
Anda memiliki akses penuh untuk monitoring semua sekolah, laporan, data siswa, guru, audit sistem, dan statistik pendidikan.`;
      case 'operator_sekolah':
        return `Anda adalah HaloAI, asisten digital untuk Operator Sekolah di Portal Pendidikan Kecamatan Lemahabang.
User saat ini: ${ctx.userName}, Operator sekolah: ${ctx.schoolName || 'belum diketahui'}.
Anda membantu input data, laporan bulanan, data siswa, guru, dan validasi sekolah.`;
      default:
        return `Anda adalah HaloAI, asisten digital untuk Portal Pendidikan Kecamatan Lemahabang.
User saat ini: pengunjung publik.
Anda membantu informasi sekolah, SPMB, TKA, dan layanan pendidikan.`;
    }
  })();

  return `${roleContext}

HALUAN:
- Gunakan bahasa Indonesia yang ramah, profesional, dan mudah dipahami.
- Jawab berdasarkan konteks halaman aktif: ${ctx.currentPath} (view: ${ctx.currentView}).
- Jika diminta mencari data siswa/guru, arahkan ke halaman yang sesuai.
- Jika diminta rekap atau laporan, berikan panduan langkah demi langkah.
- Jika tidak tahu jawaban, katakan dengan jujur dan arahkan ke admin.
- Jangan membuat data fiktif. Jika perlu data spesifik, arahkan ke halaman terkait.

MENU CEPAT YANG BISA DIBANTU:
1. Cari Siswa - Pencarian data peserta didik
2. Cari Guru - Pencarian data guru dan tendik
3. Rekap Sekolah - Ringkasan data sekolah
4. Laporan Bulanan - Monitoring laporan rutin
5. SPMB SD - Sistem Penerimaan Murid Baru
6. TKA SD - Test Kompetensi Akademik
7. Audit Sistem - Pemeriksaan error dan validasi data
8. Statistik Pendidikan - Data agregat pendidikan

JAWAB DENGAN SINGKAT, JELAS, DAN BERI LINK/ARAHAN KE HALAMAN TERKAIT JIKA PERLU.`;
}

export async function checkGeminiHealth(): Promise<boolean> {
  try {
    if (!GEMINI_API_KEY) return false;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
        }),
      }
    );
    if (!response.ok) return false;
    const data = await response.json();
    return !!data?.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch {
    return false;
  }
}
