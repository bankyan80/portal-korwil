import { NextRequest, NextResponse } from 'next/server';
import { buildSystemPrompt, ChatContext } from '@/lib/haloAI';
import { findLocalAnswer } from '@/lib/haloAI-knowledge';

const GEMINI_MODELS = (process.env.GEMINI_MODELS || 'gemini-2.5-flash,gemini-2.0-flash')
  .split(',')
  .map(m => m.trim())
  .filter(m => m.length > 0);

const DAILY_LIMITS: Record<string, number> = {
  super_admin: 300,
  operator_sekolah: 100,
  publik: 20,
};

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const dailyUsageMap = new Map<string, { count: number; date: string }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 5_000 });
    return true;
  }

  return false;
}

function checkDailyLimit(userId: string, role: string): { allowed: boolean; remaining: number; total: number } {
  const today = new Date().toISOString().split('T')[0];
  const key = `${userId}:${today}`;
  const usage = dailyUsageMap.get(key);
  const limit = DAILY_LIMITS[role] || DAILY_LIMITS.publik;

  if (!usage || usage.date !== today) {
    dailyUsageMap.set(key, { count: 1, date: today });
    return { allowed: true, remaining: limit - 1, total: limit };
  }

  if (usage.count >= limit) {
    return { allowed: false, remaining: 0, total: limit };
  }

  usage.count++;
  return { allowed: true, remaining: limit - usage.count, total: limit };
}

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      {
        success: false,
        code: 'RATE_LIMITED',
        reply: 'Mohon tunggu beberapa detik sebelum mengirim pesan berikutnya.',
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { message, history, context }: { message: string; history: { role: string; content: string }[]; context: ChatContext } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, code: 'EMPTY_MESSAGE', reply: 'Pesan tidak boleh kosong.' }, { status: 400 });
    }

    const trimmed = message.trim();

    // Step 1: Check local knowledge base (no Gemini needed)
    const localAnswer = findLocalAnswer(trimmed);
    if (localAnswer) {
      console.log(`[HaloAI] Local KB match (confidence: ${localAnswer.confidence})`);
      return NextResponse.json({
        success: true,
        source: 'local',
        reply: localAnswer.answer,
      });
    }

    // Step 2: Check API key
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'YOUR_GEMINI_API_KEY') {
      return NextResponse.json({
        success: false,
        code: 'API_KEY_NOT_CONFIGURED',
        reply: 'GEMINI_API_KEY belum dikonfigurasi. Hubungi administrator.',
      }, { status: 503 });
    }

    // Step 3: Check daily limit
    const userId = context.schoolId || context.userName || ip;
    const role = context.userRole || 'publik';
    const dailyCheck = checkDailyLimit(userId, role);

    if (!dailyCheck.allowed) {
      console.warn(`[HaloAI] Daily limit reached for ${userId} (${role})`);
      return NextResponse.json(
        {
          success: false,
          code: 'DAILY_LIMIT_REACHED',
          reply: `Batas pertanyaan harian Anda (${dailyCheck.total}/hari) sudah habis. Silakan coba lagi besok.`,
          remaining: 0,
          total: dailyCheck.total,
        },
        { status: 429 }
      );
    }

    // Step 4: Build minimal context for Gemini (only last 3 messages, not full history)
    const systemPrompt = buildSystemPrompt(context);

    const recentHistory = history.slice(-3);
    const contents = [
      { role: 'user' as const, parts: [{ text: systemPrompt }] },
      { role: 'model' as const, parts: [{ text: 'Baik, saya siap membantu sebagai HaloAI.' }] },
      ...recentHistory.map((h: { role: string; content: string }) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }],
      })),
      { role: 'user' as const, parts: [{ text: trimmed }] },
    ];

    let lastError = '';
    let lastCode = '';
    let fallbackAttempted = false;

    for (let i = 0; i < GEMINI_MODELS.length; i++) {
      const model = GEMINI_MODELS[i];

      if (fallbackAttempted) {
        console.log(`[HaloAI] Waiting 1.5s before fallback to ${model}...`);
        await delay(1500);
      }

      console.log(`[HaloAI] Trying model: ${model} (attempt ${i + 1}/${GEMINI_MODELS.length})`);

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
                maxOutputTokens: 1024,
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
              success: true,
              model,
              source: 'gemini',
              reply: text,
              remaining: dailyCheck.remaining,
              total: dailyCheck.total,
            });
          }

          console.warn(`[HaloAI] Empty response from ${model}, trying fallback...`);
          lastError = 'Empty response from Gemini';
          lastCode = 'EMPTY_RESPONSE';
          fallbackAttempted = true;
          continue;
        }

        const errText = await response.text();
        const statusCode = response.status;

        let detail = '';
        let isModelNotFound = false;
        try {
          const errJson = JSON.parse(errText);
          detail = errJson?.error?.message || errText;
          isModelNotFound = detail.includes('not found') || statusCode === 404;
        } catch {
          detail = errText;
        }

        if (isModelNotFound) {
          console.warn(`[HaloAI] Model not found: ${model}, skipping...`);
          lastError = detail;
          lastCode = 'MODEL_NOT_FOUND';
          fallbackAttempted = true;
          continue;
        }

        if (statusCode === 429) {
          console.warn(`[HaloAI] Rate limited on ${model} (429), trying fallback...`);
          lastError = detail;
          lastCode = 'RATE_LIMITED';
          fallbackAttempted = true;
          continue;
        }

        console.error(`[HaloAI] HTTP error on ${model}: ${statusCode} - ${detail}`);
        lastError = detail;
        lastCode = `HTTP_${statusCode}`;
        break;
      } catch (fetchError: any) {
        console.error(`[HaloAI] Fetch error on ${model}: ${fetchError?.message || fetchError}`);
        lastError = fetchError?.message || 'Fetch failed';
        lastCode = 'FETCH_ERROR';
        fallbackAttempted = true;
        continue;
      }
    }

    console.error(`[HaloAI] ALL MODELS FAILED. Last code: ${lastCode}, Last error: ${lastError}`);

    if (lastCode === 'RATE_LIMITED' || lastCode === 'EMPTY_RESPONSE') {
      return NextResponse.json(
        {
          success: false,
          code: 'ALL_MODELS_RATE_LIMITED',
          reply: 'HaloAI sedang ramai digunakan. Silakan coba lagi beberapa saat.',
          detail: lastError,
        },
        { status: 429 }
      );
    }

    if (lastCode === 'MODEL_NOT_FOUND') {
      return NextResponse.json(
        {
          success: false,
          code: 'MODEL_NOT_FOUND',
          reply: 'Model AI tidak tersedia. Silakan cek konfigurasi Gemini.',
          detail: lastError,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        code: lastCode || 'ALL_MODELS_FAILED',
        reply: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.',
        detail: lastError,
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('[HaloAI] Unhandled error:', error?.message || error);

    return NextResponse.json(
      {
        success: false,
        code: 'INTERNAL_ERROR',
        reply: 'Terjadi error pada HaloAI',
        detail: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
