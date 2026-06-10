'use client';

import { useEffect, useState, useMemo } from 'react';
import { GraduationCap, Search, Loader2, School } from 'lucide-react';

export default function PublicAlumni() {
  const [alumni, setAlumni] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterSchool, setFilterSchool] = useState('Semua');
  const [viewDetail, setViewDetail] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/firestore/alumni?limit=10000').then(r => r.json()),
      fetch('/api/firestore/schools').then(r => r.json()),
    ]).then(([aRes, sRes]) => {
      setAlumni(aRes.items || []);
      setSchools(sRes.items || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const getSchoolName = (id: string) => schools.find(s => s.id === id)?.namaSekolah || id;

  const melanjutkan = alumni.filter(a => a.alumniStatus === 'melanjutkan');
  const tidakMelanjutkan = alumni.filter(a => a.alumniStatus === 'tidak_melanjutkan');
  const belumDiisi = alumni.filter(a => !a.alumniStatus);

  const filtered = useMemo(() => {
    return alumni.filter(d => {
      if (filterJenjang !== 'Semua' && d.jenjang !== filterJenjang) return false;
      if (filterStatus !== 'Semua') {
        if (filterStatus === 'belum' && d.alumniStatus) return false;
        if (filterStatus !== 'belum' && d.alumniStatus !== filterStatus) return false;
      }
      if (filterSchool !== 'Semua' && d.schoolId !== filterSchool) return false;
      if (search) {
        const q = search.toLowerCase();
        return d.nama?.toLowerCase().includes(q) || d.nisn?.includes(q) || d.nik?.includes(q);
      }
      return true;
    });
  }, [alumni, filterJenjang, filterStatus, filterSchool, search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f9ff] via-white to-[#f0f4ff]">
      <div className="bg-gradient-to-br from-[#1a5276] to-[#0d3b66] text-white">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-white/10"><GraduationCap className="w-6 h-6" /></div>
            <div><h1 className="text-2xl font-bold">Alumni</h1><p className="text-sm text-blue-200">Data penelusuran lulusan</p></div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-6">
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border p-4 text-center shadow-sm"><p className="text-2xl font-bold">{alumni.length}</p><p className="text-xs text-muted-foreground">Total Alumni</p></div>
          <div className="bg-white rounded-xl border p-4 text-center shadow-sm"><p className="text-2xl font-bold text-green-700">{melanjutkan.length}</p><p className="text-xs text-muted-foreground">Melanjutkan</p></div>
          <div className="bg-white rounded-xl border p-4 text-center shadow-sm"><p className="text-2xl font-bold text-red-700">{tidakMelanjutkan.length}</p><p className="text-xs text-muted-foreground">Tidak Melanjutkan</p></div>
          <div className="bg-white rounded-xl border p-4 text-center shadow-sm"><p className="text-2xl font-bold text-amber-700">{belumDiisi.length}</p><p className="text-xs text-muted-foreground">Belum Diisi</p></div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Cari nama, NISN, NIK..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm" />
            </div>
            <select value={filterJenjang} onChange={e => setFilterJenjang(e.target.value)} className="px-3 py-2 rounded-lg border text-sm">
              <option value="Semua">Semua Jenjang</option>
              <option value="SD">SD</option>
              <option value="TK">TK</option>
              <option value="KB">KB</option>
            </select>
            <select value={filterSchool} onChange={e => setFilterSchool(e.target.value)} className="px-3 py-2 rounded-lg border text-sm">
              <option value="Semua">Semua Sekolah</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.namaSekolah}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border text-sm">
              <option value="Semua">Semua Status</option>
              <option value="melanjutkan">Melanjutkan</option>
              <option value="tidak_melanjutkan">Tidak Melanjutkan</option>
              <option value="belum">Belum Diisi</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500"><GraduationCap className="w-10 h-10 mx-auto mb-2 text-gray-300" /><p>Tidak ada data alumni</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-gray-50">
                  <th className="text-left px-3 py-2 font-medium">Nama</th>
                  <th className="text-center px-3 py-2 font-medium">NISN/NIK</th>
                  <th className="text-center px-3 py-2 font-medium">L/P</th>
                  <th className="text-center px-3 py-2 font-medium">Jenjang</th>
                  <th className="text-center px-3 py-2 font-medium">Sekolah</th>
                  <th className="text-center px-3 py-2 font-medium">Thn Lulus</th>
                  <th className="text-center px-3 py-2 font-medium">Status</th>
                  <th className="text-center px-3 py-2 font-medium">Detail</th>
                </tr></thead>
                <tbody>
                  {filtered.map((d, i) => (
                    <tr key={d.id || d.nisn || d.nik || i} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">{d.nama}</td>
                      <td className="px-3 py-2 text-center text-xs font-mono">{d.nisn || d.nik || '-'}</td>
                      <td className="px-3 py-2 text-center">{d.jenisKelamin}</td>
                      <td className="px-3 py-2 text-center">{d.jenjang}</td>
                      <td className="px-3 py-2 text-center text-xs">{d.namaSekolah || getSchoolName(d.schoolId)}</td>
                      <td className="px-3 py-2 text-center">{d.tahunLulus || '-'}</td>
                      <td className="px-3 py-2 text-center">
                        {d.alumniStatus === 'melanjutkan' ? <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Melanjutkan</span>
                          : d.alumniStatus === 'tidak_melanjutkan' ? <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Tidak Melanjutkan</span>
                          : <span className="text-xs text-gray-400">-</span>}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {d.alumniDetail ? (
                          <button onClick={() => setViewDetail(viewDetail === (d.id || i) ? null : (d.id || i))}
                            className="text-xs text-blue-600 hover:underline">{viewDetail === (d.id || i) ? 'Tutup' : 'Lihat'}</button>
                        ) : <span className="text-xs text-gray-400">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {viewDetail !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setViewDetail(null)}>
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <h3 className="font-bold text-lg">Detail Alumni</h3>
                  <button onClick={() => setViewDetail(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
                </div>
                <div className="px-6 py-4">
                  {filtered.map((d, i) => {
                    if ((d.id || i) !== viewDetail) return null;
                    return (
                      <div key={i} className="space-y-3 text-sm">
                        <div><span className="text-gray-500">Nama:</span><br /><span className="font-medium">{d.nama}</span></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><span className="text-gray-500">NISN:</span><br />{d.nisn || '-'}</div>
                          <div><span className="text-gray-500">NIK:</span><br />{d.nik || '-'}</div>
                          <div><span className="text-gray-500">Jenis Kelamin:</span><br />{d.jenisKelamin}</div>
                          <div><span className="text-gray-500">Jenjang:</span><br />{d.jenjang}</div>
                        </div>
                        <div><span className="text-gray-500">Asal Sekolah:</span><br />{d.namaSekolah || getSchoolName(d.schoolId)}</div>
                        <div><span className="text-gray-500">Tahun Lulus:</span><br />{d.tahunLulus || '-'}</div>
                        <div><span className="text-gray-500">Status:</span><br />
                          {d.alumniStatus === 'melanjutkan' ? 'Melanjutkan' : d.alumniStatus === 'tidak_melanjutkan' ? 'Tidak Melanjutkan' : '-'}
                        </div>
                        {d.alumniDetail && (
                          <div><span className="text-gray-500">{d.alumniStatus === 'melanjutkan' ? 'Sekolah Tujuan' : 'Alasan'}:</span><br />
                            <span className="whitespace-pre-wrap">{d.alumniDetail}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="px-6 py-4 border-t flex justify-end">
                  <button onClick={() => setViewDetail(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Tutup</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
