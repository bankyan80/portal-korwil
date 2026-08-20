import XLSX from "xlsx";

const wb = XLSX.readFile("data-pegawai-SEMUA-NEGERI.xlsx");
const withNip = XLSX.utils.sheet_to_json(wb.Sheets["Pegawai (dengan NIP)"], { header: 1, defval: "" }).slice(1);

function norm(name) {
  return String(name || "").toUpperCase()
    .replace(/\b(S\.PD|S\.PD\.I|S\.PDI|S\.PD\.SD|GR)\b/g, "")
    .replace(/[^A-Z]/g, "")
    .trim();
}

const list = [
  ["MUHAMAD SYAHRUL EFENDI", "199911152025211031"],
  ["ASIATUL FAUZIAH", "198709092025212107"],
  ["CARWINAH", "198303152025212108"],
  ["DIYAN HIDAYAT", "199302092025211085"],
  ["SRI NURCHAENI", "197605182025212033"],
  ["YUDHA NUGRAHA", "199711252025211087"],
  ["NURUL HIKMAH.S.Pd.SD", "198507252025212055"],
  ["KARYATI, S.Pd.I", "197902022025212040"],
  ["RAHMAH YULIA, S.Pd", "199007162025212090"],
  ["RAHMAT", "197505032025211057"],
  ["AAN FITRIANANI, S.Pd.", "198705272025212081"],
  ["NANA JUNAEDI", "197310122025211042"],
  ["AGUS MAULANA", "198811102025211144"],
  ["GARNIS NURUL FATHONAH", "199411072025212060"],
  ["ICA ANISAH, S.Pd.", "199709162025212054"],
  ["FARIZIAH AMBARSARI", "199903242025212046"],
  ["IMANURDIN RAMADON", "197109062025211029"],
  ["SHEPTA", "199307242025211075"],
  ["ISMAWATI", "199612132025212054"],
  ["HERI KUSWANTO, S.Pd.", "199201012025211199"],
  ["MEIGY IRMA OKTAVERINA, S.Pd.,Gr.", "19990522205212039"],
  ["MOCHAMAD RAMDHANI", "199901092025211041"],
  ["ISLAMIATI ISTIQOMAH", "199605242025212064"],
  ["ADE SUBUR SUGIHARTO", "19770509 2025211048"],
  ["SITI SOLAEHA", "19840402 2025212090"],
  ["MERTYANI RAHAYU", "199403102025212080"],
  ["FAJAR DEDI MIFTAKHUDDIN", "199510062025211079"],
  ["FIRMAN AWALUDIN", "19890306 2025211071"],
  ["YULIAN SABITNI AMANAH, S.Pd.", "199707032025212074"],
  ["NANA MULYANA", "197310102025211056"],
  ["SUPRIHATIN", "199712112025212060"],
  ["NUNUNG HERAWATI", "198912092025212085"],
  ["MAR'ATUN SHOLEHAH, S.Pd.", "199306112025212093"],
  ["SOFROH", "198705102025212104"],
  ["AZI PURNAMA", "198911112025211114"],
  ["GOFUR", "198503202025211091"],
  ["MARTININGSIH", "198803092025212064"],
  ["HENDRA PERMANA", "197505112025211053"],
  ["SUNANDAR", "197610132025211042"],
  ["SITI NURLAELASARI", "198701242025212055"],
  ["WACHYUDIN", "197309152025211052"],
  ["PUTRA JAYADI", "200301242025211008"],
  ["JUNI", "197606112025212028"],
  ["EEN SUNARYA", "197006172025211050"],
  ["ADANG MAULANA", "197510142025211033"],
  ["ENDANG KASMARA", "198007312025211041"],
  ["SAEFUL ALIM", "199108272025211057"],
  ["FAJAR SIDIK", "200104062025211027"],
  ["ADE SETIA MAULANA", "199906292025211051"],
];

const listMap = new Map(list.map(([n, nip]) => [norm(n), nip.replace(/\s/g, "")]));

console.log("=== NAMA DI LIST YANG SUDAH ADA DI DATA (dengan NIP) ===");
let count = 0;
for (const [n, nipRaw] of list) {
  const nip = nipRaw.replace(/\s/g, "");
  const hits = withNip.filter((r) => norm(r[2]) === norm(n));
  for (const h of hits) {
    const existing = String(h[0]).trim();
    const same = existing === nip;
    console.log((same ? "SAMA    " : "BEDA    ") + "| " + n + " | existing=" + existing + " | npppk=" + nip + " | " + h[5]);
    count++;
  }
}
console.log("total cocok:", count);

console.log("\n=== DAFTAR PENUH dengan kolom [NIP, NIK, Nama, Unit] untuk yang di list (cocok di dengan-NIP) ===");
withNip.forEach((r) => {
  const hit = listMap.get(norm(r[2]));
  if (hit && String(r[0]).trim() === hit) console.log(JSON.stringify(r.slice(0, 8)));
});