import { ChevronRight } from 'lucide-react';

interface BlueBarHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function BlueBarHeader({ title, actionLabel, onAction }: BlueBarHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-[#0d3b66] to-[#1a5276] rounded-t-lg px-5 py-3.5 flex items-center justify-between shadow-sm">
      <h2 className="text-white font-bold text-sm sm:text-base uppercase tracking-wide">{title}</h2>
      {actionLabel && (
        <button
          onClick={onAction}
          className="text-blue-200 hover:text-white text-sm font-medium transition-colors flex items-center gap-1"
        >
          {actionLabel}
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
