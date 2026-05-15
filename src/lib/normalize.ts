const prefixes = ['sd ', 'tk ', 'kb ', 'paud ', 'sps ', 'ra '];
const suffixes = [' kecamatan lemahabang', ' kec. lemahabang', ' kabupaten cirebon'];

export function normalizeSchool(name: string): string {
  if (!name) return '';
  let n = name.toLowerCase().trim();
  // Normalize "sdn " → "sd negeri " so both variants match
  n = n.replace(/^sdn\s+/i, 'sd negeri ');
  for (const p of prefixes) { if (n.startsWith(p)) { n = n.slice(p.length); break; } }
  for (const s of suffixes) { if (n.endsWith(s)) { n = n.slice(0, -s.length); break; } }
  return n.trim();
}
