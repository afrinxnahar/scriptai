import { useState } from 'react';
import { toast } from 'sonner';
import { SubtitleLine } from "@repo/validation";
import { parseSRT } from '@/utils/srtUtils';
import { api } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';

export function useSubtitleFileOperations(
    id: string,
    subtitles: SubtitleLine[],
    setSubtitles: (subtitles: SubtitleLine[]) => void,
    videoPath?: string,
    videoUrl?: string
) {
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!id) return;
        setIsSaving(true);
        console.log(subtitles);
        try {
            const res = await api.patch<{ success: boolean, message: string, subtitles: SubtitleLine[] }>(`/api/v1/subtitle/${id}`, {
                subtitle_json: subtitles,
            }, {
                requireAuth: true,
            });
            if (!res.success) throw new Error(res.message || 'Save failed');
            setSubtitles(res.subtitles);
            toast.success('Saved successfully!');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownload = () => {
        const srt = subtitles.map((s, i) =>
            `${i + 1}\n${s.start.replace('.', ',')} --> ${s.end.replace('.', ',')}\n${s.text}\n`
        ).join('\n');

        const blob = new Blob([srt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const filename = (videoPath || 'subtitles.srt').split('/').pop()?.split('.').shift();
        a.href = url;
        a.download = `${filename}.srt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                try {
                    const parsed = parseSRT(content);
                    if (parsed.length === 0) {
                        throw new Error("Could not find any valid subtitle blocks.");
                    }
                    setSubtitles(parsed);
                    toast.success(`Uploaded and parsed ${parsed.length} subtitle lines.`);
                } catch (err) {
                    const message = err instanceof Error ? err.message : "Unknown parsing error";
                    toast.error(`Failed to parse SRT file: ${message}`);
                }
            } else {
                toast.error("File is empty or could not be read.");
            }
        };
        reader.onerror = () => toast.error("An error occurred while reading the file.");
        reader.readAsText(file);
        e.target.value = '';
    };

    const [downloadVideoLoading, setDownloadVideoLoading] = useState(false);

    const handleDownloadVideo = async () => {
        if (!videoUrl || !subtitles || subtitles.length === 0) {
            toast.error('Video URL and subtitles are required');
            return;
        }

        setDownloadVideoLoading(true);
        try {
            // Get auth token
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                throw new Error('Authentication required');
            }

            const blob = await api.post<Blob>(
                '/api/v1/subtitle/burn',
                {
                    videoUrl,
                    subtitles
                },
                {
                    requireAuth: true,
                    responseType: 'blob'
                }
            );

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "video_with_subs.mp4";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success('Video downloaded successfully!');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setDownloadVideoLoading(false);
        }
    };

    return {
        isSaving,
        handleSave,
        handleDownload,
        handleFileUpload,
        handleDownloadVideo,
        downloadVideoLoading,
    };
}