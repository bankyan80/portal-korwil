'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { auth } from '@/lib/firebase';
import {
  Shield, LogOut, Loader2, Plus, Trash2, CheckCircle, XCircle,
  Clock, ExternalLink, BarChart3, ListTodo, Calendar,
} from 'lucide-react';

interface TaskGroup {
  id: string;
  title: string;
  description: string;
  targetLink: string;
  targetLabel: string;
  dueDate: number | null;
  forJenjang: string[];
  createdBy: string;
  createdAt: number;
  active: boolean;
  progress: { total: number; completed: number; pending: number };
  progressList: { schoolId: string; schoolName: string; status: string; completedAt: number }[];
}

export default function TugasPage() {
  const { user, setUser } = useAppStore();
  const router = useRouter();
  const [groups, setGroups] = useState<TaskGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    targetLink: '',
    targetLabel: '',
    dueDate: '',
    forJenjang: [] as string[],
  });

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'super_admin') { router.push('/login'); return; }
    fetchData();
  }, [user, router]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch('/api/tugas');
      const json = await res.json();
      if (json.success) setGroups(json.groups);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  const handleSubmit = useCallback(async () => {
    if (!form.title || !form.targetLink) return;
    setSaving(true);
    try {
      await fetch('/api/tugas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          ...form,
          dueDate: form.dueDate ? new Date(form.dueDate).getTime() : null,
          createdBy: user?.uid || '',
        }),
      });
      setShowForm(false);
      setForm({ title: '', description: '', targetLink: '', targetLabel: '', dueDate: '', forJenjang: [] });
      await fetchData();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  }, [form, user]);

  async function handleDelete(id: string) {
    if (!confirm('Hapus tugas ini?')) return;
    try {
      await fetch('/api/tugas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      await fetchData();
    } catch (e) { console.error(e); }
  }

  function handleLogout() {
    if (auth) auth.signOut();
    setUser(null);
    router.push('/');
  }

  if (!user) return null;

  const toggleJenjang = (j: string) => {
    setForm(f => ({
      ...f,
      forJenjang: f.forJenjang.includes(j) ? f.forJenjang.filter(x => x !== j) : [...f.forJenjang, j],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/super')} className="text-white/80 hover:text-white">
            <BarChart3 className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <ListTodo className="w-5 h-5" /> Manajemen Tugas
            </h1>
            <p className="text-sm text-blue-200">{user.displayName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/super')} className="text-sm text-blue-300 hover:text-blue-200">Dashboard</button>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-300 hover:text-red-200">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <main className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Daftar Tugas</h2>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800">
            <Plus className="w-4 h-4" /> Buat Tugas Baru
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-gray-900">Tugas Baru</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Judul Tugas *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full text-sm border rounded-lg px-3 py-2" placeholder="cth: Lengkapi Data Sarpras" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Link Tujuan *</label>
                <input value={form.targetLink} onChange={e => setForm(f => ({ ...f, targetLink: e.target.value }))}
                  className="w-full text-sm border rounded-lg px-3 py-2" placeholder="/admin/operator/sarpras" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Label Tombol</label>
                <input value={form.targetLabel} onChange={e => setForm(f => ({ ...f, targetLabel: e.target.value }))}
                  className="w-full text-sm border rounded-lg px-3 py-2" placeholder="Isi Data Sarpras" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Tenggat Waktu</label>
                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="w-full text-sm border rounded-lg px-3 py-2" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Deskripsi</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full text-sm border rounded-lg px-3 py-2" rows={2} placeholder="Penjelasan tugas..." />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Filter Jenjang (kosongkan untuk semua)</label>
              <div className="flex gap-2">
                {['SD', 'TK', 'KB'].map(j => (
                  <label key={j} className="flex items-center gap-1.5 text-sm">
                    <input type="checkbox" checked={form.forJenjang.includes(j)}
                      onChange={() => toggleJenjang(j)} className="rounded" />
                    {j}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleSubmit} disabled={saving || !form.title || !form.targetLink}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Simpan Tugas
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-100">
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Task List */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <ListTodo className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Belum ada tugas. Buat tugas pertama untuk sekolah.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((g) => {
              const pct = g.progress.total > 0 ? Math.round((g.progress.completed / g.progress.total) * 100) : 0;
              const isExpanded = expandedId === g.id;
              return (
                <div key={g.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{g.title}</h3>
                        {g.description && <p className="text-xs text-gray-500 mt-1">{g.description}</p>}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><ExternalLink className="w-3 h-3" /> {g.targetLabel}</span>
                          {g.dueDate && (
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(g.dueDate).toLocaleDateString('id-ID')}</span>
                          )}
                          {g.forJenjang.length > 0 && (
                            <span>Jenjang: {g.forJenjang.join(', ')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{g.progress.completed}/{g.progress.total}</p>
                          <p className="text-xs text-gray-500">Sekolah</p>
                        </div>
                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${pct === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <button onClick={() => setExpandedId(isExpanded ? null : g.id)}
                          className="text-xs text-blue-600 hover:underline shrink-0">Detail</button>
                        <button onClick={() => handleDelete(g.id)}
                          className="text-red-400 hover:text-red-600 shrink-0"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t px-5 py-3">
                      {g.progressList.length === 0 ? (
                        <p className="text-xs text-gray-400">Belum ada progres dari sekolah</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
                          {g.progressList.map(p => (
                            <div key={p.schoolId} className="flex items-center gap-1.5 text-xs">
                              {p.status === 'completed'
                                ? <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                                : <XCircle className="w-3 h-3 text-red-400 shrink-0" />}
                              <span className="truncate">{p.schoolName}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
