import { GraduationCap, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface HaloAIMessageProps {
  from: 'bot' | 'user';
  text: string;
  timestamp: number;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function LinkRenderer({ href, children }: { href?: string; children: React.ReactNode }) {
  if (!href) return <span>{children}</span>;
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors font-medium text-sm no-underline border border-blue-200 dark:border-blue-800"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
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
          {from === 'bot' ? (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-a:no-underline prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:font-medium">
              <ReactMarkdown
                components={{
                  a: ({ href, children }) => <LinkRenderer href={href}>{children}</LinkRenderer>,
                }}
              >
                {text}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{text}</p>
          )}
        </div>
        <p className={`text-[10px] mt-1 ${from === 'bot' ? 'text-gray-400 dark:text-gray-500 text-left' : 'text-gray-400 dark:text-gray-500 text-right'}`}>
          {formatTime(timestamp)}
        </p>
      </div>
    </div>
  );
}
