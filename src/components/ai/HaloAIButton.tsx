import { GraduationCap, X } from 'lucide-react';

interface HaloAIButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function HaloAIButton({ isOpen, onToggle }: HaloAIButtonProps) {
  if (isOpen) return null;

  return (
    <button
      onClick={onToggle}
      className="group relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-700 to-blue-900 text-white shadow-lg shadow-blue-700/30 hover:shadow-xl hover:shadow-blue-700/40 transition-all duration-300 flex items-center justify-center"
      aria-label="Buka HaloAI"
    >
      <span className="absolute inset-0 rounded-full bg-blue-600/20 animate-pulse" />
      <GraduationCap className="w-7 h-7 relative z-10 group-hover:scale-110 transition-transform duration-200" />
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
    </button>
  );
}
