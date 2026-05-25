import { google } from 'googleapis';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const creds = JSON.parse(readFileSync(join(__dirname, '..', 'service-account', readdirSync(join(__dirname, '..', 'service-account')).filter(f => f.endsWith('.json'))[0]), 'utf-8'));
const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/drive'] });
const drive = google.drive({ version: 'v3', auth });

async function main() {
  // Delete test forms
  const formsRes = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.form' and trashed=false",
    fields: 'files(id,name)',
  });
  for (const f of formsRes.data.files || []) {
    console.log('Delete form:', f.name, f.id);
    await drive.files.delete({ fileId: f.id }).catch(e => console.log('  fail:', e.message));
  }

  // Delete TEST files
  const testRes = await drive.files.list({
    q: "name contains 'TEST' and trashed=false",
    fields: 'files(id,name)',
  });
  for (const f of testRes.data.files || []) {
    console.log('Delete file:', f.name, f.id);
    await drive.files.delete({ fileId: f.id }).catch(e => console.log('  fail:', e.message));
  }

  const about = await drive.about.get({ fields: 'storageQuota' });
  console.log('Storage:', JSON.stringify(about.data.storageQuota));
}

main().catch(e => console.error(e.message));
