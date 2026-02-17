"use client";

import React from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Loader2 } from 'lucide-react';

type VideoPlayerProps = {
    videoUrl: string;
    title: string;
    subtitleUrl: string | null;
    onDownloadVideo: () => Promise<void>;
    isDownloadDisabled: boolean;
    downloadVideoLoading: boolean;
};

export const VideoPlayer = React.forwardRef<HTMLVideoElement, VideoPlayerProps>(


    ({ videoUrl, title, subtitleUrl, onDownloadVideo, isDownloadDisabled, downloadVideoLoading }, ref) => {
        return (
            <Card className="group overflow-hidden lg:sticky lg:top-12 border border-white/20 shadow-xl transition-shadow duration-300 backdrop-blur-xl bg-white/40">
                <CardContent className="p-4 space-y-3">
                    <div className="relative aspect-video w-full overflow-hidden bg-black rounded-lg">
                        <video
                            ref={ref}
                            key={videoUrl}
                            src={videoUrl}
                            title={title}
                            controls
                            crossOrigin="anonymous"
                            className="h-full w-full object-contain"
                        >
                            {subtitleUrl && (
                                <track
                                    key={subtitleUrl}
                                    src={subtitleUrl}
                                    kind="subtitles"
                                    label="English"
                                    default
                                />
                            )}
                            Your browser does not support the video tag.
                        </video>

                        <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-lg" />
                    </div>

                    {/* Download button */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full bg-black/80 hover:bg-black text-white hover:text-white  border-white/10 hover:border-white/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all"
                            onClick={onDownloadVideo}
                            disabled={isDownloadDisabled || downloadVideoLoading}
                        >
                            {downloadVideoLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Downloading...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-5 w-5" />
                                    Download Video with Subtitles
                                </>
                            )}
                        </Button>
                    </motion.div>
                </CardContent>
            </Card>
        );
    }
);

VideoPlayer.displayName = "VideoPlayer";