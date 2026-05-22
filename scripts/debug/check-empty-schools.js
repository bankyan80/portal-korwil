const fs = require('fs');

// Parse school names + jenjang from rombel.ts
const rombelRaw = fs.readFileSync('src/data/rombel.ts', 'utf8');
const schools = {};
[...rombelRaw.matchAll(/\{\s*name:\s*'([^']+)',\s*jenjang:\s*'([^']+)'/g)]
  .forEach(m => { schools[m[1]] = m[2]; });
console.log('Schools in rombel.ts:', Object.keys(schools).length);

// Count students per escuela in data-siswa.json
const data = JSON.parse(fs.readFileSync('src/data/data-siswa.json', 'utf8'));
const schoolsInJson = {};
data.forEach(s => {
  if (s.sekolah) schoolsInJson[s.sekolah] = (schoolsInJson[s.sekolah] || 0) + 1;
});
console.log('Schools with students:', Object.keys(schoolsInJson).length);

// Find schools with zero students
console.log('\n=== Schools with NO student records ===');
for (const [name, jenjang] of Object.entries(schools)) {
  const cnt = schoolsInJson[name] || 0;
  if (cnt === 0) {
    console.log(`  [ZERO] ${name}  (${jenjang})`);
  }
}

console.log('\n=== Schools with student records ===');
for (const [name, jenjang] of Object.entries(schools)) {
  const cnt = schoolsInJson[name] || 0;
  if (cnt > 0) {
    console.log(`  [${cnt}] ${name}  (${jenjang})`);
  }
}
