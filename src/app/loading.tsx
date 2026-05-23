import { Loader2 } from 'lucide-react';

export default function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#0d3b66] mx-auto mb-3" />
        <p className="text-sm text-slate-500">Memuat halaman...</p>
      </div>
    </div>
  );
}
