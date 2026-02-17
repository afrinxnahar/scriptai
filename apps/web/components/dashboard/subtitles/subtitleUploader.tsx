"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, UploadCloud, Film } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
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

        const maxSize = 200 * 1024 * 1024;
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
            const maxDuration = 10 * 60;

            if (videoDuration > maxDuration) {
                toast.error("Video duration must be 10 minutes or less");
                e.target.value = "";
                return;
            }

            setFile(selectedFile);
            setDuration(videoDuration);
        };
        video.onerror = () => {
            toast.error("Could not load video metadata. The file may be corrupt or unsupported.");
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
            // Get auth token
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                throw new Error('Authentication required');
            }

            // Use fetch directly for FormData
            // const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/v1/subtitle/upload`, {
            //     method: 'POST',
            //     headers: {
            //         'Authorization': `Bearer ${token}`,
            //     },
            //     body: formData,
            // });

            // if (!response.ok) {
            //     const error = await response.json();
            //     throw new Error(error.message || 'Upload failed');
            // }

            const response = await api.upload('/api/v1/subtitle/upload', formData, {
                requireAuth: true,

                onUploadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                    console.log(percent);
                }
            })

            const data = response as { subtitleId: string };
            toast.success("Upload successful! Processing has started.");
            onUploadSuccess();
            await router.push(`/dashboard/subtitles/${data.subtitleId}`);

            setFile(null);
            setDuration(null);
        } catch (error) {
            console.log(error)
            toast.error(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card className="border-0 shadow-none">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Film className="h-5 w-5 text-purple-600" />
                    Upload Video for Subtitles
                </CardTitle>
                <CardDescription>
                    Upload your video file to start subtitle generation
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent>
                    <label
                        htmlFor="file-upload"
                        className={`group relative flex w-full cursor-pointer flex-col items-center justify-center space-y-3 rounded-lg border-2 border-dashed p-12 transition-all ${isUploading
                            ? "cursor-not-allowed opacity-50"
                            : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                            }`}
                    >
                        <motion.div
                            whileHover={!isUploading ? { scale: 1.05 } : {}}
                            transition={{ type: "spring", stiffness: 400 }}
                        >
                            <UploadCloud className={`h-12 w-12 transition-colors ${file ? "text-purple-600" : "text-gray-400 group-hover:text-purple-500"
                                }`} />
                        </motion.div>
                        <div className="space-y-1 text-center">
                            <p className="font-medium text-gray-700">
                                {file?.name || "Drop your video here or click to browse"}
                            </p>
                            <p className="text-sm text-gray-500">
                                MP4, MOV, MKV • Max 200MB • 10 min max duration
                            </p>
                        </div>
                    </label>
                    <Input
                        id="file-upload"
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isUploading}
                    />
                </CardContent>
                <CardFooter>
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={!file || !duration || isUploading}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading Video...
                            </>
                        ) : "Upload Video"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}