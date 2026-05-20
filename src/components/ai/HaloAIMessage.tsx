import { GraduationCap, User } from 'lucide-react';

interface HaloAIMessageProps {
  from: 'bot' | 'user';
  text: string;
  timestamp: number;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function HaloAIMessage({ from, text, timestamp }: HaloAIMessageProps) {
  return (
    <div className={`flex ${from === 'bot' ? 'justify-start' : 'justify-end'}`}>
      <div className="max-w-[85%]">
        {from === 'bot' && (
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <GraduationCap className="w-3 h-3 text-yellow-400" />
            </div>
            <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">HaloAI</span>
          </div>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            from === 'bot'
              ? 'bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 shadow-sm border border-gray-100 dark:border-slate-600 rounded-bl-md'
              : 'bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-br-md'
          }`}
        >
          <p className="whitespace-pre-wrap">{text}</p>
        </div>
        <p className={`text-[10px] mt-1 ${from === 'bot' ? 'text-gray-400 dark:text-gray-500 text-left' : 'text-gray-400 dark:text-gray-500 text-right'}`}>
          {formatTime(timestamp)}
        </p>
      </div>
    </div>
  );
}
