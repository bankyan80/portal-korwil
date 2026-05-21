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

interface CachedEntry {
  reply: string;
  timestamp: number;
  source: string;
}

interface HaloAIChatProps {
  onClose: () => void;
  context: ChatContext;
  aiStatus: 'online' | 'slow' | 'error' | 'checking';
  onAiStatusChange: (status: 'online' | 'slow' | 'error' | 'checking') => void;
}

const chatStore = localforage.createInstance({ name: 'haloai', storeName: 'messages' });
const cacheStore = localforage.createInstance({ name: 'haloai', storeName: 'cache' });
const CACHE_TTL = 60 * 60 * 1000;
const COOLDOWN_MS = 5000;

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

function normalizeQuestion(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, ' ');
}

export default function HaloAIChat({ onClose, context, aiStatus, onAiStatusChange }: HaloAIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState<HistoryMessage[]>([]);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [quota, setQuota] = useState<{ remaining: number; total: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQuestionRef = useRef<string>('');
  const cooldownWarningShownRef = useRef<boolean>(false);

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

  const addBotMessage = (text: string, idSuffix: string) => {
    const msg: ChatMessage = {
      id: `msg-${Date.now()}-${idSuffix}`,
      from: 'bot',
      text,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, msg]);
    return msg;
  };

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (isTyping) return;

    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < COOLDOWN_MS && cooldownWarningShownRef.current) {
      return;
    }

    if (timeSinceLastRequest < COOLDOWN_MS) {
      cooldownWarningShownRef.current = true;
      const waitTime = Math.ceil((COOLDOWN_MS - timeSinceLastRequest) / 1000);
      return;
    }
    cooldownWarningShownRef.current = false;

    const normalized = normalizeQuestion(trimmed);
    if (normalized === lastQuestionRef.current) {
      return;
    }

    const cached = await cacheStore.getItem<CachedEntry>(normalized);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}-user`,
        from: 'user',
        text: trimmed,
        timestamp: Date.now(),
      };
      const botMsg: ChatMessage = {
        id: `msg-${Date.now()}-cached`,
        from: 'bot',
        text: cached.reply,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, userMsg, botMsg]);
      setHistory(prev => [...prev, { role: 'user', content: trimmed }, { role: 'assistant', content: cached.reply }]);
      return;
    }

    lastQuestionRef.current = normalized;
    setLastRequestTime(Date.now());

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      from: 'user',
      text: trimmed,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    onAiStatusChange('checking');

    const newHistory = [...history, { role: 'user' as const, content: trimmed }];

    try {
      const res = await fetch('/api/haloai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: newHistory.slice(-3),
          context,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        onAiStatusChange('error');
        addBotMessage(data.reply || 'Maaf, terjadi kesalahan.', 'err');
        return;
      }

      onAiStatusChange(data.quotaStatus === 'red' ? 'error' : data.quotaStatus === 'yellow' ? 'slow' : 'online');
      const botMsg = addBotMessage(data.reply, Math.random().toString(36).slice(2));
      setHistory(prev => [...prev, { role: 'assistant' as const, content: data.reply }]);

      if (data.source === 'gemini') {
        const entry: CachedEntry = {
          reply: data.reply,
          timestamp: Date.now(),
          source: 'gemini',
        };
        cacheStore.setItem(normalized, entry).catch(() => {});
      }

      if (typeof data.remaining === 'number' && typeof data.total === 'number') {
        setQuota({ remaining: data.remaining, total: data.total });
      }
    } catch (err: any) {
      console.error('HaloAI Fetch Error:', err?.message || err);
      onAiStatusChange('error');
      addBotMessage('Maaf, terjadi kesalahan koneksi. Silakan coba lagi.', 'err');
    } finally {
      setIsTyping(false);
    }
  }, [history, context, onAiStatusChange, isTyping, lastRequestTime]);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    sendMessage(input);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickMenu = (id: string) => {
    const prompt = quickMenuPrompts[id];
    if (prompt && !isTyping) {
      sendMessage(prompt);
    }
  };

  const handleClearChat = async () => {
    try {
      await chatStore.removeItem('chat-history');
      await cacheStore.clear();
    } catch {}
    lastQuestionRef.current = '';
    setLastRequestTime(0);
    const greeting: ChatMessage = {
      id: `msg-${Date.now()}-reset`,
      from: 'bot',
      text: getGreeting(context),
      timestamp: Date.now(),
    };
    setMessages([greeting]);
    setHistory([]);
  };

  const actualStatus = isTyping ? 'checking' : aiStatus;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-900">
      <HaloAIHeader onClose={onClose} aiStatus={actualStatus} quota={quota} />

      <div className="flex-1 overflow-y-auto px-2 sm:px-3 py-2 sm:py-3 space-y-2 sm:space-y-3">
        {messages.map((msg) => (
          <HaloAIMessage key={msg.id} from={msg.from} text={msg.text} timestamp={msg.timestamp} />
        ))}
        {isTyping && <HaloAITyping />}
        <div ref={messagesEndRef} />
      </div>

      <HaloAIQuickMenu onSelect={handleQuickMenu} />

      <div className="border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 sm:p-3 shrink-0 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] sm:pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            disabled={isTyping || messages.length <= 1}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 text-xs font-medium"
            title="Hapus percakapan"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            Hapus
          </button>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isTyping ? 'Menunggu jawaban AI...' : 'Ketik pertanyaan...'}
              disabled={isTyping}
              className="w-full text-sm text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-slate-600 rounded-xl px-3 sm:px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 dark:bg-slate-700 placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-blue-700 to-blue-800 text-white flex items-center justify-center hover:from-blue-800 hover:to-blue-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-md shadow-blue-700/20 active:scale-95"
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
