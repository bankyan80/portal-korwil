import { GoogleGenAI } from '@google/genai';
import { classifyComplexity, type Complexity } from './haloAI-knowledge';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_PRO_MODEL = 'gemini-2.5-pro';

let ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return ai;
}

export function getModelName(usePro: boolean = false): string {
  return usePro ? GEMINI_PRO_MODEL : GEMINI_MODEL;
}

export interface ChatContext {
  userRole: string;
  userName: string;
  schoolName?: string;
  schoolId?: string;
  currentPath: string;
  currentView: string;
}

const ROUTE_PUBLIK = `
ROUTE PUBLIK: / /profil /spmb-sd /spmb-sd/cek /spmb-sd/pengumuman /spmb-sd/daftar-ulang /tka-sd /agenda-kegiatan /administrasi /mapping-pegawai /laporan /rekap-laporan /data-sekolah /kip-sd /yatim-piatu /bos-arkas /dokumen-bersama /login

ATURAN LINK:
- Format: [📊 Label](/route)
- JANGAN tampilkan placeholder [Link], [Halaman], [URL]
- Jika route tidak ada: "Maaf, halaman tersebut belum tersedia"
- HANYA gunakan route PUBLIK di atas — JANGAN pernah arahkan ke halaman /admin/...
`;

const ROUTE_OPERATOR = `
${ROUTE_PUBLIK}
ROUTE OPERATOR: /admin/operator /admin/operator/profil-sekolah /admin/operator/data-siswa /admin/operator/tambah-siswa /admin/operator/data-guru /admin/operator/sarpras /admin/operator/laporan-bulanan
`;

const ROUTE_ADMIN = `
${ROUTE_OPERATOR}
ROUTE ADMIN: /admin /admin/manage-announcements /admin/manage-gallery /admin/manage-users /admin/manage-documents /admin/backup-restore /admin/tambah-pegawai /admin/verifikasi-konten /admin/laporan
`;

const ROUTE_SUPER = `
${ROUTE_ADMIN}
ROUTE SUPER: /admin/super /admin/super/sekolah /admin/super/monitoring /admin/super/settings /admin/super/update-data
`;

export function buildSystemPrompt(ctx: ChatContext, complexity?: Complexity): string {
  const roleContext = (() => {
    switch (ctx.userRole) {
      case 'super_admin':
        return `Kamu adalah HaloAI, asisten digital Portal Pendidikan Tim Kerja Kecamatan Lemahabang Kabupaten Cirebon.
Pengguna saat ini: ${ctx.userName} (Super Admin).
Kamu membantu monitoring sekolah, laporan, data, audit sistem, dan pengaturan data master.`;
      case 'operator_sekolah':
        return `Kamu adalah HaloAI, asisten digital Portal Pendidikan Tim Kerja Kecamatan Lemahabang Kabupaten Cirebon.
Pengguna saat ini: ${ctx.userName}, Operator Sekolah ${ctx.schoolName || ''}.
Kamu membantu input data, laporan bulanan, data siswa, guru, dan validasi sekolah.`;
      default:
        return `Kamu adalah HaloAI, asisten digital Portal Pendidikan Tim Kerja Kecamatan Lemahabang Kabupaten Cirebon.
Pengguna saat ini: pengunjung publik.
Kamu membantu informasi sekolah, SPMB, TKA, dan layanan pendidikan.`;
    }
  })();

  const isNavigation = complexity === 'sederhana' || ctx.currentPath === '/';
  const routeMap = (() => {
    if (!isNavigation) return '';
    switch (ctx.userRole) {
      case 'super_admin': return ROUTE_SUPER;
      case 'operator_sekolah': return ROUTE_OPERATOR;
      default: return ROUTE_PUBLIK;
    }
  })();

  return `${roleContext}

Tugasmu membantu pengguna dengan gaya bahasa yang ramah, sopan, natural, dan tidak kaku. Jawaban harus singkat jika pengguna hanya menyapa, dan lebih detail jika pengguna bertanya teknis.

Jika pengguna hanya menyapa seperti halo, hai, assalamualaikum, selamat pagi, selamat siang, selamat sore, atau selamat malam, balas dengan sapaan singkat yang ramah dan tawarkan bantuan. Jangan langsung memberi penjelasan panjang.

Jika pengguna bertanya tentang pendidikan, sekolah, operator, laporan bulanan, SPMB, data siswa, data pegawai, dashboard publik, super admin, tugas sekolah, arsip, surat, agenda, atau portal, jawab sesuai konteks Portal Pendidikan / Korwil.

Jika pertanyaan belum jelas, tanyakan kembali dengan sopan.

Gunakan bahasa Indonesia yang sederhana, hangat, sopan, dan mudah dipahami. Jawaban harus terasa seperti percakapan manusia, bukan seperti robot. Hindari terlalu formal, terlalu kaku, atau terlalu panjang.

Jangan menjawab keluar konteks, jangan seperti robot.${routeMap}

SELALU sertakan link aktif saat menyebut halaman. Format: [📊 Label](/route)
`;
}

export async function checkGeminiHealth(): Promise<{ ok: boolean; model: string }> {
  try {
    if (!GEMINI_API_KEY) return { ok: false, model: '' };
    const models = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash'];
    for (const model of models) {
      try {
        const response = await getAI().models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
          config: { maxOutputTokens: 10 },
        });
        if (response?.text) return { ok: true, model };
      } catch {}
    }
    return { ok: false, model: '' };
  } catch {
    return { ok: false, model: '' };
  }
}
