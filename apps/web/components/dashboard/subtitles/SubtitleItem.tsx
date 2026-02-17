"use client";

import React from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Edit2, Trash2, Check } from 'lucide-react';
import { SubtitleLine } from '@repo/validation';

type SubtitleItemProps = {
    subtitle: SubtitleLine;
    index: number;
    isCurrent: boolean;
    isEditing: boolean;
    onUpdate: (idx: number, field: keyof SubtitleLine, val: string) => void;
    onDelete: (idx: number) => void;
    onSetEditing: (idx: number | null) => void;
    onSeek: (time: string) => void;
};

export function SubtitleItem({
    subtitle,
    index,
    isCurrent,
    isEditing,
    onUpdate,
    onDelete,
    onSetEditing,
    onSeek
}: SubtitleItemProps) {

    const handleSeekStart = () => onSeek(subtitle.start);

    if (isEditing) {
        return (
            <motion.div
                className="rounded-lg border border-purple-300 bg-purple-50/50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
            >
                <div className="space-y-3">
                    <div className="flex gap-2 items-center">
                        <Input
                            type="text"
                            value={subtitle.start}
                            onChange={(e) => onUpdate(index, 'start', e.target.value)}
                            className="font-mono text-sm border-purple-200 focus-visible:ring-purple-400"
                            placeholder="00:00:00.000"
                        />
                        <span className="text-muted-foreground">→</span>
                        <Input
                            type="text"
                            value={subtitle.end}
                            onChange={(e) => onUpdate(index, 'end', e.target.value)}
                            className="font-mono text-sm border-purple-200 focus-visible:ring-purple-400"
                            placeholder="00:00:00.000"
                        />
                    </div>
                    <Textarea
                        value={subtitle.text}
                        onChange={(e) => onUpdate(index, 'text', e.target.value)}
                        placeholder="Subtitle text..."
                        className="text-sm border-purple-200 focus-visible:ring-purple-400"
                        rows={3}
                    />
                    <Button
                        onClick={() => onSetEditing(null)}
                        className="w-full bg-black hover:bg-black/90"
                        size="sm"
                    >
                        <Check className="w-4 h-4 mr-2" /> Done
                    </Button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className={`group rounded-lg border p-4 transition-colors ${isCurrent
                ? 'bg-purple-50/50 border-purple-200'
                : 'bg-white border-gray-200 hover:border-purple-100'
                }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
        >
            <div className="space-y-2">
                <div className="flex justify-between items-start">
                    <span
                        className="text-xs text-muted-foreground font-mono cursor-pointer hover:text-purple-600 transition-colors"
                        onClick={handleSeekStart}
                    >
                        {subtitle.start} → {subtitle.end}
                    </span>
                    <div className="flex -mt-1 -mr-1 gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onSetEditing(index)}
                            className="h-7 w-7 hover:bg-purple-50"
                        >
                            <Edit2 className="w-3.5 h-3.5 text-purple-600" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(index)}
                            className="h-7 w-7 hover:bg-red-50"
                        >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </Button>
                    </div>
                </div>
                <p
                    className="text-sm leading-relaxed cursor-pointer hover:text-purple-600 transition-colors"
                    onClick={handleSeekStart}
                >
                    {subtitle.text}
                </p>
            </div>
        </motion.div>
    );
}