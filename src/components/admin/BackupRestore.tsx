'use client';

import { useState, useRef } from 'react';
import {
  collection,
  getDocs,
  writeBatch,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Database,
  Download,
  Upload,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  mockMenus,
  mockAnnouncements,
  mockGalleryItems,
  mockOrganizations,
  mockInstitutionLinks,
  mockUsers,
  mockBosData,
  mockKipSd,
  mockYatimPiatu,
} from '@/lib/mock-data';

const COLLECTIONS = [
  'kip_sd',
  'yatim_piatu',
  'dokumen',
  'agenda',
  'bos_arkas',
  'announcements',
  'gallery',
  'organizations',
  'institution_links',
  'menus',
  'users',
  'students',
  'siswa',
  'data_pd_siswa',
  'employees',
  'spmb_sd',
  'calendar_events',
  'news',
  'program_kerja',
  'reports',
  'settings',
  'schools',
] as const;

const SEED_DATA: Record<string, { id: string }[]> = {
  menus: mockMenus,
  announcements: mockAnnouncements,
  gallery: mockGalleryItems,
  organizations: mockOrganizations,
  institution_links: mockInstitutionLinks,
  users: mockUsers,
  bos_arkas: mockBosData,
  kip_sd: mockKipSd,
  yatim_piatu: mockYatimPiatu,
  dokumen: [],
  agenda: [],
  students: [],
  siswa: [],
  data_pd_siswa: [],
  employees: [],
  spmb_sd: [],
  calendar_events: [],
  news: [],
  program_kerja: [],
  reports: [],
  settings: [],
  schools: [],
};

type BackupData = Record<string, Record<string, unknown>[]>;

function formatDate(ts: number) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(ts));
}

export default function BackupRestore() {
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [lastBackup, setLastBackup] = useState<number | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = async () => {
    if (!db) return;
    setBackingUp(true);
    setStatus(null);
    try {
      const data: BackupData = {};
      for (const col of COLLECTIONS) {
        const snap = await getDocs(collection(db, col));
        data[col] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-database-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      const now = Date.now();
      setLastBackup(now);
      setStatus({ ok: true, msg: 'Backup berhasil diunduh.' });
      toast.success('Backup database berhasil');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan';
      setStatus({ ok: false, msg });
      toast.error('Backup gagal: ' + msg);
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!db) return;
    setRestoring(true);
    setStatus(null);
    try {
      const text = await file.text();
      const data: BackupData = JSON.parse(text);

      const count = Object.values(data).reduce((s, arr) => s + arr.length, 0);
      const ok = window.confirm(
        `Yakin ingin merestore ${count} dokumen ke database?\n\nData yang sudah ada dengan ID yang sama akan ditimpa.`
      );
      if (!ok) {
        setRestoring(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      let total = 0;
      for (const [colName, docs] of Object.entries(data)) {
        if (docs.length === 0) continue;
        const batch = writeBatch(db);
        let batchCount = 0;
        for (const docData of docs) {
          const { id, ...rest } = docData;
          const ref = doc(db, colName, id as string);
          batch.set(ref, rest);
          batchCount++;
          total++;
          if (batchCount === 500) {
            await batch.commit();
            batchCount = 0;
          }
        }
        if (batchCount > 0) await batch.commit();
      }

      setStatus({ ok: true, msg: `${total} dokumen berhasil direstore.` });
      toast.success(`Restore berhasil: ${total} dokumen`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'File tidak valid';
      setStatus({ ok: false, msg: 'Gagal merestore: ' + msg });
      toast.error('Restore gagal: ' + msg);
    } finally {
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleSeed = async () => {
    if (!db) return;
    const totalDocs = Object.values(SEED_DATA).reduce((s, arr) => s + arr.length, 0);
    if (totalDocs === 0) {
      setStatus({ ok: false, msg: 'Tidak ada data untuk di-seed.' });
      return;
    }
    const ok = window.confirm(
      `Yakin ingin menulis ${totalDocs} dokumen awal ke database?\n\nData yang sudah ada dengan ID yang sama akan ditimpa.`
    );
    if (!ok) return;
    setSeeding(true);
    setStatus(null);
    try {
      let total = 0;
      for (const [colName, docs] of Object.entries(SEED_DATA)) {
        if (docs.length === 0) continue;
        const batch = writeBatch(db);
        let batchCount = 0;
        for (const docData of docs) {
          const { id, ...rest } = docData;
          const ref = doc(db, colName, id);
          batch.set(ref, rest);
          batchCount++;
          total++;
          if (batchCount === 500) {
            await batch.commit();
            batchCount = 0;
          }
        }
        if (batchCount > 0) await batch.commit();
      }
      setStatus({ ok: true, msg: `${total} dokumen berhasil di-seed ke database.` });
      toast.success(`Seed data berhasil: ${total} dokumen`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan';
      setStatus({ ok: false, msg: 'Gagal seed data: ' + msg });
      toast.error('Seed data gagal: ' + msg);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleRestore}
      />

      {status && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${
            status.ok
              ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          {status.ok ? (
            <CheckCircle className="w-5 h-5 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-sm font-medium">{status.msg}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            Backup Database
          </CardTitle>
          <CardDescription>
            Unduh seluruh data dari semua koleksi sebagai file JSON.
            {lastBackup && (
              <span className="block mt-1 text-xs text-muted-foreground">
                Backup terakhir: {formatDate(lastBackup)}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleBackup} disabled={backingUp}>
            {backingUp ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Backup Sekarang
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-green-600" />
            Restore Database
          </CardTitle>
          <CardDescription>
            Upload file JSON hasil backup untuk mengembalikan data ke database.
            Data dengan ID yang sama akan ditimpa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={triggerFileInput}
            disabled={restoring}
            variant="outline"
          >
            {restoring ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Merestore...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Pilih File JSON
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-600" />
            Seed Data Awal
          </CardTitle>
          <CardDescription>
            Tulis data awal (mock data) ke Firestore untuk semua koleksi. Gunakan sekali saat pertama kali menyambungkan Firestore.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleSeed}
            disabled={seeding}
            variant="outline"
          >
            {seeding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menulis...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Seed Data Sekarang
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
