import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';
import { marked, Tokens } from 'marked';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

type Token = Tokens.Generic;
type Part = { text: string } | { fileData: { fileUri: string; mimeType: string } };
type FontSet = { regular: PDFFont; bold: PDFFont; italic: PDFFont };

const SCRIPT_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Suggested script title' },
    script: { type: 'string', description: 'Full script as a string' },
  },
  required: ['title', 'script'],
} as const;

export interface GenerateScriptParams {
  prompt: string;
  context?: string;
  tone?: string;
  includeStorytelling: boolean;
  includeTimestamps: boolean;
  duration: string;
  references?: string;
  language: string;
  personalized: boolean;
}

@Injectable()
export class ScriptService {
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
      .from('scripts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw new InternalServerErrorException('Error fetching scripts');
    return data;
  }

  async getOne(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from('scripts')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Script not found');
    return data;
  }

  async update(id: string, userId: string, title: string, content: string) {
    if (!title || !content) throw new BadRequestException('Title and content are required');

    const { data, error } = await this.supabase
      .from('scripts')
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) throw new NotFoundException('Script not found or update failed');
    return data;
  }

  async remove(id: string, userId: string) {
    const { error } = await this.supabase
      .from('scripts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new NotFoundException('Script not found or deletion failed');
    return { message: 'Script deleted successfully' };
  }

  async generate(
    userId: string,
    params: GenerateScriptParams,
    files: Express.Multer.File[],
  ) {
    if (!params.prompt) throw new BadRequestException('Prompt is required');

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

    if (params.personalized && profileData.ai_trained) {
      const { data: channel } = await this.supabase
        .from('youtube_channels')
        .select('channel_name, channel_description, topic_details, default_language')
        .eq('user_id', userId)
        .single();
      channelData = channel;

      const { data: style } = await this.supabase
        .from('user_style')
        .select('tone, vocabulary_level, pacing, themes, humor_style, structure, style_analysis, recommendations')
        .eq('user_id', userId)
        .single();
      styleData = style;
    }

    const ai = await this.getGoogleAI();

    const geminiPrompt = `
Generate a unique YouTube video script based on the following details:
- Prompt: ${params.prompt}
- Context: ${params.context || 'None'}
- Desired Tone: ${params.tone || styleData?.tone || 'conversational'}
- Language: ${params.language || channelData?.default_language || 'English'}
- Include Storytelling: ${params.includeStorytelling}
- Include Timestamps: ${params.includeTimestamps}
- Duration: ${params.duration}
- References: ${params.references || 'None'}

${params.personalized && styleData ? `
Creator's Style Profile:
- Channel Name: ${channelData?.channel_name || 'Unknown'}
- Channel Description: ${channelData?.channel_description || 'None'}
- Content Style: ${styleData.style_analysis}
- Typical Tone: ${styleData.tone}
- Vocabulary Level: ${styleData.vocabulary_level}
- Pacing: ${styleData.pacing}
- Themes: ${styleData.themes}
- Humor Style: ${styleData.humor_style}
- Narrative Structure: ${styleData.structure}
- Recommendations: ${JSON.stringify(styleData.recommendations)}
` : ''}

Generate a compelling, engaging title and a complete script. Use Creator's style profile for more personalizzed experience.
`;

    const uploadedFiles: any[] = [];
    for (const file of files) {
      const tempFilePath = path.join(os.tmpdir(), file.originalname);
      await fs.writeFile(tempFilePath, file.buffer);
      const uploaded = await ai.files.upload({
        file: tempFilePath,
        config: { mimeType: file.mimetype },
      });
      uploadedFiles.push(uploaded);
    }

    const parts: Part[] = [{ text: geminiPrompt }];
    for (const uploaded of uploadedFiles) {
      parts.push({ text: `Consider this file as a reference: ${uploaded.name ?? ''}` });
      parts.push({ fileData: { fileUri: uploaded.uri, mimeType: uploaded.mimeType } });
    }

    let result: any;
    try {
      result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts }],
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: SCRIPT_RESPONSE_SCHEMA,
        },
      });
    } catch {
      throw new InternalServerErrorException('Failed to generate script from Gemini API');
    }

    const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text ?? result?.text;
    if (!rawText) throw new InternalServerErrorException('AI returned an empty response');

    let response: { title: string; script: string };
    try {
      response = JSON.parse(rawText);
    } catch {
      throw new InternalServerErrorException('Failed to parse Gemini response');
    }

    const { error: updateError } = await this.supabase
      .from('profiles')
      .update({ credits: profileData.credits - 1 })
      .eq('user_id', userId);
    if (updateError) throw new InternalServerErrorException('Failed to update credits');

    const { data: saved, error: insertError } = await this.supabase
      .from('scripts')
      .insert({
        user_id: userId,
        title: response.title,
        content: response.script,
        prompt: params.prompt,
        context: params.context,
        tone: params.tone,
        include_storytelling: params.includeStorytelling,
        include_timestamps: params.includeTimestamps,
        duration: params.duration,
        reference_links: params.references,
        language: params.language,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) throw new InternalServerErrorException('Failed to save script');
    return { id: saved.id, title: response.title, script: response.script };
  }

  async exportPdf(id: string, userId: string): Promise<{ pdfBytes: Uint8Array; filename: string }> {
    const script = await this.getOne(id, userId);
    const pdfDoc = await PDFDocument.create();
    const fonts: FontSet = {
      regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
      bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
      italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    };

    pdfDoc.setTitle(script.title);
    const margins = { top: 70, bottom: 70, left: 70, right: 70 };
    let page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    const contentWidth = width - margins.left - margins.right;
    let currentY = height - margins.top;

    page.drawText(script.title, {
      x: margins.left, y: currentY, font: fonts.bold, size: 24,
      maxWidth: contentWidth, lineHeight: 30,
    });
    currentY -= 50;

    const updatedDate = new Date(script.updated_at).toLocaleDateString();
    const metadata = `Updated: ${updatedDate} | Language: ${script.language} | Tone: ${script.tone || 'N/A'}`;
    page.drawText(metadata, {
      x: margins.left, y: currentY, font: fonts.regular, size: 10,
      maxWidth: contentWidth, lineHeight: 14,
    });
    currentY -= 20;

    page.drawLine({
      start: { x: margins.left, y: currentY },
      end: { x: width - margins.right, y: currentY },
      thickness: 0.5, color: rgb(0.8, 0.8, 0.8),
    });
    currentY -= 25;

    const tokens = marked.lexer(script.content);
    for (const token of tokens) {
      if (currentY < margins.bottom) {
        page = pdfDoc.addPage();
        currentY = height - margins.top;
      }

      switch (token.type) {
        case 'heading': {
          const res = this.drawMarkdownTokens(token.tokens || [], {
            doc: pdfDoc, page, fonts, x: margins.left, y: currentY,
            maxWidth: contentWidth, lineHeight: 20,
            baseSize: 20 - (token as any).depth * 2, margins,
          });
          page = res.page; currentY = res.y - 10;
          break;
        }
        case 'paragraph': {
          const res = this.drawMarkdownTokens(token.tokens || [], {
            doc: pdfDoc, page, fonts, x: margins.left, y: currentY,
            maxWidth: contentWidth, lineHeight: 18, baseSize: 12, margins,
          });
          page = res.page; currentY = res.y - 5;
          break;
        }
        case 'blockquote': {
          const res = this.drawMarkdownTokens(token.tokens || [], {
            doc: pdfDoc, page, fonts, x: margins.left + 20, y: currentY,
            maxWidth: contentWidth - 20, lineHeight: 16, baseSize: 12, margins,
          });
          page = res.page; currentY = res.y - 10;
          break;
        }
        case 'list':
          for (const item of (token as any).items) {
            if (currentY < margins.bottom) {
              page = pdfDoc.addPage();
              currentY = height - margins.top;
            }
            page.drawText('•', { x: margins.left + 10, y: currentY, font: fonts.regular, size: 12 });
            const res = this.drawMarkdownTokens(item.tokens || [], {
              doc: pdfDoc, page, fonts, x: margins.left + 25, y: currentY,
              maxWidth: contentWidth - 25, lineHeight: 16, baseSize: 12, margins,
            });
            page = res.page; currentY = res.y;
          }
          currentY -= 10;
          break;
        case 'space':
          currentY -= 12;
          break;
      }
    }

    const pdfBytes = await pdfDoc.save();
    return { pdfBytes, filename: `${script.title.replace(/[^a-z0-9]/gi, '_')}.pdf` };
  }

  private drawMarkdownTokens(
    tokens: Token[],
    options: {
      doc: PDFDocument; page: PDFPage; fonts: FontSet;
      x: number; y: number; maxWidth: number; lineHeight: number;
      baseSize: number; margins: { top: number; bottom: number };
    },
  ): { page: PDFPage; y: number } {
    let { doc, page, fonts, x, y, maxWidth, lineHeight, baseSize, margins } = options;
    let currentLine: { text: string; font: PDFFont }[] = [];
    let currentLineWidth = 0;

    const flushLine = () => {
      if (currentLine.length > 0) {
        let cx = x;
        for (const seg of currentLine) {
          page.drawText(seg.text, { x: cx, y, font: seg.font, size: baseSize });
          cx += seg.font.widthOfTextAtSize(seg.text, baseSize);
        }
        y -= lineHeight;
        currentLine = [];
        currentLineWidth = 0;
        if (y < margins.bottom) {
          page = doc.addPage();
          y = page.getSize().height - margins.top;
        }
      }
    };

    const processTokens = (innerTokens: Token[], activeFont: PDFFont = fonts.regular) => {
      for (const token of innerTokens) {
        switch (token.type) {
          case 'paragraph':
            processTokens(token.tokens || [], activeFont);
            flushLine();
            break;
          case 'strong':
            processTokens(token.tokens || [], fonts.bold);
            break;
          case 'em':
            processTokens(token.tokens || [], fonts.italic);
            break;
          case 'link':
            processTokens(token.tokens || [], activeFont);
            break;
          case 'list':
            (token as any).items.forEach((item: any, i: number) => {
              const bullet = (token as any).ordered ? `${i + 1}. ` : '• ';
              currentLine.push({ text: bullet, font: fonts.bold });
              currentLineWidth += fonts.bold.widthOfTextAtSize(bullet, baseSize);
              processTokens(item.tokens || [], activeFont);
              flushLine();
            });
            break;
          case 'list_item':
            processTokens(token.tokens || [], activeFont);
            flushLine();
            break;
          case 'text':
          case 'codespan': {
            if (token.tokens && token.tokens.length > 0) {
              processTokens(token.tokens, activeFont);
            } else {
              const words = token.text.split(/(\s+)/);
              for (const word of words) {
                if (!word) continue;
                const wordWidth = activeFont.widthOfTextAtSize(word, baseSize);
                if (currentLineWidth + wordWidth > maxWidth) flushLine();
                const lastSeg = currentLine[currentLine.length - 1];
                if (lastSeg && lastSeg.font === activeFont) {
                  lastSeg.text += word;
                } else {
                  currentLine.push({ text: word, font: activeFont });
                }
                currentLineWidth += wordWidth;
              }
            }
            break;
          }
        }
      }
    };

    processTokens(tokens);
    flushLine();
    return { page, y };
  }
}
