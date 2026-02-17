"use client";

import { SubtitleUploader } from "@/components/dashboard/subtitles/subtitleUploader";
import { SubtitleHistory } from "@/components/dashboard/subtitles/subtitleHistory";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { SubtitleResponse } from "@repo/validation";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Folder, Gem, Sparkles, ArrowUpRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function SubtitlesPage() {
    const [subtitles, setSubtitles] = useState<SubtitleResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lengthInMinutes, setLengthInMinutes] = useState(0);

    const refreshSubtitles = useCallback(async () => {
        try {
            setError(null);
            setIsLoading(true);
            const data = await api.get<SubtitleResponse[]>("/api/v1/subtitle", {
                requireAuth: true,
            });
            setSubtitles(data);
            const totalSecs = data.reduce((acc, curr) => acc + (parseFloat(curr.duration) || 0), 0);
            setLengthInMinutes(totalSecs / 60);
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
        const previousSubtitles = [...subtitles];
        setSubtitles((prev) => prev.filter((item) => item.id !== id));

        try {
            const res = await api.delete<{ success: boolean; message: string }>(
                `/api/v1/subtitle/${id}`,
                { requireAuth: true }
            );
            if (!res.success) throw new Error(res.message);
            toast.success("Project deleted");
        } catch (err) {
            setSubtitles(previousSubtitles);
            toast.error("Failed to delete. Item restored.");
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 lg:py-12">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">
                            Subtitle Generator
                        </h1>
                        <p className="text-lg text-slate-500 max-w-2xl">
                            Transform your videos with studio-quality AI subtitles in minutes.
                        </p>
                    </motion.div>
                </div>

                {/* Main Responsive Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Actions & History (8/12 units) */}
                    <div className="lg:col-span-8 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
                        >
                            <SubtitleUploader onUploadSuccess={refreshSubtitles} />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <SubtitleHistory
                                subtitles={subtitles}
                                isLoading={isLoading}
                                error={error}
                                onDelete={handleOptimisticDelete}
                            />
                        </motion.div>
                    </div>

                    {/* Right Column: Stats & CTAs (4/12 units) */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Credits / Usage Card */}
                        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                                    Usage Limits
                                    <Sparkles className="h-4 w-4 text-violet-500" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-600 font-medium">Minutes Used</span>
                                        <span className="font-bold text-slate-900">{Math.round(lengthInMinutes)} / 60 min</span>
                                    </div>
                                    <Progress value={(lengthInMinutes / 60) * 100} className="h-2 bg-slate-100" />
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                                            <Folder className="h-3 w-3" /> Projects
                                        </div>
                                        <div className="text-xl font-bold text-slate-900">{
                                            isLoading ? '...' : subtitles.length
                                        }</div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                                            <Clock className="h-3 w-3" /> Avg. Time
                                        </div>
                                        <div className="text-xl font-bold text-slate-900">{isLoading ? '...' : (Math.round((lengthInMinutes / 60) * 100) / subtitles.length).toFixed(2)} mins</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Premium Upgrade CTA */}
                        <div className="group relative bg-slate-900 rounded-3xl p-8 text-white overflow-hidden shadow-xl shadow-slate-200">
                            {/* Decorative Background Elements */}
                            <div className="absolute -top-12 -right-12 w-40 h-40 bg-violet-600/30 rounded-full blur-3xl group-hover:bg-violet-500/40 transition-colors duration-500"></div>
                            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl"></div>

                            <div className="relative z-10">
                                <div className="inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur-md mb-6">
                                    <Gem className="h-6 w-6 text-violet-300" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">Go Unlimited</h3>
                                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                    Unlock 4K exports, custom brand fonts, and priority AI processing.
                                </p>
                                <button className="w-full flex items-center justify-center gap-2 bg-white text-slate-900 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-all transform active:scale-[0.98]">
                                    Upgrade Now
                                    <ArrowUpRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}