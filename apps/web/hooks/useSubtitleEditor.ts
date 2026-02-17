import { useState } from 'react';
import { toast } from 'sonner';
import { SubtitleLine } from "@repo/validation";
import { timeToSeconds, secondsToTime } from '@/utils/timeUtils';

export function useSubtitleEditor(
    subtitles: SubtitleLine[],
    setSubtitles: (subtitles: SubtitleLine[]) => void,
    currentTime: number
) {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const updateSubtitle: (idx: number, field: keyof SubtitleLine, val: string) => void = (idx, field, val) => {
        const updated = [...subtitles];
        updated[idx] = { ...updated[idx] as SubtitleLine, [field]: val };
        setSubtitles(updated);
    };

    const handleAddLine = () => {
        const newSub: SubtitleLine = {
            start: secondsToTime(currentTime),
            end: secondsToTime(currentTime + 2),
            text: 'New subtitle'
        };
        const newSubtitles = [...subtitles, newSub].sort((a, b) =>
            timeToSeconds(a.start) - timeToSeconds(b.start)
        );
        setSubtitles(newSubtitles);
        setEditingIndex(newSubtitles.findIndex(sub => sub === newSub));
    };

    const handleDeleteLine = (idx: number) => {
        setSubtitles(subtitles.filter((_, i) => i !== idx));
        toast.success('Subtitle deleted');
    };

    return {
        editingIndex,
        setEditingIndex,
        updateSubtitle,
        handleAddLine,
        handleDeleteLine,
    };
}