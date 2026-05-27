import { google } from 'googleapis';
import { readFileSync } from 'fs';

const FOLDER_ID = '156LDwGxBLRZxwMfQ5m1yQSi_pEl2_MUz';

async function main() {
  // Try without API key (public folder)
  const drive = google.drive({ version: 'v3' });

  try {
    const res = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, size, modifiedTime)',
      pageSize: 100,
    });

    const files = res.data.files || [];
    console.log(`Total files/folders: ${files.length}\n`);

    for (const f of files) {
      const type = f.mimeType === 'application/vnd.google-apps.folder' ? '[FOLDER]' : `[${f.mimeType}]`;
      const size = f.size ? `${(parseInt(f.size) / 1024).toFixed(1)} KB` : '-';
      console.log(`${type.padEnd(50)} ${f.id}  ${size.padEnd(10)} ${f.name}`);
    }
  } catch (e) {
    console.log('Direct API error:', e.message);
    console.log('Trying with API key...');

    // Try with a public API key
    const drive2 = google.drive({ version: 'v3', auth: 'AIzaSyA-...' });
    try {
      const res = await drive2.files.list({
        q: `'${FOLDER_ID}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType, size)',
      });
      const files = res.data.files || [];
      console.log(`Total: ${files.length}`);
      for (const f of files) {
        console.log(`${f.id}  ${f.name}  ${f.mimeType}`);
      }
    } catch (e2) {
      console.log('API key error:', e2.message);
    }
  }
}

main().catch(console.error);
