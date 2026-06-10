'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';

interface Props {
  collection: string;
  label?: string;
  className?: string;
  onSuccess?: (result: { success: number; total: number }) => void;
}

export function ImportButton({ collection, label = 'Import Excel', className = '', onSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/admin/import/${collection}`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Gagal import');
        return;
      }

      const json = await res.json();
      alert(json.message || `Import selesai: ${json.success || 0} data`);
      onSuccess?.({ success: json.success || 0, total: json.total || 0 });
    } catch {
      alert('Gagal import');
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
      <button onClick={handleClick} disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 bg-amber-700 text-white rounded-lg text-sm font-medium hover:bg-amber-800 disabled:opacity-50 ${className}`}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {loading ? 'Mengimport...' : label}
      </button>
    </>
  );
}
