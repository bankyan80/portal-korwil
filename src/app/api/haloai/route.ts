import { NextRequest, NextResponse } from 'next/server';
import { buildSystemPrompt, ChatContext } from '@/lib/haloAI';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history, context }: { message: string; history: { role: string; content: string }[]; context: ChatContext } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, reply: 'Pesan tidak boleh kosong.' }, { status: 400 });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return NextResponse.json({
        success: false,
        reply: 'Layanan AI belum dikonfigurasi. Hubungi administrator.',
      }, { status: 503 });
    }

    const systemPrompt = buildSystemPrompt(context);

    const contents = [
      { role: 'user' as const, parts: [{ text: systemPrompt }] },
      { role: 'model' as const, parts: [{ text: 'Baik, saya siap membantu sebagai HaloAI.' }] },
      ...history.slice(-10).map((h: { role: string; content: string }) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }],
      })),
      { role: 'user' as const, parts: [{ text: message.trim() }] },
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('HaloAI GEMINI HTTP ERROR:', response.status, errText);
      return NextResponse.json(
        { success: false, reply: 'Maaf, terjadi gangguan pada AI. Silakan coba lagi beberapa saat.' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return NextResponse.json({
      success: true,
      reply: text || 'Maaf, saya belum bisa menjawab saat ini.',
    });
  } catch (error: any) {
    console.error('HaloAI API error:', error?.message || error);
    return NextResponse.json(
      { success: false, reply: 'Maaf, terjadi kesalahan pada layanan AI. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
