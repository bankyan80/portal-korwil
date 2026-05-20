import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';
import HaloAIHeader from './HaloAIHeader';
import HaloAIMessage from './HaloAIMessage';
import HaloAITyping from './HaloAITyping';
import HaloAIQuickMenu from './HaloAIQuickMenu';
import localforage from 'localforage';

interface ChatMessage {
  id: string;
  from: 'bot' | 'user';
  text: string;
  timestamp: number;
}

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatContext {
  userRole: string;
  userName: string;
  schoolName?: string;
  schoolId?: string;
  currentPath: string;
  currentView: string;
}

interface HaloAIChatProps {
  onClose: () => void;
  context: ChatContext;
  onAiStatusChange: (status: 'online' | 'slow' | 'error' | 'checking') => void;
}

const chatStore = localforage.createInstance({ name: 'haloai', storeName: 'messages' });

const quickMenuPrompts: Record<string, string> = {
  'cari-siswa': 'Bagaimana cara mencari data siswa di portal ini?',
  'cari-guru': 'Bagaimana cara mencari data guru dan tendik?',
  'rekap-sekolah': 'Bagaimana cara melihat rekap data sekolah?',
  'laporan-bulanan': 'Bagaimana cara mengisi dan melihat laporan bulanan?',
  'spmb-sd': 'Informasi tentang SPMB SD di Kecamatan Lemahabang',
  'tka-sd': 'Informasi tentang TKA SD di Kecamatan Lemahabang',
  'audit-sistem': 'Bagaimana cara melakukan audit sistem?',
  'statistik': 'Tampilkan statistik pendidikan Kecamatan Lemahabang',
};

function getGreeting(context: ChatContext): string {
  switch (context.userRole) {
    case 'super_admin':
      return `Selamat datang, ${context.userName} 👋\n\nSaya HaloAI, asisten digital Anda. Saya siap membantu monitoring sekolah, laporan, data, dan audit sistem.\n\nSilakan pilih menu cepat di bawah atau ketik pertanyaan Anda.`;
    case 'operator_sekolah':
      return `Halo, ${context.userName} dari ${context.schoolName || 'sekolah Anda'} 👋\n\nSaya HaloAI, asisten digital Anda. Saya siap membantu input data, laporan bulanan, siswa, guru, dan validasi sekolah.\n\nSilakan pilih menu cepat di bawah atau ketik pertanyaan Anda.`;
    default:
      return `Halo 👋\n\nSaya HaloAI, asisten digital Portal Pendidikan Kecamatan Lemahabang.\n\nSilakan tanyakan informasi sekolah, SPMB, TKA, atau layanan pendidikan.`;
  }
}

export default function HaloAIChat({ onClose, context, onAiStatusChange }: HaloAIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState<HistoryMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const saved = await chatStore.getItem<ChatMessage[]>('chat-history');
        if (saved && saved.length > 0) {
          setMessages(saved);
          const hist: HistoryMessage[] = saved
            .filter(m => m.from === 'user' || m.from === 'bot')
            .map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }));
          setHistory(hist);
        } else {
          const greeting: ChatMessage = {
            id: `msg-${Date.now()}-init`,
            from: 'bot',
            text: getGreeting(context),
            timestamp: Date.now(),
          };
          setMessages([greeting]);
        }
      } catch {
        const greeting: ChatMessage = {
          id: `msg-${Date.now()}-init`,
          from: 'bot',
          text: getGreeting(context),
          timestamp: Date.now(),
        };
        setMessages([greeting]);
      }
    };
    init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      chatStore.setItem('chat-history', messages).catch(() => {});
    }
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      from: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    onAiStatusChange('checking');

    const newHistory = [...history, { role: 'user' as const, content: text.trim() }];

    try {
      const res = await fetch('/api/haloai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: newHistory.slice(-10),
          context,
        }),
      });

      const data = await res.json();

      if (data.success) {
        onAiStatusChange('online');
        const botMsg: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          from: 'bot',
          text: data.reply,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, botMsg]);
        setHistory(prev => [...prev, { role: 'assistant' as const, content: data.reply }]);
      } else {
        onAiStatusChange('error');
        const botMsg: ChatMessage = {
          id: `msg-${Date.now()}-err`,
          from: 'bot',
          text: data.reply || 'Maaf, terjadi kesalahan.',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, botMsg]);
      }
    } catch {
      onAiStatusChange('error');
      const botMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        from: 'bot',
        text: 'Maaf, terjadi kesalahan koneksi. Silakan coba lagi.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [history, context, onAiStatusChange]);

  const handleSend = () => {
    sendMessage(input);
  };

  const handleQuickMenu = (id: string) => {
    const prompt = quickMenuPrompts[id];
    if (prompt) {
      sendMessage(prompt);
    }
  };

  const handleClearChat = async () => {
    try {
      await chatStore.removeItem('chat-history');
    } catch {}
    const greeting: ChatMessage = {
      id: `msg-${Date.now()}-reset`,
      from: 'bot',
      text: getGreeting(context),
      timestamp: Date.now(),
    };
    setMessages([greeting]);
    setHistory([]);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-900">
      <HaloAIHeader onClose={onClose} aiStatus={
        isTyping ? 'checking' : 'online'
      } />

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.map((msg) => (
          <HaloAIMessage key={msg.id} from={msg.from} text={msg.text} timestamp={msg.timestamp} />
        ))}
        {isTyping && <HaloAITyping />}
        <div ref={messagesEndRef} />
      </div>

      <HaloAIQuickMenu onSelect={handleQuickMenu} />

      <div className="border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-500 dark:text-gray-400 flex items-center justify-center transition-colors shrink-0 text-[10px] font-medium"
            title="Reset percakapan"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3-3"/></svg>
          </button>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isTyping && handleSend()}
              placeholder="Ketik pertanyaan..."
              className="w-full text-sm text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 dark:bg-slate-700 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-700 to-blue-800 text-white flex items-center justify-center hover:from-blue-800 hover:to-blue-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-md shadow-blue-700/20"
          >
            {isTyping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
