import { getSupabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';

export interface ResearchContent {
    summary: string;
    keyPoints: string[];
    trends: string[];
    questions: string[];
    contentAngles: string[];
    sources: string[];
}

export interface ResearchData {
    ResearchContent: ResearchContent;
    topic: string;
    created_at: string;
    updated_at: string;
}

interface DrawState {
    currentPage: ReturnType<PDFDocument['addPage']>;
    y: number;
}

interface TextSegment {
    text: string;
    isBold: boolean;
}

const PAGE_DIMENSIONS = { width: 595.28, height: 841.89 }; // A4
const MARGINS = { top: 60, bottom: 60, left: 50, right: 50 };
const COLORS = {
    black: rgb(0, 0, 0),
    darkGray: rgb(0.2, 0.2, 0.2),
    mediumGray: rgb(0.3, 0.3, 0.3),
};

export async function generateResearchPdf(data: ResearchData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();

    const fonts = {
        regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
        bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        oblique: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    };

    pdfDoc.setTitle(data.topic);

    const state: DrawState = {
        currentPage: pdfDoc.addPage([PAGE_DIMENSIONS.width, PAGE_DIMENSIONS.height]),
        y: PAGE_DIMENSIONS.height - MARGINS.top,
    };

    // Utility: Add new page if needed
    const addPageIfNeeded = (requiredHeight: number) => {
        if (state.y - requiredHeight < MARGINS.bottom) {
            state.currentPage = pdfDoc.addPage([PAGE_DIMENSIONS.width, PAGE_DIMENSIONS.height]);
            state.y = PAGE_DIMENSIONS.height - MARGINS.top;
        }
    };

    // Parse markdown-style **bold** text into segments
    const parseRichText = (text: string): TextSegment[] => {
        const parts = text.split(/(\*\*.*?\*\*)/g).filter(part => part);
        return parts.map(part => ({
            text: part.startsWith('**') && part.endsWith('**') ? part.slice(2, -2) : part,
            isBold: part.startsWith('**') && part.endsWith('**'),
        }));
    };

    // Calculate width of a text segment
    const getSegmentWidth = (segment: TextSegment, size: number): number => {
        const font = segment.isBold ? fonts.bold : fonts.regular;
        return font.widthOfTextAtSize(segment.text, size);
    };

    // Draw rich text with proper wrapping
    const drawWrappedRichText = (
        text: string,
        options: {
            size: number;
            x: number;
            lineHeight: number;
            color?: ReturnType<typeof rgb>;
        }
    ) => {
        const { size, x, lineHeight, color = COLORS.darkGray } = options;
        const maxWidth = PAGE_DIMENSIONS.width - x - MARGINS.right;
        const segments = parseRichText(text);

        let currentLine: TextSegment[] = [];
        let currentLineWidth = 0;

        const drawLine = (line: TextSegment[]) => {
            if (line.length === 0) return;

            addPageIfNeeded(lineHeight);
            let currentX = x;

            line.forEach(segment => {
                const font = segment.isBold ? fonts.bold : fonts.regular;
                state.currentPage.drawText(segment.text, {
                    x: currentX,
                    y: state.y,
                    font,
                    size,
                    color,
                });
                currentX += getSegmentWidth(segment, size);
            });

            state.y -= lineHeight;
        };

        segments.forEach(segment => {
            // Split segment into words if needed
            const words = segment.text.split(' ');

            words.forEach((word, wordIndex) => {
                const isLastWord = wordIndex === words.length - 1;
                const wordWithSpace = isLastWord ? word : word + ' ';
                const wordSegment: TextSegment = { text: wordWithSpace, isBold: segment.isBold };
                const wordWidth = getSegmentWidth(wordSegment, size);

                if (currentLineWidth + wordWidth > maxWidth && currentLine.length > 0) {
                    drawLine(currentLine);
                    currentLine = [wordSegment];
                    currentLineWidth = wordWidth;
                } else {
                    currentLine.push(wordSegment);
                    currentLineWidth += wordWidth;
                }
            });
        });

        // Draw any remaining content
        if (currentLine.length > 0) {
            drawLine(currentLine);
        }
    };

    // Simple wrapped text for plain content (like summary)
    const drawWrappedText = (
        text: string,
        options: {
            font: PDFFont;
            size: number;
            x: number;
            lineHeight: number;
            color?: ReturnType<typeof rgb>;
        }
    ) => {
        const { font, size, x, lineHeight, color = COLORS.darkGray } = options;
        const maxWidth = PAGE_DIMENSIONS.width - x - MARGINS.right;
        const words = text.split(' ');
        let currentLine = '';

        const drawLine = (line: string) => {
            if (!line) return;
            addPageIfNeeded(lineHeight);
            state.currentPage.drawText(line, { x, y: state.y, font, size, color });
            state.y -= lineHeight;
        };

        words.forEach(word => {
            const testLine = currentLine === '' ? word : `${currentLine} ${word}`;
            const width = font.widthOfTextAtSize(testLine, size);

            if (width > maxWidth) {
                drawLine(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });

        if (currentLine) {
            drawLine(currentLine);
        }
    };

    // Title
    drawWrappedText(data.topic, {
        font: fonts.bold,
        size: 18,
        x: MARGINS.left,
        lineHeight: 22,
        color: COLORS.black,
    });
    state.y -= 10;

    // Date
    addPageIfNeeded(16);
    const creationDate = new Date(data.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    state.currentPage.drawText(`Generated: ${creationDate}`, {
        x: MARGINS.left,
        y: state.y,
        font: fonts.oblique,
        size: 10,
        color: COLORS.mediumGray,
    });
    state.y -= 30;

    // Summary Section
    addPageIfNeeded(20);
    state.currentPage.drawText('Summary:', {
        x: MARGINS.left,
        y: state.y,
        size: 14,
        font: fonts.bold,
        color: COLORS.black,
    });
    state.y -= 20;
    drawWrappedText(data.ResearchContent.summary, {
        font: fonts.regular,
        size: 12,
        x: MARGINS.left + 20,
        lineHeight: 18,
    });
    state.y -= 20;

    // Dynamic Sections with Rich Text Support
    const addSection = (title: string, content: string[]) => {
        if (!content || content.length === 0) return;

        addPageIfNeeded(40);
        state.currentPage.drawText(`${title}:`, {
            x: MARGINS.left,
            y: state.y,
            size: 14,
            font: fonts.bold,
            color: COLORS.black,
        });
        state.y -= 25;

        content.forEach(line => {
            drawWrappedRichText(line, {
                size: 12,
                x: MARGINS.left + 20,
                lineHeight: 18,
            });
        });

        state.y -= 10;
    };

    addSection('Key Points', data.ResearchContent.keyPoints);
    addSection('Trends', data.ResearchContent.trends);
    addSection('Questions', data.ResearchContent.questions);
    addSection('Content Angles', data.ResearchContent.contentAngles);
    addSection('Sources', data.ResearchContent.sources);

    return await pdfDoc.save();
}

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const supabase = await getSupabaseServer();
    const { id: scriptId } = await context.params;

    try {
        // Authenticate user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Fetch research data
        const { data: script, error } = await supabase
            .from('research_topics')
            .select('topic, research_data, created_at, updated_at')
            .eq('id', scriptId)
            .eq('user_id', user.id)
            .single();

        if (error || !script) {
            return new NextResponse('Research topic not found', { status: 404 });
        }

        // Generate PDF
        const pdfBytes = await generateResearchPdf({
            ResearchContent: script.research_data,
            topic: script.topic,
            created_at: script.created_at,
            updated_at: script.updated_at,
        });

        const safeFilename = script.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${safeFilename}.pdf"`,
            },
        });
    } catch (err) {
        console.error('Error generating research PDF:', err);
        return new NextResponse('Internal server error', { status: 500 });
    }
}