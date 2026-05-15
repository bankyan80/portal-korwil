'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Paperclip, FileText, XCircle, ArrowLeft, MessageCircle, RefreshCw, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';

type AIStatus = 'checking' | 'online' | 'offline' | 'error';

interface ChatAttachment {
  id: string;
  name: string;
  type: 'image' | 'file';
  dataUrl: string;
  size: number;
}

interface ChatMessage {
  id: string;
  from: 'bot' | 'user';
  text: string;
  timestamp: number;
  attachments?: ChatAttachment[];
}

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function fetchAIResponse(message: string, history: HistoryMessage[]): Promise<{ success: boolean; reply: string }> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history,
      }),
    });

    const data = await res.json();
    return {
      success: data.success !== false,
      reply: data.reply || 'Maaf, terjadi kesalahan.',
    };
  } catch (e) {
    console.error('Error fetching AI response:', e);
    return {
      success: false,
      reply: 'Maaf, terjadi kesalahan koneksi.',
    };
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPage() {
  const { setCurrentView } = useAppStore();
  const [aiStatus, setAiStatus] = useState<AIStatus>('checking');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: `msg-${Date.now()}-init`,
      from: 'bot',
      text: 'Halo! Saya asisten AI Portal Pendidikan Kecamatan Lemahabang. Saya ahli dalam administrasi guru, pembuatan proposal, dan dokumen pendidikan. Ada yang bisa saya bantu? 😊',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState<HistoryMessage[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const checkAIHealth = async () => {
    setAiStatus('checking');
    try {
      const result = await fetchAIResponse('ping', []);
      if (result.success) {
        setAiStatus('online');
      } else {
        setAiStatus('error');
      }
    } catch (e) {
      console.error('Error checking AI health:', e);
      setAiStatus('error');
    }
  };

  useEffect(() => {
    checkAIHealth();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, attachments]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addBotMsg = (text: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      from: 'bot',
      text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const addUserMsg = (text: string, atts?: ChatAttachment[]) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      from: 'user',
      text,
      timestamp: Date.now(),
      attachments: atts?.length ? atts : undefined,
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const handleSend = async () => {
    const val = input.trim();
    if (!val && attachments.length === 0) return;

    const attsToSend = [...attachments];
    const textToSend = val || (attsToSend.length > 0 ? `[Mengirim ${attsToSend.length} file]` : '');

    addUserMsg(textToSend, attsToSend);
    setInput('');
    setAttachments([]);

    let fullText = textToSend;
    if (attsToSend.length > 0) {
      const fileNames = attsToSend.map((a) => `${a.name} (${a.type})`).join(', ');
      fullText = textToSend + `\n\n[Lampiran: ${fileNames}]`;
    }

    setAiLoading(true);
    const currentHistory = [...aiHistory, { role: 'user' as const, content: fullText }];
    setAiHistory(currentHistory);

    const response = await fetchAIResponse(fullText, aiHistory);

    setAiHistory((prev) => [...prev, { role: 'assistant' as const, content: response.reply }]);
    setAiLoading(false);

    if (response.success) {
      setAiStatus('online');
    } else {
      setAiStatus('error');
    }

    addBotMsg(response.reply);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxFiles = 5;
    const maxSize = 10 * 1024 * 1024;

    Array.from(files).forEach((file, index) => {
      if (attachments.length >= maxFiles) return;
      if (file.size > maxSize) {
        addBotMsg(`File "${file.name}" terlalu besar (maks 10MB).`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          const isImage = file.type.startsWith('image/');
          const newAtt: ChatAttachment = {
            id: `att-${Date.now()}-${index}`,
            name: file.name,
            type: isImage ? 'image' : 'file',
            dataUrl: ev.target.result as string,
            size: file.size,
          };
          setAttachments((prev) => [...prev, newAtt]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const renderAttachmentsInChat = (atts: ChatAttachment[]) => (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {atts.map((att) => (
        <div key={att.id} className="relative">
          {att.type === 'image' ? (
            <img
              src={att.dataUrl}
              alt={att.name}
              className="w-20 h-20 object-cover rounded-lg border border-white/20"
            />
          ) : (
            <div className="w-20 h-20 bg-white/10 rounded-lg border border-white/20 flex flex-col items-center justify-center p-1">
              <FileText className="w-6 h-6 text-white/80" />
              <span className="text-[8px] text-white/70 text-center truncate w-full mt-0.5">
                {att.name}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const getStatusIcon = () => {
    switch (aiStatus) {
      case 'checking':
        return <Loader2 className="w-2 h-2 text-yellow-400 animate-spin" />;
      case 'online':
        return (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        );
      case 'offline':
      case 'error':
        return <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (aiStatus) {
      case 'checking':
        return 'Memeriksa koneksi...';
      case 'online':
        return 'AI Online';
      case 'offline':
        return 'AI Offline';
      case 'error':
        return 'Koneksi bermasalah';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (aiStatus) {
      case 'checking':
        return 'text-yellow-300';
      case 'online':
        return 'text-green-300';
      case 'offline':
      case 'error':
        return 'text-red-300';
      default:
        return 'text-blue-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="bg-[#0d3b66] text-white px-4 py-3 flex items-center gap-3 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentView('portal')}
          className="text-white hover:bg-white/10 rounded-full h-9 w-9"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
          <Bot className="w-5 h-5 text-yellow-400" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-sm flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4" />
            Obrolan Seru
          </h2>
          <p className={`text-xs flex items-center gap-1.5 ${getStatusColor()}`}>
            {getStatusIcon()}
            {getStatusText()}
            {aiStatus === 'error' && (
              <button
                onClick={checkAIHealth}
                className="ml-2 inline-flex items-center gap-1 hover:text-white transition-colors"
                title="Coba lagi"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Coba lagi</span>
              </button>
            )}
          </p>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50"
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.from === 'bot' ? 'justify-start' : 'justify-end'}`}>
            <div className="max-w-[85%]">
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.from === 'bot'
                    ? 'bg-white text-gray-800 shadow-sm border rounded-bl-md'
                    : 'bg-[#0d3b66] text-white rounded-br-md'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                {msg.attachments && msg.attachments.length > 0 && renderAttachmentsInChat(msg.attachments)}
              </div>
              <p
                className={`text-[10px] mt-1 ${
                  msg.from === 'bot' ? 'text-gray-400 text-left' : 'text-gray-400 text-right'
                }`}
              >
                {formatTime(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {aiLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 shadow-sm border rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
                <span className="text-sm text-gray-400">AI sedang mengetik...</span>
                <span className="flex gap-0.5 ml-1">
                  <span
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0s' }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.15s' }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.3s' }}
                  />
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {attachments.length > 0 && (
        <div className="px-4 py-2 bg-white border-t flex flex-wrap gap-2 shrink-0">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="relative bg-gray-50 rounded-lg border border-gray-200 p-2 flex items-center gap-2"
            >
              {att.type === 'image' ? (
                <img src={att.dataUrl} alt={att.name} className="w-8 h-8 object-cover rounded" />
              ) : (
                <FileText className="w-5 h-5 text-gray-500" />
              )}
              <div className="min-w-0 max-w-[120px]">
                <p className="text-xs text-gray-700 truncate">{att.name}</p>
                <p className="text-[10px] text-gray-400">{formatFileSize(att.size)}</p>
              </div>
              <button
                onClick={() => removeAttachment(att.id)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <XCircle className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="border-t bg-white p-3 shrink-0">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <button
            onClick={handleFileSelect}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors shrink-0"
            title="Lampirkan file atau foto"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !aiLoading && !e.shiftKey && handleSend()}
              placeholder={aiStatus === 'error' ? 'AI bermasalah, tapi tetap bisa chat...' : 'Ketik pesan...'}
              className="w-full text-sm text-gray-800 border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 placeholder-gray-400"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={(!input.trim() && attachments.length === 0) || aiLoading}
            className="w-10 h-10 rounded-full bg-[#0d3b66] text-white flex items-center justify-center hover:bg-[#0a2e50] transition-colors disabled:opacity-40 disabled:hover:bg-[#0d3b66] shrink-0"
          >
            {aiLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
