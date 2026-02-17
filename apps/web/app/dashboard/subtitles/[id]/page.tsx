"use client";

import React, { useRef, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Loader2, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { SubtitleHeader } from '@/components/dashboard/subtitles/SubtitleHeader';
import { VideoPlayer } from '@/components/dashboard/subtitles/VideoPlayer';
import { SubtitleEditorPanel } from '@/components/dashboard/subtitles/SubtitleEditorPanel';

import { useSubtitleData } from '@/hooks/useSubtitleData';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import { useSubtitleEditor } from '@/hooks/useSubtitleEditor';
import { useSubtitleFileOperations } from '@/hooks/useSubtitleFileOperations';
import { useSubtitleGeneration } from '@/hooks/useSubtitleGeneration';
import { convertJsonToVTT } from "@/utils/vttHelper";
import { useDebounce } from "@/hooks/useDebounce";
import { SubtitleEditorSkeleton } from "@/components/dashboard/subtitles/skeleton/SubtitleEditorSkeleton";

const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
    }
};

const gridVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3 }
    }
};



export default function SubtitleEditorPage() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const { id } = useParams();

    const { subtitleData, subtitles, setSubtitles, isLoading, error, refetch } = useSubtitleData(id as string);
    const { currentTime, videoDuration, currentSubtitle, seekTo } = useVideoPlayer(
        videoRef,
        subtitleData?.video_url,
        subtitles
    );
    const { editingIndex, setEditingIndex, updateSubtitle, handleAddLine, handleDeleteLine } = useSubtitleEditor(
        subtitles,
        setSubtitles,
        currentTime
    );
    const { isSaving, handleSave, handleDownload, handleFileUpload, handleDownloadVideo, downloadVideoLoading } = useSubtitleFileOperations(
        id as string,
        subtitles,
        setSubtitles,
        subtitleData?.video_path,
        subtitleData?.video_url
    );
    const { isGenerating, handleGenerate } = useSubtitleGeneration(id as string, videoDuration, refetch);
    const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null);
    const debouncedSubtitles = useDebounce(subtitles, 500);

    useEffect(() => {
        if (!debouncedSubtitles || debouncedSubtitles.length === 0) {
            if (subtitleUrl) {
                URL.revokeObjectURL(subtitleUrl);
                setSubtitleUrl(null);
            }
            return;
        }

        const vttContent = convertJsonToVTT(debouncedSubtitles);
        const blob = new Blob([vttContent], { type: 'text/vtt' });
        const newSubtitleUrl = URL.createObjectURL(blob);
        setSubtitleUrl(newSubtitleUrl);

        return () => {
            URL.revokeObjectURL(newSubtitleUrl);
        };
    }, [debouncedSubtitles]);

    if (isLoading) {
        return (
            <SubtitleEditorSkeleton />
        );
    }

    if (error) {
        return (
            <div className="container mx-auto max-w-3xl p-4 md:p-8 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <Card className="p-8 border-red-100 shadow-lg">
                        <X className="w-16 h-16 mx-auto text-red-500" />
                        <h2 className="mt-4 text-2xl font-semibold">Error Loading Job</h2>
                        <p className="mt-2 text-muted-foreground">{error}</p>
                        <Button asChild className="mt-6 bg-black hover:bg-black/90">
                            <Link href="/dashboard/subtitles">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
                            </Link>
                        </Button>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <motion.div
            className="container mx-auto max-w-7xl space-y-6 p-4 md:p-8"
            variants={containerVariants}
            transition={{ duration: 0.4, ease: "easeOut" }}
            initial="hidden"
            animate="visible"
        >
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 via-transparent to-purple-50/50 blur-3xl -z-10" />
                <SubtitleHeader
                    filename={subtitleData?.filename || 'Loading...'}
                    videoPath={subtitleData?.video_path || 'Loading...'}
                    isSaving={isSaving}
                    hasSubtitles={subtitles.length > 0}
                    onSave={handleSave}
                    onDownload={handleDownload}
                />
            </div>

            <motion.div
                className="grid grid-cols-1 gap-6 lg:grid-cols-2"
                variants={gridVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants} className="space-y-3">
                    <VideoPlayer
                        ref={videoRef}
                        videoUrl={subtitleData?.video_url || ''}
                        subtitleUrl={subtitleUrl}
                        title={subtitleData?.video_path || 'Video Player'}
                        onDownloadVideo={handleDownloadVideo}
                        isDownloadDisabled={!subtitles.length || isSaving}
                        downloadVideoLoading={downloadVideoLoading}
                    />
                </motion.div>


                <motion.div variants={itemVariants} className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-br from-purple-100/20 to-transparent rounded-xl blur-xl -z-10" />
                    <SubtitleEditorPanel
                        subtitles={subtitles}
                        currentSub={currentSubtitle}
                        editingIndex={editingIndex}
                        isGenerating={isGenerating}
                        videoDuration={videoDuration}
                        onAddLine={handleAddLine}
                        onUpdate={updateSubtitle}
                        onDelete={handleDeleteLine}
                        onSetEditing={setEditingIndex}
                        onSeek={seekTo}
                        onGenerate={handleGenerate}
                        onFileChange={handleFileUpload}
                    />
                </motion.div>
            </motion.div>
        </motion.div>
    );
}