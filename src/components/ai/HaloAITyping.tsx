import { Sparkles } from 'lucide-react';

export default function HaloAITyping() {
  return (
    <div className="flex justify-start">
      <div className="bg-white dark:bg-slate-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100 dark:border-slate-600 max-w-[85%]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-pulse" />
          <span className="text-sm text-gray-400 dark:text-gray-300">HaloAI sedang mengetik</span>
          <span className="flex gap-1 ml-1">
            <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
            <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
          </span>
        </div>
      </div>
    </div>
  );
}
