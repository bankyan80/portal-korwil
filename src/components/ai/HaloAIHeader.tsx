import { GraduationCap, Sparkles, X } from 'lucide-react';
import HaloAIStatus from './HaloAIStatus';

interface HaloAIHeaderProps {
  onClose: () => void;
  aiStatus: 'online' | 'slow' | 'error' | 'checking';
  quota?: { remaining: number; total: number } | null;
}

export default function HaloAIHeader({ onClose, aiStatus, quota }: HaloAIHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-[#0d3b66] to-[#1a5276] px-4 py-3 flex items-center gap-3 shrink-0">
      <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
        <GraduationCap className="w-5 h-5 text-yellow-400" />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="font-bold text-sm text-white flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          HaloAI
        </h2>
        <p className="text-[11px] text-blue-200">Asisten Pendidikan Digital</p>
      </div>
      <HaloAIStatus status={aiStatus} remaining={quota?.remaining} total={quota?.total} />
      <button
        onClick={onClose}
        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0 ml-1"
      >
        <X className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}
