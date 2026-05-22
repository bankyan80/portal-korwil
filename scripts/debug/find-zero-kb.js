const fs = require('fs');
const rombelRaw = fs.readFileSync('src/data/rombel.ts','utf8');
const blocks = rombelRaw.split('},');
let kbZero = [];
for (const block of blocks) {
  if (block.includes("jenjang: 'KB'")) {
    const totalMatch = block.match(/total:\s*(\d+)/);
    if (totalMatch) {
      const total = parseInt(totalMatch[1]);
      if (total === 0) {
        const nameMatch = block.match(/name:\s*'([^']+)'/);
        if (nameMatch) {
          kbZero.push(nameMatch[1]);
        }
      }
    }
  }
}
console.log('KB schools with zero students:', kbZero);
if (kbZero.length === 0) {
  console.log('None');
}