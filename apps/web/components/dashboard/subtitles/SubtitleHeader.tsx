"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Save, Download, Loader2, ArrowLeft } from 'lucide-react';

type SubtitleHeaderProps = {
    filename: string;
    videoPath: string;
    isSaving: boolean;
    hasSubtitles: boolean;
    onSave: () => void;
    onDownload: () => void;
};

const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
        opacity: 1,
        y: 0,
    }
};

const buttonVariants = {
    hover: { scale: 1.02 },
    tap: { scale: 0.98 }
};

export function SubtitleHeader({ filename, videoPath, isSaving, hasSubtitles, onSave, onDownload }: SubtitleHeaderProps) {

    return (
        <motion.div
            className="relative border-b border-purple-100/50 px-6 py-5 bg-gradient-to-b from-white to-purple-50/20"
            variants={headerVariants}
            transition={{ duration: 0.4, ease: "easeOut" }}
            initial="hidden"
            animate="visible"
        >
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <motion.h1
                            className="truncate text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
                            title={filename}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1, duration: 0.4 }}
                        >
                            Editing: {filename}
                        </motion.h1>
                        <motion.p
                            className="mt-1 text-sm text-muted-foreground"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                        >
                            {hasSubtitles ? 'Modify and export your subtitles' : 'No subtitles loaded yet'}
                        </motion.p>
                    </div>

                    <motion.div
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                    >
                        <Button
                            asChild
                            variant="outline"
                            className="flex-shrink-0 h-9 w-9 p-0 sm:w-auto sm:px-4 border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all shadow-sm"
                        >
                            <Link href="/dashboard/subtitles">
                                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Back</span>
                            </Link>
                        </Button>
                    </motion.div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3">
                    <motion.div
                        className="flex-1 sm:flex-initial"
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                    >
                        <Button
                            variant="outline"
                            onClick={onDownload}
                            disabled={!hasSubtitles}
                            className="w-full sm:w-auto border-purple-200 hover:bg-purple-50 hover:border-purple-300 disabled:opacity-50 transition-all shadow-sm"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download SRT
                        </Button>
                    </motion.div>

                    <motion.div
                        className="flex-1 sm:flex-initial"
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                    >
                        <Button
                            onClick={onSave}
                            disabled={isSaving || !hasSubtitles}
                            className="w-full sm:w-auto bg-black hover:bg-black/90 disabled:opacity-50 shadow-md transition-all"
                        >
                            {isSaving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </motion.div>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-200 to-transparent" />
        </motion.div>
    );
}