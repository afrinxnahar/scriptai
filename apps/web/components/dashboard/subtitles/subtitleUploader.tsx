"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { UploadCloud, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Hooks & Utils
import { api } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";

type SubtitleUploaderProps = {
    onUploadSuccess: () => void;
};

export function SubtitleUploader({ onUploadSuccess }: SubtitleUploaderProps) {
    const [file, setFile] = useState<File | null>(null);
    const [duration, setDuration] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(null);
        setDuration(null);

        const maxSize = 200 * 1024 * 1024; // 200MB
        if (selectedFile.size > maxSize) {
            toast.error("File size must be less than 200MB");
            e.target.value = "";
            return;
        }

        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
            URL.revokeObjectURL(video.src);
            const videoDuration = video.duration;
            const maxDuration = 10 * 60; // 10 minutes

            if (videoDuration > maxDuration) {
                toast.error("Video duration must be 10 minutes or less");
                e.target.value = "";
                return;
            }

            setFile(selectedFile);
            setDuration(videoDuration);
        };
        video.onerror = () => {
            toast.error("Could not load video metadata. The file may be corrupt.");
            e.target.value = "";
        };
        video.src = URL.createObjectURL(selectedFile);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!file || !duration) return toast.warning("Please select a valid file.");

        setIsUploading(true);
        const formData = new FormData();
        formData.append("video", file);
        formData.append("duration", String(duration));

        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) throw new Error("Authentication required");

            const response = await api.upload("/api/v1/subtitle/upload", formData, {
                requireAuth: true,
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                    console.log(`Upload progress: ${percent}%`);
                },
            });

            const data = response as { subtitleId: string };
            toast.success("Upload successful! Processing has started.");
            onUploadSuccess();
            router.push(`/dashboard/subtitles/${data.subtitleId}`);

            setFile(null);
            setDuration(null);
        } catch (error) {
            console.error(error);
            toast.error(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <CardHeader className="p-8 pb-4">
                <div className="flex items-center">
                    <div className="p-2.5 bg-violet-50 rounded-xl mr-4 border border-violet-100">
                        <UploadCloud className="text-violet-600 h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold text-slate-900">Upload Video</CardTitle>
                        <CardDescription className="text-slate-500">Supported formats: MP4, MOV, MKV</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <form onSubmit={handleSubmit} className="p-8 pt-2">
                <CardContent className="p-0">
                    <Label
                        htmlFor="file-upload"
                        className={`group relative flex w-full cursor-pointer flex-col items-center justify-center space-y-5 rounded-xl border-2 border-dashed py-16 px-8 transition-all duration-300 ${
                            isUploading
                                ? "cursor-not-allowed opacity-50 bg-slate-50 border-slate-200"
                                : "border-violet-200 bg-violet-50/30 hover:bg-violet-50 hover:border-violet-300"
                        }`}
                    >
                        <motion.div
                            whileHover={!isUploading ? { scale: 1.05 } : {}}
                            whileTap={!isUploading ? { scale: 0.95 } : {}}
                            className={`h-16 w-16 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300 ${
                                file ? "bg-violet-600" : "bg-slate-900"
                            }`}
                        >
                            {isUploading ? (
                                <Loader2 className="h-8 w-8 text-white animate-spin" />
                            ) : (
                                <UploadCloud className="h-8 w-8 text-white" />
                            )}
                        </motion.div>

                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-slate-900">
                                {file ? file.name : "Drag & Drop your video"}
                            </h3>
                            <p className="text-sm text-slate-500 mt-2">
                                {file
                                    ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                                    : <>or <span className="text-violet-600 font-medium underline underline-offset-2">browse files</span> from computer</>
                                }
                            </p>
                        </div>

                        <div className="flex items-center space-x-4 text-xs text-slate-400 uppercase tracking-widest font-bold">
                            <span>Max 200MB</span>
                            <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                            <span>10 Min Limit</span>
                        </div>
                    </Label>
                    <Input
                        id="file-upload"
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isUploading}
                    />
                </CardContent>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-end gap-4">

                    <Button
                        type="submit"
                        disabled={!file || !duration || isUploading}
                        className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-10 h-12 rounded-xl text-base font-bold shadow-lg shadow-slate-200 transition-all active:scale-95"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Processing...
                            </>
                        ) : "Generate Subtitles"}
                    </Button>
                </div>
            </form>
        </Card>
    );
}