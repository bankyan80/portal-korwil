import { cert, getApps, initializeApp } from 'firebase-admin/app';
import type { ServiceAccount } from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import * as path from 'path';
import * as fs from 'fs';

function loadServiceAccount(): ServiceAccount | null {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) as ServiceAccount;
    } catch {
      return null;
    }
  }

  const localPath = path.join(process.cwd(), 'service-account');
  if (!fs.existsSync(localPath)) return null;

  const files = fs.readdirSync(localPath).filter((f) => f.endsWith('.json'));
  if (files.length === 0) return null;

  try {
    const content = fs.readFileSync(path.join(localPath, files[0]), 'utf-8');
    return JSON.parse(content) as ServiceAccount;
  } catch {
    return null;
  }
}

const serviceAccount = loadServiceAccount();

export const isFirebaseAdminConfigured = Boolean(
  serviceAccount?.projectId || serviceAccount?.project_id
);

const app = isFirebaseAdminConfigured && !getApps().length && serviceAccount
  ? initializeApp({ credential: cert(serviceAccount) })
  : null;

export const adminAuth = app ? getAuth(app) : null;
export const adminDb = app ? getFirestore(app) : null;
export const adminStorage = app ? getStorage(app) : null;
