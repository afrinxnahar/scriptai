import { GoogleGenAI } from '@google/genai';

const keys: string[] = (
  process.env.GOOGLE_GENERATIVE_AI_API_KEYS ??
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
  ''
)
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean);

if (!keys.length) {
  throw new Error('No Gemini API keys configured');
}

let currentIdx = 0;

function getClient(): GoogleGenAI {
  return new GoogleGenAI({ apiKey: keys[currentIdx]! });
}

function rotateKey(): GoogleGenAI {
  currentIdx = (currentIdx + 1) % keys.length;
  console.warn(`[GeminiKeyRotator] Rotated to key index ${currentIdx}`);
  return getClient();
}

function is429(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message;
    return (
      msg.includes('429') ||
      msg.includes('RESOURCE_EXHAUSTED') ||
      msg.includes('rate limit')
    );
  }
  if (typeof error === 'object' && error !== null) {
    const status = (error as any).status ?? (error as any).httpStatusCode;
    return status === 429;
  }
  return false;
}

export async function withKeyRotation<T>(
  fn: (ai: GoogleGenAI) => Promise<T>,
  maxRetries = keys.length,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn(getClient());
    } catch (err) {
      lastError = err;
      if (is429(err) && attempt < maxRetries - 1) {
        rotateKey();
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export { getClient as getGeminiClient };
