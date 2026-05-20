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
    if (!key || key === 'YOUR_GEMINI_API_KEY') {
      return NextResponse.json({
        success: false,
        reply: 'GEMINI_API_KEY belum dikonfigurasi. Hubungi administrator.',
        detail: 'Environment variable GEMINI_API_KEY is not set or is still using placeholder value.',
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

    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError = '';

    for (const model of models) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
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

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
          return NextResponse.json({
            success: true,
            reply: text,
            model,
          });
        }

        console.error('HaloAI EMPTY RESPONSE from', model, ':', JSON.stringify(data).slice(0, 500));
        lastError = 'Response from Gemini was empty';
        continue;
      }

      const errText = await response.text();
      const isRateLimit = response.status === 429;

      if (isRateLimit) {
        console.warn(`HaloAI rate limited on ${model}, trying fallback...`);
        lastError = errText;
        continue;
      }

      console.error(`HaloAI GEMINI HTTP ERROR (${model}):`, response.status, errText);

      let detail = 'Unknown error';
      try {
        const errJson = JSON.parse(errText);
        detail = errJson?.error?.message || errText;
      } catch {
        detail = errText;
      }

      lastError = detail;

      if (!isRateLimit) break;
    }

    return NextResponse.json(
      {
        success: false,
        reply: 'Maaf, AI sedang sibuk. Silakan tunggu beberapa saat lalu coba lagi.',
        detail: lastError,
        httpStatus: 429,
      },
      { status: 429 }
    );
  } catch (error: any) {
    console.error('ERROR /api/haloai:', error?.message || error);
    console.error('ERROR /api/haloai stack:', error?.stack || '');

    return NextResponse.json(
      {
        success: false,
        reply: 'Terjadi error pada HaloAI',
        error: error?.message || 'Unknown error',
        detail: String(error),
      },
      { status: 500 }
    );
  }
}
