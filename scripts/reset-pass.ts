import { cert, getApps, getApp, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

const API_KEY = 'AIzaSyBnILMRQYvxTneBoXPilKPrmz7qknNRl_4';
const EMAIL = 'yanuarhidayat80@gmail.com';

async function main() {
  // Init Firebase Admin
  const dir = path.join(process.cwd(), 'service-account');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  if (!files.length) { console.error('No service account found'); process.exit(1); }
  const sa = JSON.parse(fs.readFileSync(path.join(dir, files[0]), 'utf-8'));
  const app = getApps().length ? getApp() : initializeApp({ credential: cert(sa) });

  // Lookup user by email
  const user = await getAuth(app).getUserByEmail(EMAIL);
  console.log('User found:', user.uid, user.email);

  // Reset password
  await getAuth(app).updateUser(user.uid, { password: 'Admin123!' });
  console.log('Password reset to: Admin123!');
}

main().catch(e => { console.error(e); process.exit(1); });
