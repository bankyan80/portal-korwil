// check-zero-schools.js  (final report version)
const fs = require('fs');

const rombeltRaw = fs.readFileSync('src/data/rombel.ts', 'utf8');
const rombeltSchools = [];
for (const m of rombeltRaw.matchAll(/name:\s*'([^']+)'\s*,\s*jenjang/g)) {
  rombeltSchools.push(m[1]);
}

const siswa = JSON.parse(fs.readFileSync('src/data/data-siswa.json', 'utf8'));

// sekolahMap = actual "sekolah" field values from siswa records
const sekolahMap = {};
for (const s of siswa) {
  const k = s.sekolah;
  sekolahMap[k] = (sekolahMap[k] || 0) + 1;
}

function matchSchool(X, sekolahMap) {
  if (sekolahMap[X] !== undefined) return { key: X, count: sekolahMap[X] };
  if (X.startsWith('SD ')) {
    const withoutSD = X.replace(/^SD\s+/i, '');
    if (sekolahMap[withoutSD] !== undefined) return { key: withoutSD, count: sekolahMap[withoutSD] };
    const m = X.match(/^SD\s+NEGERI\s+(\d+)\s+(.+)/i);
    if (m) {
      const sdn = `SDN ${m[1]} ${m[2]}`;
      if (sekolahMap[sdn] !== undefined) return { key: sdn, count: sekolahMap[sdn] };
    }
    for (const [k, v] of Object.entries(sekolahMap)) {
      if (withoutSD.includes(k) || k.includes(withoutSD)) return { key: k, count: v };
    }
  }
  const pfx = X.replace(/^(TK|KB|PAUD)\s+/i, '');
  if (sekolahMap[pfx] !== undefined) return { key: pfx, count: sekolahMap[pfx] };
  for (const [k, v] of Object.entries(sekolahMap)) {
    if (X.includes(k) || k.includes(X)) return { key: k, count: v };
  }
  return { key: 'NOT FOUND', count: 0 };
}

console.log('=== FINAL REPORT: Rombelt School → Student Count ===\n');
console.log(`${'Rombelt Name'.padEnd(50)} → ${'Siswa Key'.padEnd(55)} Count`);
console.log('-'.repeat(120));

const zero = [];
for (const name of rombeltSchools) {
  const { key, count } = matchSchool(name, sekolahMap);
  const line = `${name.padEnd(50)} → ${key.padEnd(55)} ${count}`;
  if (count === 0) {
    zero.push({ rombelt: name, siswaKey: key });
    console.log(`⚠  ${line}`);
  } else {
    console.log(`   ${line}`);
  }
}

console.log('\n=== RESULT 1: Schools with ZERO students ===');
if (zero.length === 0) {
  console.log('None — ALL 34 rombelt schools have at least 1 student in data-siswa.json.');
} else {
  for (const r of zero) {
    console.log(`  rombelt: "${r.rombelt}"  →  siswa key: "${r.siswaKey}"`);
  }
}

console.log('\n=== RESULT 2: Siswa key for every rombelt school ===');
for (const name of rombeltSchools) {
  const { key, count } = matchSchool(name, sekolahMap);
  console.log(`  "${name}"  →  "${key}"  (${count} students)`);
}
