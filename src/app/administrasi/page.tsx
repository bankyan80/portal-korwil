'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { FileText, Download, Loader2, FolderOpen } from 'lucide-react';

interface DocItem {
  id?: string;
  title: string;
  type: string;
  url?: string;
}

export default function AdministrasiPage() {
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) { setLoading(false); return; }

    const unsubscribe = onSnapshot(
      collection(db, 'dokumen'),
      (snapshot) => {
        if (!snapshot.empty) {
          const fb: DocItem[] = snapshot.docs.map(d => ({
            id: d.id,
            title: d.data().title || d.data().nama || 'Dokumen',
            type: d.data().type || d.data().jenis || 'PDF',
            url: d.data().url || d.data().fileUrl || '',
          }));
          setDocs(fb);
        } else {
          setDocs([]);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error in dokumen realtime listener:', err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Administrasi</h1>
          <p className="text-sm text-muted-foreground">Dokumen dan format administrasi pendidikan</p>
        </div>

        {docs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-12 text-center">
            <FolderOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Belum ada dokumen administrasi</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Dokumen akan ditambahkan oleh admin</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {docs.map((doc, i) => (
              <a key={doc.id || i} href={doc.url || '#'} target={doc.url ? '_blank' : undefined}
                className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5 hover:shadow-sm transition-shadow group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5 text-orange-700 dark:text-orange-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{doc.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{doc.type}</span>
                      {doc.url && <Download className="w-3 h-3 text-blue-500" />}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
