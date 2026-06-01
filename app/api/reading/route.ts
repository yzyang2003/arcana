import { NextRequest, NextResponse } from 'next/server';
import { buildPrompt, ReadingCard } from '@/src/lib/ai';

export const runtime = 'nodejs';

interface ReadingRequestBody {
  spreadType: string;
  cards: ReadingCard[];
  question: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ReadingRequestBody = await request.json();
    const { spreadType, cards, question } = body;

    if (!cards || cards.length === 0 || !question) {
      return NextResponse.json(
        { error: '请提供塔罗牌信息和您的问题' },
        { status: 400 }
      );
    }

    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      console.error('AI_API_KEY not set');
      return NextResponse.json(
        { error: 'AI 服务未配置，请联系管理员' },
        { status: 500 }
      );
    }

    const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
    const model = process.env.AI_MODEL || 'gpt-4o-mini';


    const messages = buildPrompt(cards, question);

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status);
      return NextResponse.json(
        { error: 'AI 解读服务暂时不可用，请稍后重试' },
        { status: 502 }
      );
    }

    // Stream the SSE response directly to the client
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            controller.enqueue(new TextEncoder().encode(chunk));
          }
        } catch (error) {
          console.error('Stream error:', error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Reading API error:', error);
    return NextResponse.json(
      { error: '解读过程中出现错误，请重试' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
