"use client";

import React from 'react';
import { motion } from 'motion/react';
import { SubtitleLine } from '@repo/validation';
import { SubtitleItem } from './SubtitleItem';

type SubtitleListProps = {
    subtitles: SubtitleLine[];
    currentSub: SubtitleLine | undefined;
    editingIndex: number | null;
    onUpdate: (idx: number, field: keyof SubtitleLine, val: string) => void;
    onDelete: (idx: number) => void;
    onSetEditing: (idx: number | null) => void;
    onSeek: (time: string) => void;
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

export function SubtitleList({
    subtitles,
    currentSub,
    editingIndex,
    onUpdate,
    onDelete,
    onSetEditing,
    onSeek
}: SubtitleListProps) {
    return (
        <motion.div
            className="h-96 space-y-3 overflow-y-auto rounded-lg border border-purple-200/60 bg-gradient-to-b from-white to-purple-50/20 p-4 shadow-inner"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <style jsx>{`
                div::-webkit-scrollbar {
                    width: 8px;
                }
                div::-webkit-scrollbar-track {
                    background: rgb(250 245 255);
                    border-radius: 4px;
                }
                div::-webkit-scrollbar-thumb {
                    background: rgb(216 180 254);
                    border-radius: 4px;
                }
                div::-webkit-scrollbar-thumb:hover {
                    background: rgb(192 132 252);
                }
            `}</style>

            {subtitles.map((sub, idx) => (
                <SubtitleItem
                    key={idx}
                    subtitle={sub}
                    index={idx}
                    isCurrent={currentSub === sub}
                    isEditing={editingIndex === idx}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onSetEditing={onSetEditing}
                    onSeek={onSeek}
                />
            ))}
        </motion.div>
    );
}