import { cert, getApps, initializeApp } from 'firebase-admin/app';
import type { ServiceAccount } from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import * as path from 'path';
import * as fs from 'fs';

function normalizePrivateKey(privateKey: string) {
  return privateKey.replace(/\\n/g, '\n');
}

function findServiceAccountFile(): string | null {
  // 1) Env var (raw JSON string or base64)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const envVal = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    console.info(`[firebase-admin] FIREBASE_SERVICE_ACCOUNT_KEY found, length: ${envVal.length}`);
    try {
      JSON.parse(envVal!);
      console.info(`[firebase-admin] FIREBASE_SERVICE_ACCOUNT_KEY parsed as JSON successfully`);
      return '__env__';
    } catch (e1) {
      console.warn(`[firebase-admin] FIREBASE_SERVICE_ACCOUNT_KEY JSON parse failed:`, (e1 as Error).message);
      try {
        const decoded = Buffer.from(envVal!, 'base64').toString('utf-8');
        JSON.parse(decoded);
        console.info(`[firebase-admin] FIREBASE_SERVICE_ACCOUNT_KEY parsed as base64 successfully`);
        return '__env_b64__';
      } catch (e2) {
        console.warn(`[firebase-admin] FIREBASE_SERVICE_ACCOUNT_KEY base64 decode also failed:`, (e2 as Error).message);
      }
    }
  } else {
    console.warn(`[firebase-admin] FIREBASE_SERVICE_ACCOUNT_KEY env var is not set`);
  }

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    console.info('[firebase-admin] Using service-account from split FIREBASE_* env vars');
    return '__env_split__';
  }

  // 2) Local development fallback. Production should use FIREBASE_SERVICE_ACCOUNT_KEY.
  const serviceAccountDir = path.join(/*turbopackIgnore: true*/ process.cwd(), 'service-account');
  const candidates = [serviceAccountDir];

  for (const dir of candidates) {
    if (!fs.existsSync(/*turbopackIgnore: true*/ dir)) continue;
    const files = fs.readdirSync(/*turbopackIgnore: true*/ dir).filter((f) => f.endsWith('.json'));
    if (files.length > 0) {
      console.info(`[firebase-admin] Using service-account from: ${path.join(dir, files[0])}`);
      return path.join(dir, files[0]);
    }
  }

  return null;
}

function loadServiceAccount(): ServiceAccount | null {
  const matched = findServiceAccountFile();
  if (!matched) {
    console.warn('[firebase-admin] No service-account file found. FIREBASE_SERVICE_ACCOUNT_KEY env var may also be unset.');
    return null;
  }

  try {
    if (matched === '__env__') {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!) as ServiceAccount;
    }
    if (matched === '__env_b64__') {
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!, 'base64').toString('utf-8');
      return JSON.parse(decoded) as ServiceAccount;
    }
    if (matched === '__env_split__') {
      return {
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY!),
      } as ServiceAccount;
    }
    const content = fs.readFileSync(/*turbopackIgnore: true*/ matched, 'utf-8');
    return JSON.parse(content) as ServiceAccount;
  } catch (err) {
    console.error(`[firebase-admin] Failed to load service-account from ${matched}:`, err);
    return null;
  }
}

export const serviceAccount = loadServiceAccount();

export function getServiceAccount(): ServiceAccount | null {
  return serviceAccount;
}

export const isFirebaseAdminConfigured = Boolean(
  serviceAccount?.projectId
);

const app = isFirebaseAdminConfigured && !getApps().length && serviceAccount
  ? initializeApp({ credential: cert(serviceAccount) })
  : null;

export const adminAuth = app ? getAuth(app) : null;
export const adminDb = app ? getFirestore(app) : null;
export const adminStorage = app ? getStorage(app) : null;
