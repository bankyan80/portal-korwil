import canonicalSchools from '@/data/canonical-schools.json';
import { allSekolah } from '@/data/sekolah';

const prefixes = ['sd ', 'tk ', 'kb ', 'paud ', 'sps ', 'ra '];
const suffixes = [' kecamatan lemahabang', ' kec. lemahabang', ' kabupaten cirebon'];

export function normalizeSchool(name: string): string {
  if (!name) return '';
  let n = name.toLowerCase().trim();
  n = n.replace(/^sdn\s+/i, 'sd negeri ');
  for (const p of prefixes) { if (n.startsWith(p)) { n = n.slice(p.length); break; } }
  for (const s of suffixes) { if (n.endsWith(s)) { n = n.slice(0, -s.length); break; } }
  return n.trim();
}

const reverseMap = new Map<string, string>();

function buildReverseMap() {
  if (reverseMap.size > 0) return;
  for (const category of Object.values(canonicalSchools)) {
    for (const [canonical, variants] of Object.entries(category)) {
      for (const v of variants) {
        const key = normalizeSchool(v);
        if (!reverseMap.has(key)) {
          reverseMap.set(key, canonical);
        }
      }
    }
  }
}

export function getCanonicalSchoolName(name: string): string {
  if (!name) return '';
  buildReverseMap();
  const key = normalizeSchool(name);
  return reverseMap.get(key) || name;
}

const npsnBySchool = new Map<string, string>();
const sekolahByNpsn = new Map<string, string>();
let npsnMapsBuilt = false;

function buildNpsnMaps() {
  if (npsnMapsBuilt) return;
  npsnMapsBuilt = true;
  buildReverseMap();
  for (const s of allSekolah) {
    const canon = getCanonicalSchoolName(s.nama);
    npsnBySchool.set(canon, s.npsn);
    npsnBySchool.set(canon.toLowerCase(), s.npsn);
    npsnBySchool.set(s.nama, s.npsn);
    sekolahByNpsn.set(s.npsn, canon);
  }
}

export function getNpsnBySchool(name: string): string {
  if (!name) return '';
  buildNpsnMaps();
  const canon = getCanonicalSchoolName(name);
  return npsnBySchool.get(canon) || npsnBySchool.get(canon.toLowerCase()) || '';
}

export function getSchoolByNpsn(npsn: string): string {
  if (!npsn) return '';
  buildNpsnMaps();
  return sekolahByNpsn.get(npsn) || '';
}

const romanMap: Record<string, string> = {
  i: '1', ii: '2', iii: '3', iv: '4', v: '5', vi: '6',
  vii: '7', viii: '8', ix: '9', x: '10',
};

export function normalizeKelas(kelas: string, jenjang: string): string {
  if (!kelas) return jenjang === 'SD' ? '1' : 'A';
  let k = kelas.trim().toUpperCase();
  // Already a simple number: "1", "2" etc
  if (/^\d+$/.test(k)) return k;
  // "KELAS 1", "KELAS 1 A" etc → "1A"
  k = k.replace(/^KELAS\s+/i, '');
  // Extract leading roman numeral: "I A" → I → 1
  const romanMatch = k.match(/^([IVXLCDM]+)/);
  if (romanMatch) {
    const arabic = romanMap[romanMatch[1].toLowerCase()];
    if (arabic) {
      return arabic; // return just the grade number, sub-classes (A/B/C) merged
    }
  }
  // Strip trailing sub-class letters for SD: "1A" → "1", "2B" → "2"
  if (jenjang === 'SD') {
    const numMatch = k.match(/^(\d+)/);
    if (numMatch) return numMatch[1];
  }
  return k;
}
