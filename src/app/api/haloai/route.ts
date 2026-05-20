import { NextRequest, NextResponse } from 'next/server';
import { buildSystemPrompt, ChatContext } from '@/lib/haloAI';

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history, context }: { message: string; history: { role: string; content: string }[]; context: ChatContext } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ ok: false, error: 'Pesan tidak boleh kosong.' }, { status: 400 });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'YOUR_GEMINI_API_KEY') {
      return NextResponse.json({
        ok: false,
        code: 'API_KEY_NOT_CONFIGURED',
        error: 'GEMINI_API_KEY belum dikonfigurasi. Hubungi administrator.',
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

    let lastError = '';
    let lastCode = '';

    for (const model of GEMINI_MODELS) {
      console.log(`[HaloAI] Trying model: ${model}`);

      try {
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
            console.log(`[HaloAI] SUCCESS with model: ${model}`);
            return NextResponse.json({
              ok: true,
              model,
              reply: text,
            });
          }

          console.warn(`[HaloAI] Empty response from ${model}, trying fallback...`);
          lastError = 'Empty response from Gemini';
          lastCode = 'EMPTY_RESPONSE';
          continue;
        }

        const errText = await response.text();
        const isRateLimit = response.status === 429;

        let detail = '';
        try {
          const errJson = JSON.parse(errText);
          detail = errJson?.error?.message || errText;
        } catch {
          detail = errText;
        }

        if (isRateLimit) {
          console.warn(`[HaloAI] Rate limited on ${model} (429), trying fallback...`);
          lastError = detail;
          lastCode = 'RATE_LIMITED';
          continue;
        }

        console.error(`[HaloAI] HTTP error on ${model}: ${response.status} - ${detail}`);
        lastError = detail;
        lastCode = `HTTP_${response.status}`;

        break;
      } catch (fetchError: any) {
        console.error(`[HaloAI] Fetch error on ${model}: ${fetchError?.message || fetchError}`);
        lastError = fetchError?.message || 'Fetch failed';
        lastCode = 'FETCH_ERROR';
        continue;
      }
    }

    console.error(`[HaloAI] ALL MODELS FAILED. Last error: ${lastCode} - ${lastError}`);

    if (lastCode === 'RATE_LIMITED' || lastCode === 'EMPTY_RESPONSE') {
      return NextResponse.json(
        {
          ok: false,
          code: 'ALL_MODELS_RATE_LIMITED',
          error: 'HaloAI sedang ramai digunakan. Silakan coba lagi beberapa saat.',
          detail: lastError,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        code: lastCode || 'ALL_MODELS_FAILED',
        error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.',
        detail: lastError,
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('[HaloAI] Unhandled error:', error?.message || error);
    console.error('[HaloAI] Stack:', error?.stack || '');

    return NextResponse.json(
      {
        ok: false,
        code: 'INTERNAL_ERROR',
        error: 'Terjadi error pada HaloAI',
        detail: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
