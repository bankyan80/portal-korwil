'use client';

import InputDokumen from '@/components/admin/InputDokumen';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function DokumenPage() {
  return (
    <AdminLayout>
      <InputDokumen />
    </AdminLayout>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getDocumentUrl(d: DokumenBersama) {
  const f = d.file;
  if (f && 'fileUrl' in f && f.fileUrl) return f.fileUrl;
  if (f && 'webViewLink' in f && f.webViewLink) return f.webViewLink;
  return d.downloadUrl || d.dataUrl || '#';
}

function getUploadedTime(uploadedAt: unknown) {
  if (typeof uploadedAt === 'number') return uploadedAt;
  if (typeof uploadedAt === 'string') return Date.parse(uploadedAt) || 0;
  if (uploadedAt && typeof uploadedAt === 'object' && 'toMillis' in uploadedAt && typeof uploadedAt.toMillis === 'function') {
    return uploadedAt.toMillis();
  }
  return 0;
}

export default function OperatorDokumenPage() {
  const { user } = useAppStore();
  const [allDocs, setAllDocs] = useState<DokumenBersama[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [nipInput, setNipInput] = useState('');
  const [pegawai, setPegawai] = useState<PegawaiLookup | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const userSchool = user?.schoolName || '';
  const userSchoolId = user?.schoolId || '';
  const userSchoolKey = normalizeSchool(userSchool);
  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    if (!db) { queueMicrotask(() => setLoading(false)); return; }
    if (!isSuperAdmin && !userSchoolId) { queueMicrotask(() => setLoading(false)); return; }
    const q = isSuperAdmin
      ? query(collection(db, 'dokumen'), orderBy('uploadedAt', 'desc'))
      : query(collection(db, 'dokumen'), where('schoolId', '==', userSchoolId));
    const unsub = onSnapshot(q, (snap) => {
      const list: DokumenBersama[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as DokumenBersama));
      list.sort((a, b) => {
        const aTime = getUploadedTime(a.uploadedAt);
        const bTime = getUploadedTime(b.uploadedAt);
        return bTime - aTime;
      });
      setAllDocs(list);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [isSuperAdmin, userSchoolId]);

  const schoolDocs = useMemo(() => {
    if (!userSchoolKey) return allDocs;
    return allDocs.filter((d) => {
      if (d.schoolId && userSchoolId) return d.schoolId === userSchoolId;
      if (d.sekolah) return normalizeSchool(d.sekolah) === userSchoolKey;
      return false;
    });
  }, [allDocs, userSchoolId, userSchoolKey]);

  const filtered = useMemo(() => {
    if (!search) return schoolDocs;
    const q = search.toLowerCase();
    return schoolDocs.filter(d =>
      d.nama?.toLowerCase().includes(q) ||
      d.nik?.includes(q) ||
      d.nip?.includes(q) ||
      d.fileName?.toLowerCase().includes(q)
    );
  }, [schoolDocs, search]);

  async function lookupPegawai() {
    const clean = nipInput.replace(/\D/g, '');
    if (!clean) return;
    setLookupLoading(true);
    setPegawai(null);
    setUploadStatus(null);
    try {
      const res = await fetch(`/api/pegawai/lookup?nip=${clean}`);
      const json = await res.json();
      if (!json.found) {
        setUploadStatus({ ok: false, msg: 'Pegawai tidak ditemukan' });
        return;
      }

      const found = json.pegawai as PegawaiLookup;
      const foundSchoolKey = normalizeSchool(found.sekolah || '');
      if (userSchoolKey && foundSchoolKey !== userSchoolKey) {
        setUploadStatus({ ok: false, msg: 'Pegawai bukan dari sekolah Anda' });
        return;
      }

      setPegawai(found);
      setUploadStatus({ ok: true, msg: `${found.nama} - ${found.sekolah || userSchool || 'Sekolah'}` });
    } catch (err) {
      setUploadStatus({ ok: false, msg: err instanceof Error ? err.message : 'Gagal mencari pegawai' });
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleUpload(file: File) {
    if (!db || !auth?.currentUser) {
      setUploadStatus({ ok: false, msg: 'Anda harus login' });
      return;
    }
    if (!pegawai) {
      setUploadStatus({ ok: false, msg: 'Cari dan pilih pegawai terlebih dahulu' });
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadStatus({ ok: false, msg: 'Tipe file tidak diizinkan. Gunakan PDF/Word/Excel/JPG/PNG/WEBP' });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadStatus({ ok: false, msg: `Ukuran file ${(file.size / (1024 * 1024)).toFixed(1)}MB melebihi batas 10MB.` });
      return;
    }

    setUploading(true);
    setUploadStatus(null);

    try {
      const token = await auth.currentUser.getIdToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kategori', 'dokumen');
      formData.append('sekolahId', pegawai.schoolId || userSchoolId);
      formData.append('uploadedBy', auth.currentUser.uid);

      const uploadRes = await fetch('/api/supabase/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!uploadRes.ok) throw new Error((await uploadRes.json()).error || 'Upload gagal');

      const uploadData = await uploadRes.json();
      const supabaseData = uploadData.data;

      await addDoc(collection(db, 'dokumen'), {
        nik: pegawai.nik || '',
        nip: pegawai.nip || nipInput.replace(/\D/g, ''),
        nama: pegawai.nama,
        sekolah: pegawai.sekolah || userSchool,
        schoolId: pegawai.schoolId || userSchoolId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        file: {
          provider: 'supabase',
          bucket: supabaseData.bucket,
          fileName: supabaseData.fileName,
          originalName: supabaseData.originalName,
          storagePath: supabaseData.storagePath,
          fileUrl: supabaseData.fileUrl,
          mimeType: supabaseData.mimeType,
          size: supabaseData.size,
          uploadedAt: supabaseData.uploadedAt,
          uploadedBy: supabaseData.uploadedBy,
        },
        uploadedAt: serverTimestamp(),
      });

      setUploadStatus({ ok: true, msg: `${file.name} berhasil diupload` });
      setNipInput('');
      setPegawai(null);
    } catch (err) {
      setUploadStatus({ ok: false, msg: err instanceof Error ? err.message : 'Upload gagal' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus dokumen ini?')) return;
    if (!db) { setAllDocs(prev => prev.filter(d => d.id !== id)); return; }
    try { await deleteDoc(doc(db, 'dokumen', id)); }
    catch (e) { console.error('Gagal hapus:', e); }
  }

  return (
    <AuthGuard requiredRoles={['operator_sekolah', 'super_admin']} requireActive featureName="Dokumen Bersama">
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4">
        <div className="flex items-center gap-3">
          <a href="/admin/operator" className="text-white/80 hover:text-white"><ArrowLeft className="w-5 h-5" /></a>
          <FolderOpen className="w-5 h-5 text-yellow-400" />
          <h1 className="text-lg font-bold text-white">Dokumen Bersama</h1>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5 space-y-3">
          <h3 className="font-semibold text-foreground">Upload Dokumen</h3>
          <div className="flex flex-wrap items-center gap-2">
            <input type="text" placeholder="NIP/NIK pegawai" value={nipInput}
              onChange={e => { setNipInput(e.target.value.replace(/\D/g, '')); setPegawai(null); }}
              className="px-3 py-2 text-sm border rounded-lg w-48 bg-background text-foreground font-mono" />
            <button onClick={lookupPegawai} disabled={lookupLoading || !nipInput}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-800 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50">
              {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Cari
            </button>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f && pegawai) handleUpload(f);
                else if (f) setUploadStatus({ ok: false, msg: 'Cari pegawai terlebih dahulu' });
                if (fileRef.current) fileRef.current.value = '';
              }}
              className="hidden" />
            <button onClick={() => fileRef.current?.click()} disabled={uploading || !pegawai}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-800 rounded-lg hover:bg-blue-900 disabled:opacity-50">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Mengupload...' : 'Upload'}
            </button>
          </div>
          {uploadStatus && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${uploadStatus.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {uploadStatus.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
              <span>{uploadStatus.msg}</span>
            </div>
          )}
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Cari NIP/NIK/nama/file..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border rounded-lg w-full bg-white dark:bg-gray-800" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">{search ? 'Tidak ada dokumen yang cocok' : 'Belum ada dokumen'}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">No</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nama</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">NIP/NIK</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">File</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Ukuran</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((d, i) => (
                    <tr key={d.id || i} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{d.nama}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{d.nip || d.nik || '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[250px] truncate">
                        <a href={getDocumentUrl(d)} target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1">
                          <Download className="w-3 h-3" /> {d.fileName}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-muted-foreground">{formatSize(d.fileSize)}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleDelete(d.id!)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">
                          <Trash2 className="w-3 h-3" /> Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t text-xs text-muted-foreground">
              Menampilkan {filtered.length} dari {schoolDocs.length} dokumen sekolah Anda
            </div>
          </div>
        )}
      </main>
    </div>
    </AuthGuard>
  );
}
