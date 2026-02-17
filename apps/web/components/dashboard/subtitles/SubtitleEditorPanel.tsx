"use client";

import React from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { SubtitleLine } from '@repo/validation';
import { SubtitleEmptyState } from './SubtitleEmptyState';
import { SubtitleList } from './SubtitleList';

type SubtitleEditorPanelProps = {
    subtitles: SubtitleLine[];
    currentSub: SubtitleLine | undefined;
    editingIndex: number | null;
    isGenerating: boolean;
    videoDuration: number | null;
    onAddLine: () => void;
    onUpdate: (idx: number, field: keyof SubtitleLine, val: string) => void;
    onDelete: (idx: number) => void;
    onSetEditing: (idx: number | null) => void;
    onSeek: (time: string) => void;
    onGenerate: (language: string, targetLanguage: string) => void;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,

    }
};

export function SubtitleEditorPanel({
    subtitles,
    currentSub,
    editingIndex,
    isGenerating,
    videoDuration,
    onAddLine,
    onUpdate,
    onDelete,
    onSetEditing,
    onSeek,
    onGenerate,
    onFileChange
}: SubtitleEditorPanelProps) {

    const hasSubtitles = subtitles.length > 0;

    return (
        <motion.div
            variants={cardVariants}
            transition={{ duration: 0.3, ease: "easeOut" }}
            initial="hidden"
            animate="visible"
        >
            <Card className="border-purple-200/60 shadow-lg bg-gradient-to-br from-white to-purple-50/20 h-full flex flex-col overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-purple-100/50 px-6 py-4 bg-gradient-to-b from-white to-purple-50/30">
                    <div>
                        <CardTitle className="text-xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            Subtitles
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {hasSubtitles ? `${subtitles.length} ${subtitles.length === 1 ? 'line' : 'lines'}` : 'No subtitles yet'}
                        </p>
                    </div>

                    {hasSubtitles && (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onAddLine}
                                className="border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all shadow-sm"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add Line
                            </Button>
                        </motion.div>
                    )}
                </CardHeader>

                <CardContent className="p-0 flex-grow overflow-hidden">
                    {!hasSubtitles ? (
                        <SubtitleEmptyState
                            isGenerating={isGenerating}
                            videoDuration={videoDuration}
                            onGenerate={onGenerate}
                            onFileChange={onFileChange}
                            onAddLineManually={onAddLine}
                        />
                    ) : (
                        <div className="p-4 h-full">
                            <SubtitleList
                                subtitles={subtitles}
                                currentSub={currentSub}
                                editingIndex={editingIndex}
                                onUpdate={onUpdate}
                                onDelete={onDelete}
                                onSetEditing={onSetEditing}
                                onSeek={onSeek}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}