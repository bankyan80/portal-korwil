'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Search, Plus, Pencil, Trash2, Camera, CheckCircle, XCircle, Clock, ImagePlus, Loader2, FileImage,
} from 'lucide-react';
import { toast } from 'sonner';
import type { GalleryItem, GalleryCategory, GalleryStatus } from '@/types';
import { useGalleryCrud } from '@/hooks/use-firestore-crud';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Progress } from '@/components/ui/progress';
import { AdminEmptyState, AdminDeleteDialog } from '@/components/shared/AdminTable';

// Compress image using Canvas API
async function compressImage(file: File, maxWidth = 1200, quality = 0.7): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxWidth) {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob with reduced quality
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        file.type,
        quality
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

const statusConfig: Record<GalleryStatus, { label: string; className: string }> = {
  published: { label: 'Published', className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100' },
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100' },
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100' },
};

const categoryOptions: GalleryCategory[] = ['SD', 'TK', 'PAUD', 'K3S', 'IGTKI', 'HIMPAUDI', 'PGRI', 'FKKG', 'FKKG PAI', 'FKKGO', 'Forum Operator', 'Tim Kerja Kecamatan'];
const statusOptions: GalleryStatus[] = ['draft', 'pending', 'published', 'rejected'];

interface GalleryFormData { title: string; description: string; category: GalleryCategory; status: GalleryStatus; }
const defaultForm: GalleryFormData = { title: '', description: '', category: 'K3S', status: 'draft' };

const formatDate = (ts: number) =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ts));

export function ManageGallery() {
  const crud = useGalleryCrud();
  const [form, setForm] = useState<GalleryFormData>(defaultForm);
  const [activeTab, setActiveTab] = useState('semua');
  const [saving, setSaving] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

   const openAdd = useCallback(() => { crud.openAdd(); setForm(defaultForm); }, [crud.openAdd]);
   const openEdit = useCallback((item: GalleryItem) => { crud.openEdit(item.id); setForm({ title: item.title, description: item.description, category: item.category, status: item.status }); }, [crud.openEdit]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }, []);

   const removeSelectedFile = useCallback((idx: number) => {
     setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
   }, []);

  const getImageUrls = useCallback(async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];
    setUploadingImages(true);
    setUploadProgress(0);
    const results: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        setUploadStatus(`${i + 1}/${files.length}: ${file.name}`);
        let fileToUpload: File | Blob = file;
        if (file.size > 3 * 1024 * 1024) {
          setUploadStatus(`Mengompresi ${file.name}...`);
          fileToUpload = await compressImage(file, 1200, 0.7);
        }
        if (fileToUpload.size > 5 * 1024 * 1024) continue;
        if (storage) {
          const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
          const task = uploadBytesResumable(storageRef, fileToUpload, { contentType: fileToUpload.type });
          await new Promise<void>((resolve, reject) => {
            task.on('state_changed',
              (snap) => {
                const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                setUploadProgress(pct);
              },
              reject,
              resolve
            );
          });
          const url = await getDownloadURL(storageRef);
          results.push(url);
        } else {
          results.push(URL.createObjectURL(fileToUpload));
        }
      }
      return results;
    } catch (e) {
      console.error('Error uploading images:', e);
      return results;
    } finally {
      setUploadingImages(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  }, []);

    const handleSave = useCallback(async () => {
      if (!form.title.trim()) { toast.error('Judul galeri tidak boleh kosong'); return; }
      setSaving(true);
      try {
        const imageUrls = await getImageUrls(selectedFiles);

        if (crud.editingId) {
          const existing = crud.items.find(i => i.id === crud.editingId);
          const allImages = existing ? [...existing.images, ...imageUrls] : imageUrls;
          await crud.updateItem(crud.editingId, { title: form.title, description: form.description, category: form.category, status: form.status, images: allImages });
          toast.success('Galeri berhasil diperbarui');
        } else {
          await crud.addItem({ id: `gallery-${Date.now()}`, title: form.title, description: form.description, images: imageUrls, category: form.category, authorName: 'Admin Kecamatan', authorRole: 'Administrator', status: form.status, createdAt: Date.now() });
          toast.success('Galeri berhasil ditambahkan');
        }
        crud.closeForm();
        setSelectedFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error) {
        console.error('Error saving gallery:', error);
      } finally {
        setSaving(false);
      }
    }, [form, crud.editingId, crud.items, crud.updateItem, crud.addItem, crud.closeForm, selectedFiles, getImageUrls]);

   const handleApprove = useCallback(async (id: string) => {
     await crud.updateItem(id, { status: 'published' as GalleryStatus });
     toast.success('Galeri berhasil disetujui');
   }, [crud.updateItem]);
   const handleReject = useCallback(async (id: string) => {
     await crud.updateItem(id, { status: 'rejected' as GalleryStatus });
     toast.success('Galeri ditolak');
   }, [crud.updateItem]);

   const filtered = crud.items.filter((item) => {
     const q = crud.search.toLowerCase();
     const matchesSearch = !crud.search.trim() || item.title.toLowerCase().includes(q) || item.authorName.toLowerCase().includes(q);
     const matchesTab = activeTab === 'semua' || item.status === activeTab;
     return matchesSearch && matchesTab;
   });

   const tabCounts = {
     semua: crud.items.length,
     pending: crud.items.filter((g) => g.status === 'pending').length,
     published: crud.items.filter((g) => g.status === 'published').length,
     rejected: crud.items.filter((g) => g.status === 'rejected').length,
     draft: crud.items.filter((g) => g.status === 'draft').length,
   };

  if (crud.loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3"><div className="h-10 w-64 bg-muted rounded animate-pulse" /><div className="h-10 w-48 bg-muted rounded animate-pulse" /></div>
        <div className="h-9 w-96 bg-muted rounded-lg animate-pulse" />
        <div className="h-[500px] bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari galeri..." value={crud.search} onChange={(e) => crud.setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openAdd} className="bg-blue-800 hover:bg-blue-900 text-white gap-2"><Plus className="w-4 h-4" />Tambah Galeri</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          {(['semua', 'pending', 'published', 'rejected', 'draft'] as const).map((tab) => (
            <TabsTrigger key={tab} value={tab} className="gap-1.5 text-xs">
              {tab !== 'semua' && <span className={`w-2 h-2 rounded-full ${tab === 'pending' ? 'bg-yellow-400' : tab === 'published' ? 'bg-green-400' : tab === 'rejected' ? 'bg-red-400' : 'bg-gray-400'}`} />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0">{tabCounts[tab]}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={activeTab}>
          {filtered.length === 0 ? (
            <AdminEmptyState icon={Camera} title="Belum ada data galeri" description={activeTab === 'semua' ? 'Tambahkan galeri baru untuk memulai' : `Tidak ada galeri dengan status "${activeTab}"`} />
          ) : (
            <div className="rounded-xl border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead className="hidden sm:table-cell">Kategori</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Penulis</TableHead>
                    <TableHead className="hidden lg:table-cell">Tanggal</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item, idx) => {
                    const sc = statusConfig[item.status];
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="max-w-[250px]">
                            <p className="font-medium text-sm leading-snug">{item.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{item.images.length} foto</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell"><Badge variant="outline" className="text-[10px]">{item.category}</Badge></TableCell>
                        <TableCell className="text-center">
                          <Badge className={`${sc.className} text-[10px] gap-1`}>
                            {item.status === 'published' && <CheckCircle className="w-3 h-3" />}
                            {item.status === 'rejected' && <XCircle className="w-3 h-3" />}
                            {sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{item.authorName}</TableCell>
                        <TableCell className="hidden lg:table-cell"><div className="flex items-center gap-1.5 text-muted-foreground text-xs"><Clock className="w-3 h-3" />{formatDate(item.createdAt)}</div></TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {item.status === 'pending' && (
                              <>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleApprove(item.id)} title="Setujui"><CheckCircle className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleReject(item.id)} title="Tolak"><XCircle className="w-3.5 h-3.5" /></Button>
                              </>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => openEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => crud.requestDelete(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={crud.formOpen} onOpenChange={(open) => {
        if (!open) {
          crud.closeForm();
          setSelectedFiles([]);
        }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{crud.editingId ? 'Edit Galeri' : 'Tambah Galeri Baru'}</DialogTitle>
            <DialogDescription>{crud.editingId ? 'Perbarui informasi galeri.' : 'Isi formulir berikut untuk menambahkan galeri baru.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="gallery-title">Judul Galeri</Label>
              <Input id="gallery-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Contoh: Upacara Hardiknas 2025" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gallery-desc">Deskripsi</Label>
              <Textarea id="gallery-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Deskripsi singkat kegiatan..." rows={3} className="resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gallery-category">Kategori</Label>
                <Select value={form.category} onValueChange={(val) => setForm((f) => ({ ...f, category: val as GalleryCategory }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>{categoryOptions.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gallery-status">Status</Label>
                <Select value={form.status} onValueChange={(val) => setForm((f) => ({ ...f, status: val as GalleryStatus }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Pilih status" /></SelectTrigger>
                  <SelectContent>{statusOptions.map((st) => (<SelectItem key={st} value={st}>{statusConfig[st].label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Upload Foto</Label>
               <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer relative">
                 <ImagePlus className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                 <p className="text-sm text-muted-foreground">Klik atau seret foto ke sini</p>
                   <p className="text-xs text-muted-foreground/70 mt-1">JPG/JPEG/PNG/GIF/TIFF hingga 5MB. Foto langsung diupload saat dipilih, kompresi otomatis untuk &gt;3MB</p>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/tiff,image/tif"
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileSelect}
                  disabled={uploadingImages}
                />
              </div>
              {selectedFiles.length > 0 && (
                <div className="space-y-2 mt-3">
                  <p className="text-sm font-medium">File terpilih ({selectedFiles.length}):</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border bg-muted">
                        <div className="aspect-square flex items-center justify-center bg-muted">
                          <FileImage className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div className="p-2">
                          <p className="text-xs truncate" title={file.name}>{file.name}</p>
                          <p className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSelectedFile(idx)}
                          disabled={uploadingImages}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {uploadingImages && (
                <div className="space-y-2 py-2">
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span className="truncate">{uploadStatus || 'Mengunggah...'}</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={crud.closeForm}>Batal</Button>
            <Button onClick={handleSave} className="bg-blue-800 hover:bg-blue-900 text-white">{crud.editingId ? 'Simpan Perubahan' : 'Tambah Galeri'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminDeleteDialog open={crud.deleteOpen} onOpenChange={crud.cancelDelete} title="Hapus Galeri" description="Apakah Anda yakin ingin menghapus galeri ini? Tindakan ini tidak dapat dibatalkan." onConfirm={async () => {
        await crud.confirmDelete();
        toast.success('Galeri berhasil dihapus');
      }} />
    </div>
  );
}
