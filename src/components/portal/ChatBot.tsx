'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Sparkles, Paperclip, Image, FileText, XCircle } from 'lucide-react';

type Step = 'menu' | 'chat-ai';

interface ChatAttachment {
  id: string;
  name: string;
  type: 'image' | 'file';
  dataUrl: string;
  size: number;
}

interface ChatMessage {
  from: 'bot' | 'user';
  text: string;
  attachments?: ChatAttachment[];
  options?: { label: string; value: string }[];
}

const menuOptions: { label: string; value: string }[] = [
  { label: '💬 Chat dengan AI', value: 'chat-ai' },
];

async function fetchAIResponse(messages: { role: string; text: string }[]): Promise<string> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    const data = await res.json();
    return data.reply || 'Maaf, saya tidak bisa menjawab saat ini.';
  } catch (e) {
    console.error('Error fetching AI response:', e);
    return 'Maaf, terjadi kesalahan. Silakan coba lagi.';
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('chat-ai');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: 'bot', text: 'Halo! Saya asisten AI Portal Pendidikan Kecamatan Lemahabang. Silakan tanya apa pun tentang pendidikan, sekolah, atau informasi terkait. Anda juga bisa mengirim foto atau file untuk dibahas. 😊' },
  ]);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState<{ role: string; text: string }[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, attachments]);

  useEffect(() => {
    if (open && step === 'chat-ai' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, step]);

  const addBotMsg = (text: string, opts?: { options?: { label: string; value: string }[] }) => {
    setMessages((prev) => [...prev, { from: 'bot', text, ...opts }]);
  };

  const addUserMsg = (text: string, atts?: ChatAttachment[]) => {
    setMessages((prev) => [...prev, { from: 'user', text, attachments: atts?.length ? atts : undefined }]);
  };

  const handleOptionClick = (value: string) => {
    const labels: Record<string, string> = {
      'chat-ai': '💬 Chat dengan AI',
    };
    addUserMsg(labels[value] || value);

    if (value === 'chat-ai') {
      setStep('chat-ai');
      setAiHistory([]);
      setAttachments([]);
      addBotMsg('Halo! Saya asisten AI Portal Pendidikan. Silakan tanya apa pun tentang pendidikan, sekolah, atau informasi terkait Kecamatan Lemahabang. Anda juga bisa mengirim foto atau file untuk dibahas. 👋');
    }
  };

  const handleSendText = () => {
    const val = input.trim();
    if (!val && attachments.length === 0) return;

    const attsToSend = [...attachments];
    const textToSend = val || (attsToSend.length > 0 ? `[Mengirim ${attsToSend.length} file]` : '');

    addUserMsg(textToSend, attsToSend);
    setInput('');
    setAttachments([]);

    if (step === 'chat-ai') {
      let fullText = textToSend;
      if (attsToSend.length > 0) {
        const fileNames = attsToSend.map(a => `${a.name} (${a.type})`).join(', ');
        fullText = textToSend + `\n\n[Lampiran: ${fileNames}]`;
      }

      setAiLoading(true);
      const newHistory = [...aiHistory, { role: 'user', text: fullText }];
      setAiHistory(newHistory);
      
      fetchAIResponse(newHistory).then((reply) => {
        setAiHistory((prev) => [...prev, { role: 'assistant', text: reply }]);
        setAiLoading(false);
        addBotMsg(reply);
      });
    }
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

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setMessages([
        { from: 'bot', text: 'Halo! Ada yang bisa saya bantu? Silakan pilih salah satu:', options: menuOptions },
      ]);
      setStep('menu');
      setAiLoading(false);
      setAiHistory([]);
      setAttachments([]);
      setInput('');
    }, 300);
  };

  const renderAttachments = (atts: ChatAttachment[]) => (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {atts.map((att) => (
        <div key={att.id} className="relative group">
          {att.type === 'image' ? (
            <img
              src={att.dataUrl}
              alt={att.name}
              className="w-16 h-16 object-cover rounded-lg border border-gray-200"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex flex-col items-center justify-center p-1">
              <FileText className="w-6 h-6 text-gray-500" />
              <span className="text-[8px] text-gray-500 text-center truncate w-full">
                {att.name}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#0d3b66] text-white shadow-lg hover:bg-[#0a2e50] hover:scale-105 transition-all duration-200 flex items-center justify-center ${open ? 'hidden' : ''}`}
        aria-label="Buka Chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl border flex flex-col overflow-hidden">
          <div className="bg-[#0d3b66] text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-yellow-400" />
              <span className="font-semibold text-sm">Asisten Portal</span>
            </div>
            <button onClick={handleClose} className="text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'bot' ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.from === 'bot'
                      ? 'bg-white text-gray-800 shadow-sm border rounded-bl-md'
                      : 'bg-[#0d3b66] text-white rounded-br-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  {msg.attachments && msg.attachments.length > 0 && renderAttachments(msg.attachments)}
                  {msg.options && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleOptionClick(opt.value)}
                          className="text-xs font-medium px-3 py-1.5 rounded-full border transition-colors hover:bg-gray-100 border-gray-200 text-gray-700"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 shadow-sm border rounded-2xl rounded-bl-md px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
                    <span className="text-gray-400">AI sedang mengetik...</span>
                    <span className="flex gap-0.5">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {attachments.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t flex flex-wrap gap-2">
              {attachments.map((att) => (
                <div key={att.id} className="relative group bg-white rounded-lg border border-gray-200 p-2 flex items-center gap-2">
                  {att.type === 'image' ? (
                    <img src={att.dataUrl} alt={att.name} className="w-8 h-8 object-cover rounded" />
                  ) : (
                    <FileText className="w-5 h-5 text-gray-500" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-gray-700 truncate max-w-[100px]">{att.name}</p>
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

          {step === 'chat-ai' && (
            <div className="border-t px-3 py-3 flex items-end gap-2 bg-white shrink-0">
              <button
                onClick={handleFileSelect}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors shrink-0"
                title="Lampirkan file atau foto"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !aiLoading && !e.shiftKey && handleSendText()}
                  placeholder="Ketik pesan..."
                  className="w-full text-sm text-gray-800 border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 placeholder-gray-400"
                />
              </div>
              <button
                onClick={handleSendText}
                disabled={!input.trim() && attachments.length === 0}
                className="w-9 h-9 rounded-full bg-[#0d3b66] text-white flex items-center justify-center hover:bg-[#0a2e50] transition-colors disabled:opacity-40 disabled:hover:bg-[#0d3b66] shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}

          {step !== 'chat-ai' && (
            <div className="border-t px-4 py-3 flex items-center gap-2 bg-white shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !aiLoading && handleSendText()}
                placeholder="Pilih menu di atas..."
                disabled
                className="flex-1 text-sm text-gray-800 border border-gray-200 rounded-xl px-4 py-2 bg-gray-100 placeholder-gray-400 cursor-not-allowed"
              />
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}
    </>
  );
}
