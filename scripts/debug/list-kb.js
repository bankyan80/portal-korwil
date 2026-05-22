const fs = require('fs');
const rombelRaw = fs.readFileSync('src/data/rombel.ts','utf8');
const blocks = rombelRaw.split('},');
let kbSchools = [];
for (const block of blocks) {
  if (block.includes("jenjang: 'KB'")) {
    const totalMatch = block.match(/total:\s*(\d+)/);
    const nameMatch = block.match(/name:\s*'([^']+)'/);
    if (totalMatch && nameMatch) {
      kbSchools.push({
        name: nameMatch[1],
        total: parseInt(totalMatch[1])
      });
    }
  }
}
console.log('KB schools:');
kbSchools.forEach(s => {
  console.log(`  ${s.name}: ${s.total}`);
});
const zero = kbSchools.filter(s => s.total === 0);
console.log('\nKB schools with zero students:');
if (zero.length === 0) {
  console.log('  None');
} else {
  zero.forEach(s => {
    console.log(`  ${s.name}: ${s.total}`);
  });
}