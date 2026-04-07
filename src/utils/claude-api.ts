// Rate limiter: max 5 calls per minute
const callTimestamps: number[] = [];
const MAX_CALLS_PER_MINUTE = 5;

function checkRateLimit(): boolean {
  const now = Date.now();
  // Remove timestamps older than 60 seconds
  while (callTimestamps.length > 0 && now - callTimestamps[0] > 60_000) {
    callTimestamps.shift();
  }
  return callTimestamps.length < MAX_CALLS_PER_MINUTE;
}

function recordCall(): void {
  callTimestamps.push(Date.now());
}

export async function callClaude(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_CLAUDE_API_KEY is not set. Please create a .env file with your API key.');
  }

  if (!checkRateLimit()) {
    throw new Error('Rate limit reached (5 calls/minute). Please wait before running more analyses.');
  }

  recordCall();

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data.content?.[0];
  if (!content || content.type !== 'text') {
    throw new Error('Unexpected response format from Claude API');
  }

  return content.text as string;
}

export function getRateLimitStatus(): { remaining: number; resetsIn: number } {
  const now = Date.now();
  const validTimestamps = callTimestamps.filter((t) => now - t < 60_000);
  const remaining = MAX_CALLS_PER_MINUTE - validTimestamps.length;
  const oldest = validTimestamps[0];
  const resetsIn = oldest ? Math.ceil((oldest + 60_000 - now) / 1000) : 0;
  return { remaining, resetsIn };
}
