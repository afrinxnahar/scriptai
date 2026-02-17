import { ConfigService } from '@nestjs/config';

export interface GoogleAIInstance {
  files: {
    get(params: { name: string }): Promise<{ state: string; uri?: string; stateDescription?: string }>;
    upload(params: { file: string; config: { mimeType: string } }): Promise<{ name: string; uri: string; mimeType: string }>;
  };
  models: {
    generateContent(params: {
      model: string;
      contents: Array<{ role: string; parts: Array<{ text?: string; fileData?: { fileUri: string; mimeType: string } }> }>;
      config?: { responseMimeType?: string };
    }): Promise<{ text: string }>;
  };
}

let cachedGoogleAI: GoogleAIInstance | null = null;
let cachedApiKey: string | null = null;

export async function createGoogleAI(configService: ConfigService): Promise<GoogleAIInstance> {
  const apiKey = configService.get<string>('GOOGLE_GENERATIVE_AI_API_KEY');
  if (!apiKey) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not configured');
  }

  if (cachedGoogleAI && cachedApiKey === apiKey) {
    return cachedGoogleAI;
  }

  const mod = await (Function('return import("@google/genai")')() as Promise<{ GoogleGenAI: new (opts: { apiKey: string }) => GoogleAIInstance }>);
  cachedGoogleAI = new mod.GoogleGenAI({ apiKey });
  cachedApiKey = apiKey;
  return cachedGoogleAI;
}
