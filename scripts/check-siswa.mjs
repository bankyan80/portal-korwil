import { readFileSync } from 'fs';

const data = JSON.parse(readFileSync('src/data/data-siswa.json', 'utf-8'));

// Filter Cipeujeuh Kulon
const filtered = data.filter(s => s.sekolah && s.sekolah.toLowerCase().includes('cipeujeuh kulon'));

// Group by exact school name
const groups = {};
for (const s of filtered) {
  if (!groups[s.sekolah]) groups[s.sekolah] = 0;
  groups[s.sekolah]++;
}

console.log('Total data siswa di JSON:', data.length);
console.log('Total siswa Cipeujeuh Kulon:', filtered.length);
console.log('\nVariasi nama sekolah Cipeujeuh Kulon:');
Object.entries(groups).sort().forEach(([k, v]) => {
  console.log(`  - "${k}": ${v} siswa`);
});

// Check if "SD NEGERI 1 CIPEUJEUH KULON" exists exactly
const exact = data.filter(s => s.sekolah === 'SD NEGERI 1 CIPEUJEUH KULON');
console.log(`\nExact "SD NEGERI 1 CIPEUJEUH KULON": ${exact.length} siswa`);

// Check format normalization
const normMap = {};
for (const s of data) {
  if (!s.sekolah) continue;
  const norm = s.sekolah.toLowerCase().replace(/\./g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (norm.includes('cipeujeuh kulon') && !norm.includes('negeri 1 cipeujeuh kulon')) {
    normMap[s.sekolah] = (normMap[s.sekolah] || 0) + 1;
  }
}

console.log('\nVariasi lain Cipeujeuh Kulon (bukan "negeri 1"):');
Object.entries(normMap).sort().forEach(([k, v]) => {
  console.log(`  - "${k}": ${v} siswa`);
});