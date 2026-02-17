import { useState } from 'react';
import { toast } from 'sonner';
import { useSupabase } from "@/components/supabase-provider";
import { api } from '@/lib/api-client';
export function useSubtitleGeneration(
    id: string,
    videoDuration: number | null,
    refetchData: () => Promise<void>
) {
    const [isGenerating, setIsGenerating] = useState(false);
    const { user, fetchUserProfile } = useSupabase();

    const handleGenerate = async (language: string, targetLanguage: string) => {
        setIsGenerating(true);
        try {
            const res = await api.post<{ success: boolean, message: string }>(
                '/api/v1/subtitle',
                {
                    duration: videoDuration,
                    language: language,
                    targetLanguage: targetLanguage,
                    subtitleId: id,
                },
                {
                    requireAuth: true,
                }
            );

            if (!res.success) {
                throw new Error(res.message || 'Subtitle generation failed to start.');
            }
            toast.success('Subtitle generation started! Refreshing data...');
            await refetchData();
            await fetchUserProfile(user?.id as string)

        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setIsGenerating(false);
        }
    };

    return {
        isGenerating,
        handleGenerate,
    };
}