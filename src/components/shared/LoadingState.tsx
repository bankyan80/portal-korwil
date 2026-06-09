import { Loader2 } from 'lucide-react';

export function LoadingState({ message = 'Memuat data...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center gap-3 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span>{message}</span>
      </div>
    </div>
  );
}
