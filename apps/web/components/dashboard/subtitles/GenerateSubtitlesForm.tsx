"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Clock, Zap, Globe, Languages } from 'lucide-react';
import { toast } from 'sonner';

type GenerateSubtitlesFormProps = {
    isGenerating: boolean;
    videoDuration: number | null;
    onGenerate: (sourceLanguage: string, targetLanguage: string) => void;
};

const sourceLanguages = [
    { value: 'auto', label: 'Auto Detect (Recommended)' },
    { value: 'English', label: 'English' },
    { value: 'Spanish', label: 'Spanish' },
    { value: 'French', label: 'French' },
    { value: 'German', label: 'German' },
    { value: 'Hindi', label: 'Hindi' },
    { value: 'Japanese', label: 'Japanese' },
    { value: 'Portuguese', label: 'Portuguese' },
    { value: 'Chinese', label: 'Chinese' },
    { value: 'Arabic', label: 'Arabic' },
    { value: 'Russian', label: 'Russian' },
    { value: 'Italian', label: 'Italian' },
    { value: 'Korean', label: 'Korean' },
];

const targetLanguages = [
    { value: 'same', label: 'Same as Source (No Translation)' },
    ...sourceLanguages.filter(lang => lang.value !== 'auto')
];

export function GenerateSubtitlesForm({
    isGenerating,
    videoDuration,
    onGenerate
}: GenerateSubtitlesFormProps) {
    const [sourceLanguage, setSourceLanguage] = useState('auto');
    const [targetLanguage, setTargetLanguage] = useState('same');

    // Calculate estimates
    const getEstimatedTime = () => {
        if (!videoDuration) return null;
        const minutes = Math.ceil(videoDuration / 60);
        return Math.max(1, Math.ceil(minutes * 0.3));
    };

    const estimatedTime = getEstimatedTime();
    const isTranslating = targetLanguage !== 'same';

    // Smart logic for language hints
    useEffect(() => {
        if (sourceLanguage !== 'auto' && targetLanguage !== 'same' && sourceLanguage === targetLanguage) {
            toast.info("Tip: You selected the same language for Source and Target. Switched to 'Same as Source' for better accuracy.");
            setTargetLanguage('same');
        }
    }, [sourceLanguage, targetLanguage]);

    const handleSubmit = async () => {
        if (!videoDuration || videoDuration <= 0) {
            toast.error("Video metadata loading...");
            return;
        }
        if (videoDuration > 1200) {
            toast.warning("Long video detected. This might take a while.");
        }
        onGenerate(sourceLanguage, targetLanguage);
    };

    return (
        <div className="w-full space-y-6">

            {/* --- INPUTS SECTION --- */}
            <div className="space-y-5">

                {/* 1. Video Language */}
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        Video Language
                    </Label>
                    <Select
                        value={sourceLanguage}
                        onValueChange={setSourceLanguage}
                        disabled={isGenerating}
                    >
                        <SelectTrigger className="h-12 bg-slate-50 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-violet-500 rounded-xl text-slate-900 dark:text-white shadow-sm font-medium">
                            <SelectValue placeholder="Select video language" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {sourceLanguages.map((lang) => (
                                <SelectItem key={lang.value} value={lang.value}>
                                    {lang.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* 2. Subtitle Language */}
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <Languages className="w-3.5 h-3.5 text-slate-400" />
                        Subtitle Language
                    </Label>
                    <Select
                        value={targetLanguage}
                        onValueChange={setTargetLanguage}
                        disabled={isGenerating}
                    >
                        <SelectTrigger className="h-12 bg-slate-50 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-violet-500 rounded-xl text-slate-900 dark:text-white shadow-sm font-medium">
                            <SelectValue placeholder="Select subtitle language" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {targetLanguages.map((lang) => (
                                <SelectItem key={lang.value} value={lang.value}>
                                    {lang.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* --- INFO PILLS --- */}
            <div className="flex items-center gap-3 py-1">
                {/* Time Estimate */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                    <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {estimatedTime ? `~${estimatedTime} mins` : 'calculating...'}
                    </span>
                </div>


            </div>

            {/* --- ACTION BUTTON --- */}
            <div className="pt-2">
                <Button
                    onClick={handleSubmit}
                    disabled={isGenerating || !videoDuration || videoDuration <= 0}
                    className="w-full h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-xl font-bold text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Thinking...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-5 w-5" />
                            Generate Subtitles
                        </>
                    )}
                </Button>

                {isGenerating && (
                    <p className="mt-3 text-xs text-center text-slate-400 animate-pulse">
                        This usually takes about {estimatedTime || 1} minute(s).
                    </p>
                )}
            </div>
        </div>
    );
}