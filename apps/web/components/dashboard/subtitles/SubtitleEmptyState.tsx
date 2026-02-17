"use client";

import React from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload } from 'lucide-react';
import { GenerateSubtitlesForm } from './GenerateSubtitlesForm';

type SubtitleEmptyStateProps = {
    isGenerating: boolean;
    videoDuration: number | null;
    onGenerate: (language: string, targetLanguage: string) => void;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onAddLineManually: () => void;
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
    }
};

export function SubtitleEmptyState({
                                       isGenerating,
                                       videoDuration,
                                       onGenerate,
                                       onFileChange,
                                       onAddLineManually
                                   }: SubtitleEmptyStateProps) {
    return (
        <motion.div
            className="flex min-h-[500px] flex-col items-center justify-center p-4 py-10 text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants} className="mb-6">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Get Started with Subtitles
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Choose an option below to begin
                </p>
            </motion.div>

            <motion.div variants={itemVariants} transition= {{ duration: 0.3, ease: "easeOut" }}>
                <GenerateSubtitlesForm
                    isGenerating={isGenerating}
                    videoDuration={videoDuration}
                    onGenerate={onGenerate}
                />
            </motion.div>

            <motion.div variants={itemVariants} transition= {{ duration: 0.3, ease: "easeOut" }} className="relative w-full max-w-sm my-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-purple-100" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-3 text-muted-foreground font-medium">
                        Or
                    </span>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} transition= {{ duration: 0.3, ease: "easeOut" }} className="w-full max-w-sm">
                <Card className="border-purple-200/60 shadow-lg bg-gradient-to-br from-white to-purple-50/20">
                    <CardHeader className="p-6 pb-4">
                        <CardTitle className="text-lg flex items-center justify-center">
                            <Upload className="w-5 h-5 mr-2 text-purple-600" />
                            Upload File
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            accept=".srt"
                            onChange={onFileChange}
                        />
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                                asChild
                                variant="outline"
                                className="w-full border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all"
                            >
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload .SRT File
                                </label>
                            </Button>
                        </motion.div>
                        <p className="text-xs text-muted-foreground mt-3">
                            Import existing subtitle files
                        </p>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.p
                variants={itemVariants}
                transition= {{ duration: 0.3, ease: "easeOut" }}
                className="text-xs text-muted-foreground mt-6"
            >
                Need more control?{' '}
                <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-purple-600 hover:text-purple-700"
                    onClick={onAddLineManually}
                >
                    Add lines manually
                </Button>
            </motion.p>
        </motion.div>
    );
}