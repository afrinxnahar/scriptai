import {
  Injectable,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SupabaseService } from '../supabase/supabase.service';
import { type CreateScriptInput, hasEnoughCredits, getMinimumCreditsForGemini } from '@repo/validation';
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

interface Token {
  type: string;
  tokens?: Token[];
  text?: string;
}
type Part = { text: string } | { fileData: { fileUri: string; mimeType: string } };
type FontSet = { regular: PDFFont; bold: PDFFont; italic: PDFFont };

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp',
];

@Injectable()
export class ScriptService {
  constructor(
    private readonly supabaseService: SupabaseService,
    @InjectQueue('script') private readonly queue: Queue,
  ) { }

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async createJob(
    userId: string,
    input: CreateScriptInput,
    files: Express.Multer.File[] = [],
  ) {
    const { prompt, context, tone, language, duration, includeStorytelling, includeTimestamps, references, personalized } = input;

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) throw new BadRequestException(`File ${file.originalname} exceeds 10MB limit`);
      if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) throw new BadRequestException(`File type ${file.mimetype} not supported`);
    }

    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .select('credits, ai_trained, youtube_connected')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) throw new NotFoundException('Profile not found');
    const minCredits = getMinimumCreditsForGemini();
    if (!hasEnoughCredits(profile.credits, minCredits)) {
      throw new ForbiddenException(`Insufficient credits. Need at least ${minCredits}, have ${profile.credits}.`);
    }

    const shouldPersonalize = personalized !== false && profile.ai_trained === true;
    const bullJobId = `script-${userId}-${Date.now()}`;

    const fileUrls: string[] = [];
    for (const file of files) {
      const filePath = `${userId}/scripts/${bullJobId}/${file.originalname}`;
      const { error } = await this.supabase
        .storage.from('scripts')
        .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: true });
      if (!error) {
        const { data: { publicUrl } } = this.supabase.storage.from('scripts').getPublicUrl(filePath);
        fileUrls.push(publicUrl);
      }
    }

    const { data: job, error: jobError } = await this.supabase
      .from('scripts')
      .insert({
        user_id: userId,
        title: 'Generating...',
        content: '',
        prompt,
        context: context || null,
        tone,
        language,
        duration,
        include_storytelling: includeStorytelling,
        include_timestamps: includeTimestamps,
        reference_links: references || null,
        status: 'queued',
        job_id: bullJobId,
        credits_consumed: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (jobError || !job) throw new InternalServerErrorException('Failed to create script job');

    await this.queue.add(
      'generate-script',
      {
        userId,
        scriptJobId: job.id,
        prompt,
        context: context || '',
        tone,
        language,
        duration,
        includeStorytelling,
        includeTimestamps,
        references: references || '',
        personalized: shouldPersonalize,
        fileUrls,
      },
      {
        jobId: bullJobId,
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );

    return {
      id: job.id,
      jobId: bullJobId,
      status: 'queued',
      message: shouldPersonalize
        ? 'Script generation queued (personalized to your style)'
        : 'Script generation queued',
    };
  }

  async list(userId: string) {
    const { data, error } = await this.supabase
      .from('scripts')
      .select('id, title, content, status, credits_consumed, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

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

  private async embedLogo(pdfDoc: PDFDocument) {
    const candidates = [
      path.resolve(process.cwd(), 'apps/web/public/dark-logo.png'),
      path.resolve(__dirname, '../../../../apps/web/public/dark-logo.png'),
    ];
    for (const p of candidates) {
      try {
        if (fs.existsSync(p)) return pdfDoc.embedPng(fs.readFileSync(p));
      } catch { /* skip */ }
    }
    return null;
  }

  private drawPageFooter(
    page: PDFPage,
    fonts: FontSet,
    pageNum: number,
    totalPages: number,
    width: number,
    margins: { bottom: number; left: number; right: number },
  ) {
    const footerY = margins.bottom - 30;
    const brand = 'Generated by Creator AI';
    const pageText = `Page ${pageNum} of ${totalPages}`;
    page.drawText(brand, { x: margins.left, y: footerY, font: fonts.italic, size: 8, color: rgb(0.55, 0.55, 0.55) });
    const pageTextWidth = fonts.regular.widthOfTextAtSize(pageText, 8);
    page.drawText(pageText, { x: width - margins.right - pageTextWidth, y: footerY, font: fonts.regular, size: 8, color: rgb(0.55, 0.55, 0.55) });
    page.drawLine({
      start: { x: margins.left, y: footerY + 12 },
      end: { x: width - margins.right, y: footerY + 12 },
      thickness: 0.4, color: rgb(0.85, 0.85, 0.85),
    });
  }

  async exportPdf(id: string, userId: string): Promise<{ pdfBytes: Uint8Array; filename: string }> {
    const script = await this.getOne(id, userId);
    const pdfDoc = await PDFDocument.create();
    const fonts: FontSet = {
      regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
      bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
      italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    };
    const logo = await this.embedLogo(pdfDoc);
    const purple = rgb(0.49, 0.27, 0.83);

    pdfDoc.setTitle(script.title);
    pdfDoc.setCreator('Creator AI');
    const margins = { top: 70, bottom: 70, left: 60, right: 60 };
    const pages: PDFPage[] = [];
    let page = pdfDoc.addPage([595.28, 841.89]);
    pages.push(page);
    const { width, height } = page.getSize();
    const contentWidth = width - margins.left - margins.right;
    let currentY = height - margins.top;

    // --- Brand header ---
    const logoSize = 28;
    if (logo) {
      const dims = logo.scaleToFit(logoSize, logoSize);
      page.drawImage(logo, { x: margins.left, y: currentY - dims.height + 6, width: dims.width, height: dims.height });
    }
    const brandX = logo ? margins.left + logoSize + 10 : margins.left;
    page.drawText('Creator AI', { x: brandX, y: currentY - 6, font: fonts.bold, size: 16, color: purple });

    const dateStr = new Date(script.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const dateWidth = fonts.regular.widthOfTextAtSize(dateStr, 9);
    page.drawText(dateStr, { x: width - margins.right - dateWidth, y: currentY - 4, font: fonts.regular, size: 9, color: rgb(0.55, 0.55, 0.55) });
    currentY -= 35;

    page.drawLine({
      start: { x: margins.left, y: currentY },
      end: { x: width - margins.right, y: currentY },
      thickness: 1.5, color: purple,
    });
    currentY -= 30;

    // --- Title ---
    page.drawText(script.title, {
      x: margins.left, y: currentY, font: fonts.bold, size: 22,
      maxWidth: contentWidth, lineHeight: 28, color: rgb(0.1, 0.1, 0.1),
    });
    const titleLines = Math.ceil(fonts.bold.widthOfTextAtSize(script.title, 22) / contentWidth);
    currentY -= titleLines * 28 + 10;

    // --- Metadata chips ---
    const chips = [
      script.language,
      script.tone ? `Tone: ${script.tone}` : null,
      script.duration ? `Duration: ${script.duration}` : null,
    ].filter(Boolean) as string[];
    if (chips.length) {
      let chipX = margins.left;
      for (const chip of chips) {
        const chipW = fonts.regular.widthOfTextAtSize(chip, 9) + 16;
        page.drawRectangle({ x: chipX, y: currentY - 4, width: chipW, height: 18, color: rgb(0.95, 0.93, 0.99) });
        page.drawText(chip, { x: chipX + 8, y: currentY, font: fonts.regular, size: 9, color: rgb(0.35, 0.2, 0.6) });
        chipX += chipW + 8;
      }
      currentY -= 32;
    }

    page.drawLine({
      start: { x: margins.left, y: currentY },
      end: { x: width - margins.right, y: currentY },
      thickness: 0.4, color: rgb(0.88, 0.88, 0.88),
    });
    currentY -= 20;

    // --- Body content ---
    const { marked } = await import('marked');
    const tokens = marked.lexer(script.content || '');
    for (const token of tokens) {
      if (currentY < margins.bottom) {
        page = pdfDoc.addPage();
        pages.push(page);
        currentY = height - margins.top;
      }

      switch (token.type) {
        case 'heading': {
          currentY -= 6;
          const depth = (token as any).depth ?? 1;
          const headingSize = Math.max(12, 20 - depth * 2);
          page.drawLine({
            start: { x: margins.left, y: currentY + headingSize + 2 },
            end: { x: margins.left + 3, y: currentY + 2 },
            thickness: 3, color: purple,
          });
          const res = this.drawMarkdownTokens(token.tokens || [], {
            doc: pdfDoc, page, fonts, x: margins.left + 8, y: currentY,
            maxWidth: contentWidth - 8, lineHeight: headingSize + 4,
            baseSize: headingSize, margins,
          });
          page = res.page; currentY = res.y - 8;
          break;
        }
        case 'paragraph': {
          const res = this.drawMarkdownTokens(token.tokens || [], {
            doc: pdfDoc, page, fonts, x: margins.left, y: currentY,
            maxWidth: contentWidth, lineHeight: 18, baseSize: 11, margins,
          });
          page = res.page; currentY = res.y - 6;
          break;
        }
        case 'blockquote': {
          page.drawRectangle({
            x: margins.left, y: currentY - 60, width: 3, height: 60, color: purple,
          });
          const res = this.drawMarkdownTokens(token.tokens || [], {
            doc: pdfDoc, page, fonts, x: margins.left + 14, y: currentY,
            maxWidth: contentWidth - 14, lineHeight: 17, baseSize: 11, margins,
          });
          page = res.page; currentY = res.y - 10;
          break;
        }
        case 'list':
          for (const item of (token as any).items) {
            if (currentY < margins.bottom) {
              page = pdfDoc.addPage();
              pages.push(page);
              currentY = height - margins.top;
            }
            page.drawCircle({ x: margins.left + 10, y: currentY + 3, size: 2.5, color: purple });
            const res = this.drawMarkdownTokens(item.tokens || [], {
              doc: pdfDoc, page, fonts, x: margins.left + 20, y: currentY,
              maxWidth: contentWidth - 20, lineHeight: 17, baseSize: 11, margins,
            });
            page = res.page; currentY = res.y;
          }
          currentY -= 8;
          break;
        case 'space':
          currentY -= 10;
          break;
      }
    }

    // --- Page footers ---
    const totalPages = pages.length;
    pages.forEach((p, i) => this.drawPageFooter(p, fonts, i + 1, totalPages, width, margins));

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
