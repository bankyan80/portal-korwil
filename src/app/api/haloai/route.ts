import { NextRequest, NextResponse } from 'next/server';
import { getModel, buildSystemPrompt, ChatContext } from '@/lib/haloAI';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history, context }: { message: string; history: { role: string; content: string }[]; context: ChatContext } = body;

    if (!message) {
      return NextResponse.json({ success: false, reply: 'Pesan tidak boleh kosong.' }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(context);

    const model = getModel(false);
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Baik, saya siap membantu sebagai HaloAI.' }] },
        ...history.slice(-10).map((h: { role: string; content: string }) => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }],
        })),
      ],
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    return NextResponse.json({ success: true, reply });
  } catch (error: any) {
    console.error('HaloAI API error:', error);
    return NextResponse.json(
      { success: false, reply: 'Maaf, terjadi kesalahan pada layanan AI. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
