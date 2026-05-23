import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center max-w-md">
        <FileQuestion className="w-20 h-20 text-slate-300 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-slate-800 mb-2">404</h1>
        <p className="text-slate-500 mb-2">Halaman tidak ditemukan</p>
        <p className="text-xs text-slate-400 mb-6">
          Halaman yang Anda cari mungkin telah dipindahkan atau tidak tersedia.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0d3b66] text-white rounded-lg hover:bg-[#0a2d4f] transition-colors font-medium text-sm"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
