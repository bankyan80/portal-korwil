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
