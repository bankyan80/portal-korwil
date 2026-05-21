import canonicalSchools from '@/data/canonical-schools.json';

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
