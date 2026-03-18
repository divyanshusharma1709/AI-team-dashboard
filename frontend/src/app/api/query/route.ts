import { NextResponse } from 'next/server';
const REQUEST_TIMEOUT_MS = 15000;

function backendCandidates() {
  const raw = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || '';
  const normalized = raw ? raw.replace(/\/+$/, '') : '';
  const devFallbacks =
    process.env.NODE_ENV === 'development'
      ? ['http://127.0.0.1:8000', 'http://localhost:8000']
      : [];

  return Array.from(new Set([normalized, ...devFallbacks].filter(Boolean)));
}

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    let lastError: string | null = null;
    const candidates = backendCandidates();

    for (const apiUrl of candidates) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        const response = await fetch(`${apiUrl}/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeout));

        if (!response.ok) {
          const errorText = await response.text();
          lastError = `API Error from ${apiUrl}: ${response.status} ${response.statusText} - ${errorText}`;
          continue;
        }

        const data = await response.json();
        return NextResponse.json(data);
      } catch (error) {
        lastError = `Request failed for ${apiUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }

    console.error('Error processing query. Tried candidates:', candidates, lastError);
    return NextResponse.json(
      { error: 'Failed to process query', candidatesTried: candidates, details: lastError },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error processing query:', error);
    return NextResponse.json(
      { error: 'Failed to process query', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
