"use client";

import { SubtitleUploader } from "@/components/dashboard/subtitles/subtitleUploader";
import { SubtitleHistory } from "@/components/dashboard/subtitles/subtitleHistory";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { SubtitleResponse } from "@repo/validation";
import { api } from "@/lib/api-client";

export default function SubtitlesPage() {
    const [subtitles, setSubtitles] = useState<SubtitleResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshSubtitles = useCallback(async () => {
        try {
            setError(null);
            setIsLoading(true);

            const data = await api.get<SubtitleResponse[]>("/api/v1/subtitle", {
                requireAuth: true,
            });


            setSubtitles(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error";
            setError(errorMessage);
            toast.error(`Error refreshing list: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshSubtitles();
    }, [refreshSubtitles]);

    const handleOptimisticDelete = async (id: string) => {
        // 1. Backup current state in case of error
        const previousSubtitles = [...subtitles];

        // 2. Optimistically update UI (Remove immediately)
        setSubtitles((prev) => prev.filter((item) => item.id !== id));

        // 3. Close UI interactions are already handled, now talk to server silently
        try {
            const res = await api.delete<{ success: boolean; message: string }>(
                `/api/v1/subtitle/${id}`,
                { requireAuth: true }
            );

            if (!res.success) throw new Error(res.message);

            // Success! No need to do anything, UI is already correct.
            toast.success("Subtitle deleted successfully");
        } catch (err) {
            // 4. If error, Rollback UI
            setSubtitles(previousSubtitles);
            toast.error("Failed to delete. Item restored.");
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
            <div className="container mx-auto max-w-5xl space-y-8 p-4 md:p-8">
                {/* Animated Header */}
                <motion.div
                    className="space-y-2 border-b border-gray-100 pb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-purple-900 bg-clip-text text-transparent">
                        Subtitle Generator
                    </h1>
                    <p className="text-sm text-gray-500">
                        Upload your videos and generate subtitles effortlessly
                    </p>
                </motion.div>

                {/* Animated Uploader */}
                <motion.div
                    className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow duration-200"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    whileHover={{ y: -2 }}
                >
                    <SubtitleUploader onUploadSuccess={refreshSubtitles} />
                </motion.div>

                {/* Animated History */}
                <motion.div
                    className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <SubtitleHistory
                        subtitles={subtitles}
                        isLoading={isLoading}
                        error={error}
                        onDelete={handleOptimisticDelete}
                    />
                </motion.div>
            </div>
        </div>
    );
}