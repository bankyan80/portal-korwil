'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { toast } from 'sonner';

interface PegawaiTambahan {
  id?: string;
  nik: string;
  nama: string;
  tanggal_lahir: string;
  status_kepegawaian: string;
  jenis_ptk: string;
  sekolah: string;
  createdAt: number;
}

const STATUS_OPTIONS = ['PNS', 'PPPK', 'Honor Daerah TK.II Kab/Kota', 'Guru Honor Sekolah', 'Tenaga Honor Sekolah', 'PPPK Paruh Waktu'];
const PTK_OPTIONS = ['Guru', 'Tenaga Kependidikan', 'Kepala Sekolah', 'Pengawas', 'Lainnya'];

export default function TambahPegawai() {
  const [data, setData] = useState<PegawaiTambahan[]>([]);
  const [loading, setLoading] = useState(true);
  const [nik, setNik] = useState('');
  const [nama, setNama] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [status, setStatus] = useState('PNS');
  const [jenisPtk, setJenisPtk] = useState('Guru');
  const [sekolah, setSekolah] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'employees'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list: PegawaiTambahan[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as PegawaiTambahan));
      setData(list);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const resetForm = () => {
    setNik('');
    setNama('');
    setTanggalLahir('');
    setStatus('PNS');
    setJenisPtk('Guru');
    setSekolah('');
    setStatusMsg(null);
  };

  const handleAdd = async () => {
    const cleanNik = nik.replace(/\D/g, '');
    if (cleanNik.length !== 16) {
      setStatusMsg({ ok: false, msg: 'NIK harus 16 digit' });
      return;
    }
    if (!nama.trim()) {
      setStatusMsg({ ok: false, msg: 'Nama tidak boleh kosong' });
      return;
    }
    if (!tanggalLahir) {
      setStatusMsg({ ok: false, msg: 'Tanggal lahir harus diisi' });
      return;
    }
    if (data.some((d) => d.nik === cleanNik)) {
      setStatusMsg({ ok: false, msg: 'NIK sudah terdaftar' });
      return;
    }

    setSaving(true);
    setStatusMsg(null);
    try {
      if (db) {
        await addDoc(collection(db, 'employees'), {
          nik: cleanNik,
          nama: nama.trim(),
          tanggal_lahir: tanggalLahir,
          status_kepegawaian: status,
          jenis_ptk: jenisPtk,
          sekolah: sekolah.trim(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
      toast.success(`${nama.trim()} ditambahkan`);
      resetForm();
    } catch (e) {
      console.error('Error adding pegawai:', e);
      setStatusMsg({ ok: false, msg: 'Gagal menyimpan data' });
      toast.error('Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'employees', id));
    toast.success('Data berhasil dihapus');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b bg-gradient-to-r from-blue-700 to-blue-800">
          <h3 className="font-semibold text-white">Tambah Pegawai Baru</h3>
          <p className="text-sm text-blue-200 mt-0.5">
            Data pegawai akan otomatis muncul di halaman BUP
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIK <span className="text-red-500">*</span></label>
              <input type="text" maxLength={16} placeholder="16 digit NIK" value={nik}
                onChange={e => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono tracking-wider" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Nama pegawai" value={nama}
                onChange={e => setNama(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir <span className="text-red-500">*</span></label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="date" value={tanggalLahir}
                  onChange={e => setTanggalLahir(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status Kepegawaian</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                {STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenis PTK</label>
              <select value={jenisPtk} onChange={e => setJenisPtk(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                {PTK_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sekolah</label>
              <input type="text" placeholder="Tempat bertugas" value={sekolah}
                onChange={e => setSekolah(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
          </div>

          {statusMsg && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${statusMsg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {statusMsg.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
              <span>{statusMsg.msg}</span>
            </div>
          )}

          <button onClick={handleAdd} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-800 rounded-lg hover:bg-blue-900 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Simpan Pegawai
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Daftar Pegawai Tambahan</h3>
          <p className="text-xs text-gray-500 mt-0.5">Total: {data.length} pegawai</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : data.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">Belum ada pegawai tambahan</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-5 py-3 font-semibold text-gray-600">No</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">NIK</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Nama</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 hidden sm:table-cell">Tgl Lahir</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">Status</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">Sekolah</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((d, i) => (
                  <tr key={d.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-5 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-500">{d.nik}</td>
                    <td className="px-5 py-3 font-medium text-[#0d3b66] whitespace-nowrap">{d.nama}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs hidden sm:table-cell whitespace-nowrap">
                      {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d.tanggal_lahir + 'T00:00:00'))}
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${d.status_kepegawaian === 'PNS' ? 'bg-green-100 text-green-700' : d.status_kepegawaian === 'PPPK' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'}`}>
                        {d.status_kepegawaian}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs hidden md:table-cell max-w-[180px] truncate">{d.sekolah}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => handleDelete(d.id!)} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">
                        <Trash2 className="w-3 h-3" /> Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
