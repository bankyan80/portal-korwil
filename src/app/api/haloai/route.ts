import { NextRequest, NextResponse } from 'next/server';
import { buildSystemPrompt, ChatContext, checkGeminiHealth } from '@/lib/haloAI';
import { findLocalAnswer, classifyComplexity, classifyQueryType, getSmartRoutingReply, type Complexity, type QueryType } from '@/lib/haloAI-knowledge';
import { searchGoogle, formatSearchReply, hasSearchIntent } from '@/lib/google-search';

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

function checkDailyLimit(userId: string, role: string): { allowed: boolean; remaining: number; total: number; status: 'green' | 'yellow' | 'red' } {
  const today = new Date().toISOString().split('T')[0];
  const key = `${userId}:${today}`;
  const usage = dailyUsageMap.get(key);
  const limit = DAILY_LIMITS[role] || DAILY_LIMITS.publik;

  if (!usage || usage.date !== today) {
    dailyUsageMap.set(key, { count: 1, date: today });
    const remaining = limit - 1;
    const pct = remaining / limit;
    const status = pct <= 0.2 ? 'yellow' : 'green';
    return { allowed: true, remaining, total: limit, status };
  }

  if (usage.count >= limit) {
    return { allowed: false, remaining: 0, total: limit, status: 'red' };
  }

  usage.count++;
  const remaining = limit - usage.count;
  const pct = remaining / limit;
  const status = remaining === 0 ? 'red' : pct <= 0.2 ? 'yellow' : 'green';
  return { allowed: true, remaining, total: limit, status };
}

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function GET() {
  const health = await checkGeminiHealth();
  return NextResponse.json({
    ok: health.ok,
    model: health.model,
    timestamp: Date.now(),
  });
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      {
        success: true,
        source: 'local',
        code: 'RATE_LIMITED',
        reply: 'Mohon tunggu beberapa detik sebelum mengirim pesan berikutnya.',
      }
    );
  }

  try {
    const body = await req.json();
    const { message, history, context: ctx }: { message: string; history: { role: string; content: string }[]; context: ChatContext } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, code: 'EMPTY_MESSAGE', reply: 'Pesan tidak boleh kosong.' }, { status: 400 });
    }

    const trimmed = message.trim();
    const complexity = classifyComplexity(trimmed);

    const localAnswer = findLocalAnswer(trimmed);
    if (localAnswer) {
      console.log(`[HaloAI] Local KB match (confidence: ${localAnswer.confidence}, complexity: ${complexity})`);
      return NextResponse.json({
        success: true,
        source: 'local',
        complexity,
        reply: localAnswer.answer,
      });
    }

    const queryType = classifyQueryType(trimmed);
    const shouldSearch = queryType === 'general_search' || (queryType === 'unknown' && hasSearchIntent(trimmed));

    if (shouldSearch) {
      const searchResponse = await searchGoogle(trimmed);
      if (searchResponse.results.length > 0) {
        console.log(`[HaloAI] Google Search grounding used for: "${trimmed}" (${searchResponse.results.length} results)`);
        return NextResponse.json({
          success: true,
          source: 'search',
          queryType,
          complexity,
          reply: formatSearchReply(searchResponse.results, trimmed),
          sources: searchResponse.results.slice(0, 3).map(r => ({ title: r.title, link: r.link })),
        });
      }
      console.log(`[HaloAI] Google Search failed: ${searchResponse.error}, falling back to Gemini`);
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'YOUR_GEMINI_API_KEY') {
      const fallbackReply = getSmartRoutingReply(trimmed, complexity, null, true);
      return NextResponse.json({
        success: true,
        source: 'local',
        complexity,
        reply: fallbackReply.reply || 'GEMINI_API_KEY belum dikonfigurasi. Hubungi administrator.',
      });
    }

    const userId = ctx?.schoolId || ctx?.userName || ip;
    const role = ctx?.userRole || 'publik';
    const dailyCheck = checkDailyLimit(userId, role);

    if (!dailyCheck.allowed) {
      console.warn(`[HaloAI] Daily limit reached for ${userId} (${role})`);
      const fallbackReply = getSmartRoutingReply(trimmed, complexity, null, true);
      return NextResponse.json({
        success: true,
        source: 'local',
        complexity,
        reply: fallbackReply.reply || `Batas pertanyaan harian Anda (${dailyCheck.total}/hari) sudah habis. Silakan coba lagi besok.`,
        remaining: 0,
        total: dailyCheck.total,
        quotaStatus: 'red',
      });
    }

    if (complexity === 'sederhana') {
      const templateReply = getSmartRoutingReply(trimmed, complexity, null, false);
      if (templateReply.reply) {
        return NextResponse.json({
          success: true,
          source: 'local',
          complexity,
          reply: templateReply.reply,
          remaining: dailyCheck.remaining,
          total: dailyCheck.total,
          quotaStatus: dailyCheck.status,
        });
      }
    }

    const systemPrompt = buildSystemPrompt(ctx, complexity);

    const recentHistory = (history || []).slice(-3);
    const contents = [
      { role: 'user' as const, parts: [{ text: systemPrompt }] },
      { role: 'model' as const, parts: [{ text: 'Baik, saya siap membantu sebagai HaloAI.' }] },
      ...recentHistory.map((h: { role: string; content: string }) => ({
        role: h.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: h.content }],
      })),
      { role: 'user' as const, parts: [{ text: trimmed }] },
    ];

    const maxTokens = complexity === 'kompleks' ? 2048 : 1024;
    const usePro = complexity === 'kompleks' && dailyCheck.remaining > 10;

    let lastError = '';
    let lastCode = '';
    let fallbackAttempted = false;

    const modelsToTry = usePro
      ? [...GEMINI_MODELS]
      : GEMINI_MODELS.filter(m => !m.includes('pro'));

    for (let i = 0; i < modelsToTry.length; i++) {
      const model = modelsToTry[i];

      if (fallbackAttempted) {
        await delay(1500);
      }

      console.log(`[HaloAI] Trying model: ${model} (complexity: ${complexity}, attempt ${i + 1}/${modelsToTry.length})`);

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              generationConfig: {
                temperature: complexity === 'kompleks' ? 0.8 : 0.7,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: maxTokens,
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
              complexity,
              reply: text,
              remaining: dailyCheck.remaining,
              total: dailyCheck.total,
              quotaStatus: dailyCheck.status,
            });
          }

          console.warn(`[HaloAI] Empty response from ${model}`);
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
          console.warn(`[HaloAI] Model not found: ${model}`);
          lastError = detail;
          lastCode = 'MODEL_NOT_FOUND';
          fallbackAttempted = true;
          continue;
        }

        if (statusCode === 429) {
          console.warn(`[HaloAI] Rate limited on ${model} (429)`);
          lastError = detail;
          lastCode = 'RATE_LIMITED';
          fallbackAttempted = true;
          continue;
        }

        console.error(`[HaloAI] HTTP error on ${model}: ${statusCode}`);
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

    console.error(`[HaloAI] ALL MODELS FAILED. Last code: ${lastCode}`);

    const fallbackReply = getSmartRoutingReply(trimmed, complexity, null, true);
    if (fallbackReply.reply) {
      return NextResponse.json({
        success: true,
        source: 'local',
        complexity,
        reply: fallbackReply.reply,
        remaining: dailyCheck.remaining,
        total: dailyCheck.total,
        quotaStatus: dailyCheck.status,
        fallbackNote: 'Jawaban dari basis pengetahuan lokal (AI tidak tersedia)',
      });
    }

    const errorMessages: Record<string, string> = {
      RATE_LIMITED: 'HaloAI sedang ramai digunakan. Silakan coba lagi beberapa saat.',
      ALL_MODELS_RATE_LIMITED: 'HaloAI sedang ramai digunakan. Silakan coba lagi beberapa saat.',
      MODEL_NOT_FOUND: 'Model AI tidak tersedia. Silakan coba lagi nanti.',
      EMPTY_RESPONSE: 'AI sedang sibuk. Silakan coba lagi.',
      FETCH_ERROR: 'Koneksi ke AI terputus. Silakan coba lagi.',
    };

    return NextResponse.json(
      {
        success: false,
        code: lastCode || 'ALL_MODELS_FAILED',
        reply: lastCode === 'RATE_LIMITED'
          ? errorMessages.RATE_LIMITED
          : errorMessages[lastCode] || 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.',
        remaining: dailyCheck.remaining,
        total: dailyCheck.total,
        quotaStatus: dailyCheck.status,
      },
      { status: 503 }
    );
  } catch (error: any) {
    console.error('[HaloAI] Unhandled error:', error?.message || error);

    return NextResponse.json(
      {
        success: false,
        code: 'INTERNAL_ERROR',
        reply: 'Terjadi error pada HaloAI. Silakan coba lagi.',
      },
      { status: 500 }
    );
  }
}
