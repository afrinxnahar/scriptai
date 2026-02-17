"use client";

import React, {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Label} from '@/components/ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Info, Loader2, Plus, Sparkles} from 'lucide-react';
import {toast} from 'sonner';

type GenerateSubtitlesFormProps = {
    isGenerating: boolean;
    videoDuration: number | null;
    onGenerate: (sourceLanguage: string, targetLanguage: string) => void;
};

const sourceLanguages = [
    { value: 'auto', label: 'Auto Detect' },
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
    { value: 'Dutch', label: 'Dutch' },
    { value: 'Turkish', label: 'Turkish' },
    { value: 'Polish', label: 'Polish' },
    { value: 'Vietnamese', label: 'Vietnamese' },
    { value: 'Indonesian', label: 'Indonesian' },
    { value: 'Thai', label: 'Thai' },
    { value: 'Bengali', label: 'Bengali' },
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
    const [showTranslationHint, setShowTranslationHint] = useState(false);

    // Auto-update target language hint when source changes
    useEffect(() => {
        if (sourceLanguage !== 'auto' && targetLanguage !== 'same' && sourceLanguage === targetLanguage) {
            setShowTranslationHint(true);
        } else {
            setShowTranslationHint(false);
        }
    }, [sourceLanguage, targetLanguage]);

    const handleSourceLanguageChange = (value: string) => {
        setSourceLanguage(value);

        if (value !== 'auto' && value === targetLanguage) {
            toast.info("Tip: Source and target are the same. Consider using 'Same as Source' for better performance.");
        }
    };

    const handleTargetLanguageChange = (value: string) => {
        setTargetLanguage(value);

        if (sourceLanguage !== 'auto' && sourceLanguage === value) {
            toast.info("Tip: Consider using 'Same as Source' when not translating.");
        }
    };

    const handleSubmit = async () => {
        if (!videoDuration || videoDuration <= 0) {
            toast.error("Video metadata not loaded yet. Please wait.");
            return;
        }

        if (!sourceLanguage) {
            toast.error("Please select a video language.");
            return;
        }

        if (!targetLanguage) {
            toast.error("Please select a subtitle language.");
            return;
        }

        if (videoDuration > 600) {
            toast.warning("This video is quite long. Processing may take several minutes.");
        }

        const isTranslating = targetLanguage !== 'same' &&
            (sourceLanguage === 'auto' || sourceLanguage !== targetLanguage);

        if (isTranslating) {
            toast.info("Generating subtitles with translation. This may take longer.");
        } else {
            toast.info("Generating subtitles without translation.");
        }

        onGenerate(sourceLanguage, targetLanguage);
    };

    const getEstimatedTime = () => {
        if (!videoDuration) return null;
        const minutes = Math.ceil(videoDuration / 60);
        return Math.max(1, Math.ceil(minutes * 0.3));
    };

    const estimatedTime = getEstimatedTime();
    const isTranslating = targetLanguage !== 'same' &&
        (sourceLanguage === 'auto' || sourceLanguage !== targetLanguage);

    return (
        <Card className="w-full max-w-sm mb-4 text-left border-purple-200">
            <CardHeader className="p-6 pb-4">
                <CardTitle className="text-lg flex items-center">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate / Translate Subtitles (AI)
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="source-language" className="text-xs font-medium">
                            Video Language
                        </Label>
                        <Select
                            value={sourceLanguage}
                            onValueChange={handleSourceLanguageChange}
                            disabled={isGenerating}
                        >
                            <SelectTrigger id="source-language">
                                <SelectValue placeholder="Select video language" />
                            </SelectTrigger>
                            <SelectContent>
                                {sourceLanguages.map((lang) => (
                                    <SelectItem key={lang.value} value={lang.value}>
                                        {lang.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Language spoken in the video
                        </p>
                    </div>

                    {/* Target Language Dropdown */}
                    <div className="space-y-2">
                        <Label htmlFor="target-language" className="text-xs font-medium">
                            Subtitle Language
                        </Label>
                        <Select
                            value={targetLanguage}
                            onValueChange={handleTargetLanguageChange}
                            disabled={isGenerating}
                        >
                            <SelectTrigger id="target-language">
                                <SelectValue placeholder="Select subtitle language" />
                            </SelectTrigger>
                            <SelectContent>
                                {targetLanguages.map((lang) => (
                                    <SelectItem key={lang.value} value={lang.value}>
                                        {lang.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {isTranslating ? 'Subtitles will be translated' : 'No translation applied'}
                        </p>
                    </div>

                    {/* Info message for same language selection */}
                    {showTranslationHint && (
                        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <Info className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                            <p className="text-xs text-blue-900">
                                Source and target are the same. Consider selecting "Same as Source" for faster processing.
                            </p>
                        </div>
                    )}

                    {/* Estimated time display */}
                    {estimatedTime && !isGenerating && (
                        <div className="text-xs text-muted-foreground text-center pt-2">
                            Estimated time: ~{estimatedTime} {estimatedTime === 1 ? 'minute' : 'minutes'}
                        </div>
                    )}

                    {/* ADDED: Credit cost information */}
                    {!isGenerating && (
                        <div className="text-xs text-muted-foreground text-center pt-1 pb-2">
                            This action will use <strong>1 credit</strong>.
                        </div>
                    )}

                    <Button
                        onClick={handleSubmit}
                        disabled={isGenerating || !videoDuration || videoDuration <= 0}
                        className="w-full bg-black hover:bg-black/90"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Plus className="mr-2 h-4 w-4" />
                                {isTranslating ? 'Generate & Translate' : 'Generate Subtitles'}
                            </>
                        )}
                    </Button>
                </div>

                {!videoDuration && (
                    <p className="mt-4 text-xs text-center text-muted-foreground">
                        Waiting for video to load...
                    </p>
                )}

                {isGenerating && (
                    <p className="mt-4 text-xs text-center text-muted-foreground">
                        This may take a few minutes. Please don't close this tab.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}