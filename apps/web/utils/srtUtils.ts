
import { SubtitleLine } from "@repo/validation";

export const parseSRT = (srtContent: string): SubtitleLine[] => {
    const subtitles: SubtitleLine[] = [];
    const blocks = srtContent.trim().split(/\n\s*\n/);

    for (const block of blocks) {
        const lines = block.split('\n');
        if (lines.length < 3) continue;

        const timestampLine = lines[1];
        const textLines = lines.slice(2);

        const [start, end] = timestampLine ? timestampLine.split(' --> ') : [];

        if (start && end && textLines.length > 0) {
            subtitles.push({
                start: start.replace(',', '.'),
                end: end.replace(',', '.'),
                text: textLines.join('\n'),
            });
        }
    }
    return subtitles;
};