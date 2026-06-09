'use client';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Gagal memuat data', onRetry }: ErrorStateProps) {
  return (
    <div className="min-h-[200px] flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-600 font-medium">{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-3 text-sm text-blue-600 hover:underline">
            Coba lagi
          </button>
        )}
      </div>
    </div>
  );
}
