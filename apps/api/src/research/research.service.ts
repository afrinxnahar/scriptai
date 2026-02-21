import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import * as crypto from 'crypto';

const RESEARCH_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    topic: { type: 'string', description: 'Engaging, SEO-optimized suggested topic title' },
    research: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: 'Concise, hook-filled overview tailored to the channel style' },
        keyPoints: { type: 'array', items: { type: 'string' }, description: 'Actionable key points with YouTube tips' },
        trends: { type: 'array', items: { type: 'string' }, description: 'Current trends relevant to the niche' },
        questions: { type: 'array', items: { type: 'string' }, description: 'Viewer questions to spark discussions' },
        contentAngles: { type: 'array', items: { type: 'string' }, description: 'Video angles and content strategies' },
        sources: { type: 'array', items: { type: 'string' }, description: 'Direct valid URLs from authoritative resources' },
      },
      required: ['summary', 'keyPoints', 'trends', 'questions', 'contentAngles', 'sources'],
    },
  },
  required: ['topic', 'research'],
} as const;

export interface ResearchData {
  summary: string;
  keyPoints: string[];
  trends: string[];
  questions: string[];
  contentAngles: string[];
  sources: string[];
}

interface TextSegment { text: string; isBold: boolean }

const PAGE = { width: 595.28, height: 841.89 };
const MARGINS = { top: 60, bottom: 60, left: 50, right: 50 };
const COLORS = { black: rgb(0, 0, 0), darkGray: rgb(0.2, 0.2, 0.2), mediumGray: rgb(0.3, 0.3, 0.3) };

@Injectable()
export class ResearchService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  private async getGoogleAI(): Promise<any> {
    const apiKey = this.configService.get<string>('GOOGLE_GENERATIVE_AI_API_KEY');
    if (!apiKey) throw new InternalServerErrorException('Google AI API key not configured');
    const { GoogleGenAI } = await (Function('return import("@google/genai")')() as Promise<any>);
    return new GoogleGenAI({ apiKey });
  }

  async list(userId: string) {
    const { data, error } = await this.supabase
      .from('research_topics')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw new InternalServerErrorException('Failed to fetch recent topics');
    return data;
  }

  async getOne(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from('research_topics')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Research topic not found');
    return data;
  }

  async remove(id: string, userId: string) {
    const { error } = await this.supabase
      .from('research_topics')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new InternalServerErrorException('Failed to delete research topic');
    return { message: 'Topic deleted successfully' };
  }

  async create(userId: string, body: { topic?: string; context?: string; autoResearch: boolean }) {
    const { topic, context, autoResearch } = body;

    if (!autoResearch && !topic) {
      throw new BadRequestException('Topic is required unless auto-research is enabled');
    }

    const { data: profileData, error: profileError } = await this.supabase
      .from('profiles')
      .select('credits, ai_trained, youtube_connected')
      .eq('user_id', userId)
      .single();

    if (profileError || !profileData) throw new NotFoundException('Profile not found');
    if (!profileData.ai_trained && !profileData.youtube_connected) {
      throw new ForbiddenException('AI training and YouTube connection are required');
    }
    if (profileData.credits < 1) {
      throw new ForbiddenException('Insufficient credits. Please upgrade your plan or earn more credits.');
    }

    let channelData: any = null;
    let styleData: any = null;

    if (autoResearch || profileData.ai_trained) {
      const { data: ch, error: chErr } = await this.supabase
        .from('youtube_channels')
        .select('channel_name, channel_description, topic_details, default_language')
        .eq('user_id', userId)
        .single();
      if (!chErr || (chErr as any)?.code !== 'PGRST116') channelData = ch;

      const { data: st, error: stErr } = await this.supabase
        .from('user_style')
        .select('tone, vocabulary_level, pacing, themes, humor_style, structure, style_analysis, recommendations')
        .eq('user_id', userId)
        .single();
      if (!stErr || (stErr as any)?.code !== 'PGRST116') styleData = st;
    }

    const ai = await this.getGoogleAI();

    const researchPrompt = autoResearch
      ? this.buildAutoResearchPrompt(channelData, styleData, context)
      : this.buildManualResearchPrompt(topic!, channelData, styleData, context, profileData.ai_trained);

    let result: any;
    try {
      result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: researchPrompt }] }],
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseJsonSchema: RESEARCH_RESPONSE_SCHEMA,
        },
      });
    } catch {
      throw new InternalServerErrorException('Failed to generate research');
    }

    const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text ?? result?.text;
    if (!rawText) throw new InternalServerErrorException('AI returned an empty response');

    let response: { topic: string; research: ResearchData };
    try {
      response = JSON.parse(rawText);
    } catch {
      throw new InternalServerErrorException('Failed to generate valid research data');
    }

    const finalTopic = autoResearch ? response.topic : topic!;

    const { error: updateError } = await this.supabase
      .from('profiles')
      .update({ credits: profileData.credits - 1 })
      .eq('user_id', userId);
    if (updateError) throw new InternalServerErrorException('Failed to update credits');

    const record = {
      id: crypto.randomUUID(),
      user_id: userId,
      topic: finalTopic,
      context,
      research_data: response.research,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error: insertError } = await this.supabase
      .from('research_topics')
      .insert(record)
      .select()
      .single();

    if (insertError) throw new InternalServerErrorException(`Failed to save research: ${insertError.message}`);
    return { id: data.id, topic: finalTopic, research: response.research };
  }

  async exportPdf(id: string, userId: string): Promise<{ pdfBytes: Uint8Array; filename: string }> {
    const { data: record, error } = await this.supabase
      .from('research_topics')
      .select('topic, research_data, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !record) throw new NotFoundException('Research topic not found');

    const pdfDoc = await PDFDocument.create();
    const fonts = {
      regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
      bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
      oblique: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    };
    pdfDoc.setTitle(record.topic);

    const state = {
      page: pdfDoc.addPage([PAGE.width, PAGE.height]),
      y: PAGE.height - MARGINS.top,
    };

    const ensureSpace = (h: number) => {
      if (state.y - h < MARGINS.bottom) {
        state.page = pdfDoc.addPage([PAGE.width, PAGE.height]);
        state.y = PAGE.height - MARGINS.top;
      }
    };

    const parseRich = (text: string): TextSegment[] =>
      text.split(/(\*\*.*?\*\*)/g).filter(Boolean).map(p => ({
        text: p.startsWith('**') && p.endsWith('**') ? p.slice(2, -2) : p,
        isBold: p.startsWith('**') && p.endsWith('**'),
      }));

    const drawWrapped = (text: string, opts: { font: PDFFont; size: number; x: number; lineHeight: number; color?: any }) => {
      const { font, size, x, lineHeight, color = COLORS.darkGray } = opts;
      const maxW = PAGE.width - x - MARGINS.right;
      let line = '';
      for (const word of text.split(' ')) {
        const test = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(test, size) > maxW) {
          if (line) { ensureSpace(lineHeight); state.page.drawText(line, { x, y: state.y, font, size, color }); state.y -= lineHeight; }
          line = word;
        } else { line = test; }
      }
      if (line) { ensureSpace(lineHeight); state.page.drawText(line, { x, y: state.y, font, size, color }); state.y -= lineHeight; }
    };

    const drawRichWrapped = (text: string, opts: { size: number; x: number; lineHeight: number }) => {
      const { size, x, lineHeight } = opts;
      const maxW = PAGE.width - x - MARGINS.right;
      const segments = parseRich(text);
      let curLine: TextSegment[] = [];
      let curW = 0;

      const flush = () => {
        if (!curLine.length) return;
        ensureSpace(lineHeight);
        let cx = x;
        for (const s of curLine) {
          const f = s.isBold ? fonts.bold : fonts.regular;
          state.page.drawText(s.text, { x: cx, y: state.y, font: f, size, color: COLORS.darkGray });
          cx += f.widthOfTextAtSize(s.text, size);
        }
        state.y -= lineHeight;
        curLine = []; curW = 0;
      };

      for (const seg of segments) {
        const f = seg.isBold ? fonts.bold : fonts.regular;
        for (const word of seg.text.split(' ')) {
          const ws: TextSegment = { text: curLine.length ? ' ' + word : word, isBold: seg.isBold };
          const ww = f.widthOfTextAtSize(ws.text, size);
          if (curW + ww > maxW && curLine.length) { flush(); ws.text = word; }
          curLine.push(ws);
          curW += f.widthOfTextAtSize(ws.text, size);
        }
      }
      flush();
    };

    // Title
    drawWrapped(record.topic, { font: fonts.bold, size: 18, x: MARGINS.left, lineHeight: 22, color: COLORS.black });
    state.y -= 10;

    // Date
    ensureSpace(16);
    const dateStr = new Date(record.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    state.page.drawText(`Generated: ${dateStr}`, { x: MARGINS.left, y: state.y, font: fonts.oblique, size: 10, color: COLORS.mediumGray });
    state.y -= 30;

    // Summary
    ensureSpace(20);
    state.page.drawText('Summary:', { x: MARGINS.left, y: state.y, size: 14, font: fonts.bold, color: COLORS.black });
    state.y -= 20;
    drawWrapped(record.research_data.summary, { font: fonts.regular, size: 12, x: MARGINS.left + 20, lineHeight: 18 });
    state.y -= 20;

    const addSection = (title: string, items: string[]) => {
      if (!items?.length) return;
      ensureSpace(40);
      state.page.drawText(`${title}:`, { x: MARGINS.left, y: state.y, size: 14, font: fonts.bold, color: COLORS.black });
      state.y -= 25;
      for (const line of items) {
        drawRichWrapped(line, { size: 12, x: MARGINS.left + 20, lineHeight: 18 });
      }
      state.y -= 10;
    };

    addSection('Key Points', record.research_data.keyPoints);
    addSection('Trends', record.research_data.trends);
    addSection('Questions', record.research_data.questions);
    addSection('Content Angles', record.research_data.contentAngles);
    addSection('Sources', record.research_data.sources);

    const pdfBytes = await pdfDoc.save();
    const filename = `${record.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
    return { pdfBytes, filename };
  }

  private buildAutoResearchPrompt(channel: any, style: any, context?: string): string {
    return `As an expert YouTube research analyst, generate a unique, high-engagement research topic and comprehensive research data optimized for a YouTube video. The topic should align perfectly with the user's channel niche, style, content preferences, audience demographics, and current trends to maximize views, retention, and subscriber growth.

Creator's Profile:
- Channel Name: ${channel?.channel_name || 'Unknown'}
- Channel Description: ${channel?.channel_description || 'None'}
- Topic Details: ${JSON.stringify(channel?.topic_details) || 'None'}
- Default Language: ${channel?.default_language || 'English'}
- Style Profile:
  - Content Style: ${style?.style_analysis || 'None'}
  - Typical Tone: ${style?.tone || 'conversational'}
  - Vocabulary Level: ${style?.vocabulary_level || 'general'}
  - Pacing: ${style?.pacing || 'moderate'}
  - Themes: ${style?.themes || 'None'}
  - Humor Style: ${style?.humor_style || 'None'}
  - Narrative Structure: ${style?.structure || 'None'}
  - Recommendations: ${JSON.stringify(style?.recommendations) || '{}'}

${context ? `Additional Context: ${context}` : ''}

Ensure the research is actionable for YouTube creators. For sources, prioritize 3-5 recent, live valid active URL links from authoritative resources.

Return valid JSON with: topic, research { summary, keyPoints, trends, questions, contentAngles, sources }.`;
  }

  private buildManualResearchPrompt(topic: string, channel: any, style: any, context?: string, aiTrained?: boolean): string {
    return `As an expert YouTube research analyst, provide comprehensive research data for a YouTube video on "${topic}".

${aiTrained ? `
Creator's Profile:
- Channel Name: ${channel?.channel_name || 'Unknown'}
- Channel Description: ${channel?.channel_description || 'None'}
- Topic Details: ${JSON.stringify(channel?.topic_details) || 'None'}
- Default Language: ${channel?.default_language || 'English'}
- Style Profile:
  - Content Style: ${style?.style_analysis || 'None'}
  - Typical Tone: ${style?.tone || 'conversational'}
  - Vocabulary Level: ${style?.vocabulary_level || 'general'}
  - Pacing: ${style?.pacing || 'moderate'}
  - Themes: ${style?.themes || 'None'}
  - Humor Style: ${style?.humor_style || 'None'}
  - Narrative Structure: ${style?.structure || 'None'}
  - Recommendations: ${JSON.stringify(style?.recommendations) || '{}'}
` : ''}

${context ? `Additional Context: ${context}` : ''}

Ensure the research is actionable for YouTube creators. For sources, prioritize 3-5 recent, live valid active URL links from authoritative resources.

Return valid JSON with: topic ("${topic}"), research { summary, keyPoints, trends, questions, contentAngles, sources }.`;
  }
}
