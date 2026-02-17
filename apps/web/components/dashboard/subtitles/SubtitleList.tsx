"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { SubtitleLine } from '@repo/validation';
import { SubtitleItem } from './SubtitleItem';
import { Button } from '@/components/ui/button';
import { ArrowDownCircle } from 'lucide-react';

const MemoizedSubtitleItem = React.memo(SubtitleItem);

type SubtitleListProps = {
    subtitles: SubtitleLine[];
    originalIndices?: number[];
    allSubtitles?: SubtitleLine[];
    currentSub: SubtitleLine | undefined;
    editingIndex: number | null;
    onUpdate: (idx: number, field: keyof SubtitleLine, val: string) => void;
    onDelete: (idx: number) => void;
    onSetEditing: (idx: number | null) => void;
    onSeek: (time: string) => void;
};

export function SubtitleList({
    subtitles,
    originalIndices,
    allSubtitles,
    currentSub,
    editingIndex,
    onUpdate,
    onDelete,
    onSetEditing,
    onSeek
}: SubtitleListProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

    const isProgrammaticScroll = useRef(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const scrollToActiveItem = useCallback((smooth = true) => {
        if (!currentSub || !scrollContainerRef.current) return;

        const activeIndex = subtitles.indexOf(currentSub);
        if (activeIndex === -1) return;

        const container = scrollContainerRef.current;
        const activeElement = container.children[activeIndex] as HTMLElement;

        if (activeElement) {
            isProgrammaticScroll.current = true;

            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

            const containerHeight = container.clientHeight;
            const elementTop = activeElement.offsetTop;
            const elementHeight = activeElement.clientHeight;
            const targetScroll = elementTop - (containerHeight / 2) + (elementHeight / 2);

            container.scrollTo({
                top: targetScroll,
                behavior: smooth ? 'smooth' : 'auto'
            });

            scrollTimeoutRef.current = setTimeout(() => {
                isProgrammaticScroll.current = false;
            }, 600);
        }
    }, [currentSub, subtitles]);

    useEffect(() => {
        if (autoScrollEnabled) {
            scrollToActiveItem(true);
        }
    }, [currentSub, autoScrollEnabled, scrollToActiveItem]);

    const handleScroll = useCallback(() => {
        if (!scrollContainerRef.current) return;

        if (isProgrammaticScroll.current) return;

        if (autoScrollEnabled) {
            setAutoScrollEnabled(false);
        }
    }, [autoScrollEnabled]);

    const handleResumeAutoScroll = () => {
        setAutoScrollEnabled(true);
        scrollToActiveItem(true);
    };

    return (
        <div className="relative h-full flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50 overflow-hidden">

            {/* SCROLLABLE AREA */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-1 scroll-smooth
                    [&::-webkit-scrollbar]:w-1.5
                    [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    hover:[&::-webkit-scrollbar-thumb]:bg-violet-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-violet-600"
            >
                {subtitles.map((sub, idx) => {
                    const originalIndex = originalIndices?.[idx] ?? idx;
                    const isEditing = originalIndices && allSubtitles
                        ? editingIndex !== null && allSubtitles[editingIndex] === sub
                        : editingIndex === originalIndex;

                    const key = `sub-${originalIndex}`;

                    return (
                        <MemoizedSubtitleItem
                            key={key}
                            subtitle={sub}
                            index={originalIndex}
                            isCurrent={currentSub === sub}
                            isEditing={isEditing}
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                            onSetEditing={onSetEditing}
                            onSeek={onSeek}
                        />
                    );
                })}

                <div className="h-[50vh]" />
            </div>


            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-slate-900 to-transparent pointer-events-none z-10" />


            {!autoScrollEnabled && subtitles.length > 0 && (
                <div className="absolute bottom-16 left-0 right-0 flex justify-center pointer-events-none z-30">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleResumeAutoScroll}
                        className="pointer-events-auto shadow-lg bg-slate-900/90 text-white hover:bg-slate-800 dark:bg-white/90 dark:text-slate-900 dark:hover:bg-white border-none rounded-full px-4 py-2 transition-all animate-in fade-in slide-in-from-bottom-2"
                    >
                        <ArrowDownCircle className="w-4 h-4 mr-2" />
                        Resume Auto-Scroll
                    </Button>
                </div>
            )}
        </div>
    );
}