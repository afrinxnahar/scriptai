import { getSupabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';
import { marked, Tokens } from 'marked';
type Token = Tokens.Generic;
interface ScriptRecord {
  id: string;
  user_id: string;
  title: string;
  content: string;
  prompt: string | null;
  context: string | null;
  tone: string | null;
  include_storytelling: boolean;
  reference_links: string | null;
  language: string;
  created_at: string;
  updated_at: string;
}

type FontSet = { regular: PDFFont; bold: PDFFont; italic: PDFFont };

function drawLineWithMixedStyles(
  page: PDFPage,
  line: { text: string; font: PDFFont }[],
  x: number,
  y: number,
  size: number
) {
  let currentX = x;
  for (const segment of line) {
    page.drawText(segment.text, {
      x: currentX,
      y,
      font: segment.font,
      size,
    });
    currentX += segment.font.widthOfTextAtSize(segment.text, size);
  }
}

function drawMarkdownTokens(
  tokens: Token[],
  options: {
    doc: PDFDocument;
    page: PDFPage;
    fonts: FontSet;
    x: number;
    y: number;
    maxWidth: number;
    lineHeight: number;
    baseSize: number;
    margins: { top: number; bottom: number };
  }
): { page: PDFPage; y: number } {
  let { doc, page, fonts, x, y, maxWidth, lineHeight, baseSize, margins } = options;

  let currentLine: { text: string; font: PDFFont }[] = [];
  let currentLineWidth = 0;
  let currentFont = fonts.regular;

  const flushLine = () => {
    if (currentLine.length > 0) {
      drawLineWithMixedStyles(page, currentLine, x, y, baseSize);
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
          token.items.forEach((item: any, i: number) => {
            const bullet = token.ordered ? `${i + 1}. ` : '• ';
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
        case 'codespan':
          if (token.tokens && token.tokens.length > 0) {
            processTokens(token.tokens, activeFont);
          } else {
            const words = token.text.split(/(\s+)/);
            for (const word of words) {
              if (!word) continue;

              const wordWidth = activeFont.widthOfTextAtSize(word, baseSize);
              if (currentLineWidth + wordWidth > maxWidth) {
                flushLine();
              }

              const lastSegment = currentLine[currentLine.length - 1];
              if (lastSegment && lastSegment.font === activeFont) {
                lastSegment.text += word;
              } else {
                currentLine.push({ text: word, font: activeFont });
              }
              currentLineWidth += wordWidth;
            }
          }
          break;
      }
    }
  };


  processTokens(tokens);
  flushLine();

  return { page, y };
}

export const createScriptPdf = async (script: ScriptRecord): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const fonts: FontSet = { regular: helvetica, bold: helveticaBold, italic: helveticaOblique };

  pdfDoc.setTitle(script.title);

  const margins = { top: 70, bottom: 70, left: 70, right: 70 };
  let page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const contentWidth = width - margins.left - margins.right;
  let currentY = height - margins.top;

  //Title
  page.drawText(script.title, {
    x: margins.left, y: currentY,
    font: fonts.bold, size: 24,
    maxWidth: contentWidth, lineHeight: 30,
  });
  currentY -= 50;

  //  Metadata
  const updatedDate = new Date(script.updated_at).toLocaleDateString();
  const metadata = `Updated: ${updatedDate} | Language: ${script.language} | Tone: ${script.tone || 'N/A'}`;
  page.drawText(metadata, {
    x: margins.left, y: currentY,
    font: fonts.regular, size: 10,
    maxWidth: contentWidth, lineHeight: 14,
  });
  currentY -= 20;

  // Separator
  page.drawLine({
    start: { x: margins.left, y: currentY },
    end: { x: width - margins.right, y: currentY },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  currentY -= 25;

  // Markdown Content
  const tokens = marked.lexer(script.content);

  for (const token of tokens) {
    if (currentY < margins.bottom) {
      page = pdfDoc.addPage();
      currentY = height - margins.top;
    }

    switch (token.type) {
      case 'heading':
        const headRes = drawMarkdownTokens(token.tokens || [], {
          doc: pdfDoc, page, fonts,
          x: margins.left, y: currentY,
          maxWidth: contentWidth, lineHeight: 20,
          baseSize: 20 - token.depth * 2, margins,
        });
        page = headRes.page;
        currentY = headRes.y - 10;
        break;

      case 'paragraph':
        const paraRes = drawMarkdownTokens(token.tokens || [], {
          doc: pdfDoc, page, fonts,
          x: margins.left, y: currentY,
          maxWidth: contentWidth, lineHeight: 18,
          baseSize: 12, margins,
        });
        page = paraRes.page;
        currentY = paraRes.y - 5;
        break;

      case 'blockquote':
        const quoteRes = drawMarkdownTokens(token.tokens || [], {
          doc: pdfDoc, page, fonts,
          x: margins.left + 20, y: currentY,
          maxWidth: contentWidth - 20, lineHeight: 16,
          baseSize: 12, margins,
        });
        page = quoteRes.page;
        currentY = quoteRes.y - 10;
        break;

      case 'list':
        for (const item of token.items) {
          if (currentY < margins.bottom) {
            page = pdfDoc.addPage();
            currentY = height - margins.top;
          }
          page.drawText('•', {
            x: margins.left + 10,
            y: currentY,
            font: fonts.regular,
            size: 12,
          });

          const itemRes = drawMarkdownTokens(item.tokens || [], {
            doc: pdfDoc, page, fonts,
            x: margins.left + 25, y: currentY,
            maxWidth: contentWidth - 25, lineHeight: 16,
            baseSize: 12, margins,
          });
          page = itemRes.page;
          currentY = itemRes.y;
        }
        currentY -= 10;
        break;

      case 'space':
        currentY -= 12;
        break;
    }
  }

  return await pdfDoc.save();
};


export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServer();
  const scriptId = (await context.params).id;

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { data: script, error } = await supabase
      .from('scripts')
      .select('*')
      .eq('id', scriptId)
      .eq('user_id', user.id)
      .single();

    if (error || !script) {
      return new NextResponse('Script not found', { status: 404 });
    }

    const pdfBytes = await createScriptPdf(script);

    return new Response(pdfBytes as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${script.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`,
      },
    });
  } catch (err) {
    console.error('Error generating script PDF:', err);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
