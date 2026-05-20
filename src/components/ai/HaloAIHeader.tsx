import { GraduationCap, Bot, Sparkles, X } from 'lucide-react';
import HaloAIStatus from './HaloAIStatus';

interface HaloAIHeaderProps {
  onClose: () => void;
  aiStatus: 'online' | 'slow' | 'error' | 'checking';
}

export default function HaloAIHeader({ onClose, aiStatus }: HaloAIHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-[#0d3b66] to-[#1a5276] px-4 py-3 flex items-center gap-3 shrink-0">
      <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shadow-lg shadow-yellow-500/10">
        <GraduationCap className="w-5 h-5 text-yellow-400" />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="font-bold text-sm text-white flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          HaloAI
        </h2>
        <p className="text-[11px] text-blue-200">Asisten Pendidikan Digital</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <HaloAIStatus status={aiStatus} />
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
