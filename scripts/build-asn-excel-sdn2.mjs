import XLSX from "xlsx";
import fs from "fs";
import path from "path";

const ROOT = "data-pegawai";

function isNegeri(name) {
  if (/SDN\s+\d/i.test(name)) return true;
  if (name === "TK NEGERI LEMAHABANG") return true;
  return false;
}

function canonicalSchool(name) {
  const raw = name.replace(/^(DAFTAR GURU DAN TENDIK[ _]*|DATA GURU DAN TENDIK[ _]*|Data Guru dan Tendik[ _]*|Dapodik[ _]*)/i, "").replace(/^Dapodik\s*/i, "").trim();
  const norm = raw.replace(/\s+/g, " ").trim();
  const canon = {
    "SDN 1 ASEM": "SD NEGERI 1 ASEM",
    "SDN 1 BELAWA": "SD NEGERI 1 BELAWA",
    "SDN 1 CIPEUJEUH KULON": "SD NEGERI 1 CIPEUJEUH KULON",
    "SDN 1 CIPEUJEUH WETAN": "SD NEGERI 1 CIPEUJEUH WETAN",
    "SDN 1 LEMAHABANG": "SD NEGERI 1 LEMAHABANG",
    "SDN 1 LEMAHABANG KULON": "SD NEGERI 1 LEMAHABANG KULON",
    "SDN 1 LEUWIDINGDING": "SD NEGERI 1 LEUWIDINGDING",
    "SDN 1 PICUNGPUGUR": "SD NEGERI 1 PICUNGPUGUR",
    "SDN 1 SARAJAYA": "SD NEGERI 1 SARAJAYA",
    "SDN 1 SIGONG": "SD NEGERI 1 SIGONG",
    "SDN 1 SINDANGLAUT": "SD NEGERI 1 SINDANGLAUT",
    "SDN 1 TUK KARANGSUWUNG": "SD NEGERI 1 TUK KARANGSUWUNG",
    "SDN 1 WANGKELANG": "SD NEGERI 1 WANGKELANG",
    "SDN 2 BELAWA": "SD NEGERI 2 BELAWA",
    "SDN 2 CIPEUJEUH KULON": "SD NEGERI 2 CIPEUJEUH KULON",
    "SDN 2 CIPEUJEUH WETAN": "SD NEGERI 2 CIPEUJEUH WETAN",
    "SDN 2 LEMAHABANG": "SD NEGERI 2 LEMAHABANG",
    "SDN 2 SARAJAYA": "SD NEGERI 2 SARAJAYA",
    "SDN 3 CIPEUJEUH WETAN": "SD NEGERI 3 CIPEUJEUH WETAN",
    "SDN 3 SIGONG": "SD NEGERI 3 SIGONG",
    "SDN 4 SIGONG": "SD NEGERI 4 SIGONG",
    "TK NEGERI LEMAHABANG": "TK NEGERI LEMAHABANG",
  };
  return canon[norm] || norm;
}

const TARGETS = fs
  .readdirSync(ROOT, { withFileTypes: true })
  .filter((e) => e.isDirectory() && isNegeri(e.name))
  .map((e) => e.name)
  .sort();

const PANGKAT_MAP = {
  "I/a": "Juru Muda", "I/b": "Juru Muda Tk.I", "I/c": "Juru", "I/d": "Juru Tk.I",
  "II/a": "Pengatur Muda", "II/b": "Pengatur Muda Tk.I", "II/c": "Pengatur", "II/d": "Pengatur Tk.I",
  "III/a": "Penata Muda", "III/b": "Penata Muda Tk.I", "III/c": "Penata", "III/d": "Penata Tk.I",
  "IV/a": "Pembina", "IV/b": "Pembina Tk.I", "IV/c": "Pembina Utama Muda",
  "IV/d": "Pembina Utama Madya", "IV/e": "Pembina Utama",
};

function statusMap(s) {
  const v = String(s || "").trim();
  if (/^PNS$/i.test(v)) return "PNS";
  if (/^PPPK/i.test(v)) return "PPPK";
  return "LAINNYA";
}

function readSheet(file, school) {
  const wb = XLSX.readFile(file, { cellDates: true });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "" });
  const hdr = rows[4] || rows[0];
  const idx = (name) => hdr.indexOf(name);
  const iNama = idx("Nama"), iNip = idx("NIP"), iPangk = idx("Pangkat Golongan"),
    iJenis = idx("Jenis PTK"), iTugas = idx("Tugas Tambahan"), iStatus = idx("Status Kepegawaian"),
    iEmail = idx("Email"), iHp = idx("HP"), iAlamat = idx("Alamat Jalan"), iDesa = idx("Desa/Kelurahan"),
    iNik = idx("NIK");

  const out = [];
  for (let i = 5; i < rows.length; i++) {
    const r = rows[i];
    if (!r || String(r[0]).trim() === "" || !r[iNama]) continue;
    const nip = String(r[iNip] || "").trim();
    const nama = String(r[iNama] || "").trim();
    if (!nip && !nama) continue;
    const gol = String(r[iPangk] || "").trim();
    const status = statusMap(r[iStatus]);
    let jabatan = String(r[iJenis] || "").trim();
    if (jabatan === "Kepala Sekolah") jabatan = "Kepala Sekolah";
    const tugas = String(r[iTugas] || "").trim();
    if (tugas) jabatan = jabatan ? jabatan + " (" + tugas + ")" : tugas;
    const alamat = [String(r[iAlamat] || "").trim(), String(r[iDesa] || "").trim()].filter(Boolean).join(", ");
    out.push({
      nip,
      nik: String(r[iNik] || "").trim(),
      nama,
      pangkat: PANGKAT_MAP[gol] || "",
      golongan: gol,
      jabatan,
      unit_kerja: school,
      status,
      email: String(r[iEmail] || "").trim(),
      no_hp: String(r[iHp] || "").trim(),
      alamat,
    });
  }
  return out;
}

let all = [];
for (const t of TARGETS) {
  const dir = path.join(ROOT, t);
  if (!fs.existsSync(dir)) { console.log("LEWAT (folder tidak ada):", t); continue; }
  const files = fs.readdirSync(dir).filter((f) => /\.xlsx$/i.test(f));
  const school = canonicalSchool(t);
  let schoolRows = [];
  for (const f of files) {
    const rows = readSheet(path.join(dir, f), school);
    console.log(t, "->", f.split("-")[0], rows.length, "baris");
    schoolRows = schoolRows.concat(rows);
  }
  all = all.concat(schoolRows);
}

const seen = new Set();
const uniq = all.filter((r) => {
  if (!r.nip) return true;
  const k = r.nip;
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

console.log("TOTAL baris:", all.length, "| unik:", uniq.length);

const header = ["NIP", "NIK", "Nama", "Pangkat", "Golongan", "Jabatan", "Unit Kerja", "Status", "Email", "No HP", "Alamat"];

const NIPPPK_MAP = {
  "MUHAMAD SYAHRUL EFENDI": "199911152025211031",
  "ASIATUL FAUZIAH": "198709092025212107",
  "CARWINAH": "198303152025212108",
  "DIYAN HIDAYAT": "199302092025211085",
  "SRI NURCHAENI": "197605182025212033",
  "YUDHA NUGRAHA": "199711252025211087",
  "NURUL HIKMAH.S.Pd.SD": "198507252025212055",
  "KARYATI, S.Pd.I": "197902022025212040",
  "RAHMAH YULIA, S.Pd": "199007162025212090",
  "RAHMAT": "197505032025211057",
  "AAN FITRIANANI, S.Pd.": "198705272025212081",
  "NANA JUNAEDI": "197310122025211042",
  "AGUS MAULANA": "198811102025211144",
  "GARNIS NURUL FATHONAH": "199411072025212060",
  "ICA ANISAH, S.Pd.": "199709162025212054",
  "FARIZIAH AMBARSARI": "199903242025212046",
  "IMANURDIN RAMADON": "197109062025211029",
  "SHEPTA": "199307242025211075",
  "ISMAWATI": "199612132025212054",
  "HERI KUSWANTO, S.Pd.": "199201012025211199",
  "MEIGY IRMA OKTAVERINA, S.Pd.,Gr.": "199905222025212039",
  "MOCHAMAD RAMDHANI": "199901092025211041",
  "ISLAMIATI ISTIQOMAH": "199605242025212064",
  "ADE SUBUR SUGIHARTO": "197705092025211048",
  "SITI SOLAEHA": "198404022025212090",
  "MERTYANI RAHAYU": "199403102025212080",
  "FAJAR DEDI MIFTAKHUDDIN": "199510062025211079",
  "FIRMAN AWALUDIN": "198903062025211071",
  "YULIAN SABITNI AMANAH, S.Pd.": "199707032025212074",
  "NANA MULYANA": "197310102025211056",
  "SUPRIHATIN": "199712112025212060",
  "NUNUNG HERAWATI": "198912092025212085",
  "MAR'ATUN SHOLEHAH, S.Pd.": "199306112025212093",
  "SOFROH": "198705102025212104",
  "AZI PURNAMA": "198911112025211114",
  "GOFUR": "198503202025211091",
  "MARTININGSIH": "198803092025212064",
  "HENDRA PERMANA": "197505112025211053",
  "SUNANDAR": "197610132025211042",
  "SITI NURLAELASARI": "198701242025212055",
  "WACHYUDIN": "197309152025211052",
  "PUTRA JAYADI": "200301242025211008",
  "JUNI": "197606112025212028",
  "EEN SUNARYA": "197006172025211050",
  "ADANG MAULANA": "197510142025211033",
  "ENDANG KASMARA": "198007312025211041",
  "SAEFUL ALIM": "199108272025211057",
  "FAJAR SIDIK": "200104062025211027",
  "ADE SETIA MAULANA": "199906292025211051",
};
function norm(name) {
  return String(name || "").toUpperCase()
    .replace(/\b(S\.PD|S\.PD\.I|S\.PDI|S\.PD\.SD|GR)\b/g, "")
    .replace(/[^A-Z]/g, "")
    .trim();
}
const normToNip = new Map(Object.entries(NIPPPK_MAP).map(([n, nip]) => [norm(n), nip.replace(/\s/g, "")]));

let filled = 0, deleted = 0;
const finalRows = [];
const deletedRows = [];
for (const r of uniq) {
  if (!r.nip) {
    const newNip = normToNip.get(norm(r.nama));
    if (newNip) {
      r.nip = newNip;
      r.status = "PPPK";
      filled++;
    } else {
      deletedRows.push(r);
      deleted++;
      continue;
    }
  }
  finalRows.push(r);
}

const withNip = finalRows.filter((r) => r.nip);
const withoutNip = finalRows.filter((r) => !r.nip);
const toRow = (r) => [r.nip, r.nik, r.nama, r.pangkat, r.golongan, r.jabatan, r.unit_kerja, r.status, r.email, r.no_hp, r.alamat];
const aoa = [header, ...finalRows.map(toRow)];
const aoaNip = [header, ...withNip.map(toRow)];
const aoaNoNip = [header, ...withoutNip.map(toRow)];

const wch = [18, 18, 26, 18, 10, 22, 28, 10, 30, 16, 40];
const ws = XLSX.utils.aoa_to_sheet(aoa);
ws["!cols"] = header.map((h, i) => ({ wch: wch[i] }));
const ws2 = XLSX.utils.aoa_to_sheet(aoaNip);
ws2["!cols"] = header.map((h, i) => ({ wch: wch[i] }));
const ws3 = XLSX.utils.aoa_to_sheet(aoaNoNip);
ws3["!cols"] = header.map((h, i) => ({ wch: wch[i] }));

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Semua Pegawai");
XLSX.utils.book_append_sheet(wb, ws2, "Pegawai (dengan NIP)");
XLSX.utils.book_append_sheet(wb, ws3, "Tanpa NIP");
const wsDel = XLSX.utils.aoa_to_sheet([header, ...deletedRows.map(toRow)]);
wsDel["!cols"] = header.map((h, i) => ({ wch: wch[i] }));
XLSX.utils.book_append_sheet(wb, wsDel, "Honor tanpa NIP (dihapus)");
const OUT = "data-pegawai-SEMUA-NEGERI.xlsx";
XLSX.writeFile(wb, OUT);
console.log("File dibuat:", OUT);
console.log("Total:", finalRows.length, "| NIP diisi dari NIPPPK:", filled, "| Honor tanpa NIP dihapus:", deleted);
console.log("Dengan NIP:", withNip.length, "| Tanpa NIP (honor/paruh waktu):", withoutNip.length);

const perSchool = {};
for (const r of withNip) perSchool[r.unit_kerja] = (perSchool[r.unit_kerja] || 0) + 1;
console.log("Per sekolah (dengan NIP):", JSON.stringify(perSchool, null, 1));