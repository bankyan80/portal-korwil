const API_KEY = 'AIzaSyB-cPcIPE_o4mYfAz0ebn_mMRcfxq5PXT4';

const SUBFOLDERS = [
  { id: '1fZqr7K_wb_hVEdHrklurz-CbbtPE2ilr', name: 'PAUD AN NAIM' },
  { id: '1ejV4s5AnW7H55JJBf_jeW1HyWRJ1m05O', name: 'PAUD ASY SYAFIIYAH' },
  { id: '1Mhua2m-805pPSiFLet_4qJbd2qVNS-3J', name: 'PAUD BUDGENVIL' },
];

async function listFiles(folderId) {
  const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,size,modifiedTime)&key=${API_KEY}`;

  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Referer': 'https://drive.google.com/',
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text.slice(0, 300)}`);
  }

  return res.json();
}

async function main() {
  for (const folder of SUBFOLDERS) {
    console.log(`\n=== ${folder.name} (${folder.id}) ===`);

    try {
      const data = await listFiles(folder.id);
      const files = data.files || [];
      console.log(`Files found: ${files.length}`);

      if (files.length === 0) {
        console.log('  (empty folder)');
      }

      for (const f of files) {
        const type = f.mimeType === 'application/vnd.google-apps.folder'
          ? '[FOLDER]'
          : f.mimeType === 'application/vnd.google-apps.spreadsheet'
          ? '[SHEET]'
          : `[${f.mimeType}]`;
        const size = f.size ? `${(parseInt(f.size) / 1024).toFixed(1)} KB` : '(native)';
        console.log(`  ${type.padEnd(30)} ${f.id}  ${size.padEnd(12)} ${f.name}`);
      }
    } catch (err) {
      console.log(`  ERROR: ${err.message}`);
    }
  }
}

main().catch(console.error);
