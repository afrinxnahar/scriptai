"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Download,
    Loader2,
    Play,
    Pause,
    Info,
    FileText,
    Film,
    Maximize,
    Minimize,
    Volume2,
    VolumeX,
    Settings,
    Check
} from 'lucide-react';

// Helper to format seconds into MM:SS
const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

type VideoPlayerProps = {
    videoUrl: string;
    title: string;
    subtitleUrl: string | null;
    onDownloadVideo: () => Promise<void>;
    isDownloadDisabled: boolean;
    downloadVideoLoading: boolean;
    detectedLanguage?: string;
    targetLanguage?: string;
    language?: string;
};

export const VideoPlayer = React.forwardRef<HTMLVideoElement, VideoPlayerProps>(
    ({ videoUrl, title, subtitleUrl, onDownloadVideo, isDownloadDisabled, downloadVideoLoading, detectedLanguage, targetLanguage, language }, ref) => {

        // --- STATE MANAGEMENT ---
        const [isPlaying, setIsPlaying] = useState(false);
        const [progress, setProgress] = useState(0);
        const [currentTime, setCurrentTime] = useState(0);
        const [duration, setDuration] = useState(0);
        const [volume, setVolume] = useState(1);
        const [isMuted, setIsMuted] = useState(false);
        const [isFullscreen, setIsFullscreen] = useState(false);
        const [showControls, setShowControls] = useState(true);

        // Settings State
        const [showSettings, setShowSettings] = useState(false);
        const [playbackRate, setPlaybackRate] = useState(1);
        const [isSubtitleOn, setIsSubtitleOn] = useState(true);

        // Refs
        const internalVideoRef = useRef<HTMLVideoElement>(null);
        const containerRef = useRef<HTMLDivElement>(null);
        const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

        // Merge refs helper
        const setRefs = (element: HTMLVideoElement | null) => {
            internalVideoRef.current = element;
            if (typeof ref === "function") ref(element);
            else if (ref) ref.current = element;
        };

        // --- CONTROLLERS ---

        const togglePlay = () => {
            if (internalVideoRef.current) {
                if (isPlaying) {
                    internalVideoRef.current.pause();
                } else {
                    internalVideoRef.current.play();
                }
                setIsPlaying(!isPlaying);
            }
        };

        const toggleMute = () => {
            if (internalVideoRef.current) {
                internalVideoRef.current.muted = !isMuted;
                setIsMuted(!isMuted);
            }
        };

        const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newVol = parseFloat(e.target.value);
            setVolume(newVol);
            if (internalVideoRef.current) {
                internalVideoRef.current.volume = newVol;
                internalVideoRef.current.muted = newVol === 0;
                setIsMuted(newVol === 0);
            }
        };

        const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
            const seekTime = (parseFloat(e.target.value) / 100) * duration;
            if (internalVideoRef.current) {
                internalVideoRef.current.currentTime = seekTime;
                setProgress(parseFloat(e.target.value));
            }
        };

        const toggleFullscreen = () => {
            if (!document.fullscreenElement) {
                containerRef.current?.requestFullscreen();
                setIsFullscreen(true);
            } else {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        };

        // Settings Handlers
        const handlePlaybackRate = (rate: number) => {
            if (internalVideoRef.current) {
                internalVideoRef.current.playbackRate = rate;
                setPlaybackRate(rate);
                // We keep the menu open for better UX, or close it: setShowSettings(false);
            }
        };

        const toggleSubtitles = (enabled: boolean) => {
            if (internalVideoRef.current && internalVideoRef.current.textTracks.length > 0) {
                // Access the first track (assumed to be the subtitles)
                const track = internalVideoRef.current.textTracks[0];
                track!.mode = enabled ? 'showing' : 'hidden';
                setIsSubtitleOn(enabled);
            }
        };

        // --- EVENT LISTENERS ---

        const onTimeUpdate = () => {
            if (internalVideoRef.current) {
                const current = internalVideoRef.current.currentTime;
                const total = internalVideoRef.current.duration;
                setCurrentTime(current);
                setProgress((current / total) * 100);
            }
        };

        const onLoadedMetadata = () => {
            if (internalVideoRef.current) {
                setDuration(internalVideoRef.current.duration);
                // Ensure subtitles start in the correct state
                if (internalVideoRef.current.textTracks[0]) {
                    internalVideoRef.current.textTracks[0].mode = isSubtitleOn ? 'showing' : 'hidden';
                }
            }
        };

        const handleMouseMove = () => {
            setShowControls(true);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            if (isPlaying) {
                controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2500);
            }
        };

        // Close settings when clicking outside (simple implementation)
        useEffect(() => {
            const closeSettings = (e: MouseEvent) => {
                // @ts-ignore
                if (showSettings && !e.target?.closest('.settings-container')) {
                    setShowSettings(false);
                }
            };
            document.addEventListener('mousedown', closeSettings);
            return () => document.removeEventListener('mousedown', closeSettings);
        }, [showSettings]);

        return (
            <section className="flex flex-col gap-6 w-full">
                {/* --- VIDEO CONTAINER --- */}
                <div
                    ref={containerRef}
                    className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 group select-none"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => isPlaying && setShowControls(false)}
                >

                    {/* 1. Video Element */}
                    <video
                        ref={setRefs}
                        key={videoUrl}
                        src={videoUrl}
                        className="w-full h-full object-contain bg-black"
                        onClick={togglePlay}
                        onTimeUpdate={onTimeUpdate}
                        onLoadedMetadata={onLoadedMetadata}
                        onEnded={() => setIsPlaying(false)}
                        crossOrigin="anonymous"
                    >
                        {subtitleUrl && (
                            <track
                                key={subtitleUrl}
                                src={subtitleUrl}
                                kind="subtitles"
                                label="English"
                                default={isSubtitleOn}
                            />
                        )}
                    </video>

                    {/* 2. Center Play Button */}
                    {(!isPlaying || showControls) && (
                        <div
                            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${!isPlaying ? 'opacity-100' : 'opacity-0'}`}
                            onClick={togglePlay}
                        >
                            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-violet-600/90 hover:scale-110 transition-all cursor-pointer shadow-xl ring-1 ring-white/20">
                                {isPlaying ? (
                                    <Pause className="w-8 h-8 text-white fill-current" />
                                ) : (
                                    <Play className="w-8 h-8 ml-1 text-white fill-current" />
                                )}
                            </div>
                        </div>
                    )}

                    {/* 3. Custom Control Bar */}
                    <div className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>

                        {/* Progress Bar */}
                        <div className="relative group/timeline w-full h-1.5 mb-4 cursor-pointer flex items-center">
                            <div className="absolute w-full h-full bg-white/20 rounded-full"></div>
                            <div
                                className="absolute h-full bg-violet-500 rounded-full pointer-events-none z-10"
                                style={{ width: `${progress}%` }}
                            />
                            <div
                                className="absolute h-4 w-4 bg-white rounded-full shadow-lg scale-0 group-hover/timeline:scale-100 transition-transform z-20"
                                style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
                            />
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="0.1"
                                value={progress}
                                onChange={handleSeek}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                            />
                        </div>

                        {/* Controls Row */}
                        <div className="flex justify-between items-center text-white">

                            {/* Left: Play & Volume */}
                            <div className="flex items-center gap-4">
                                <button onClick={togglePlay} className="hover:text-violet-400 transition-colors">
                                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                                </button>

                                <div className="flex items-center gap-2 group/volume">
                                    <button onClick={toggleMute} className="hover:text-violet-400 transition-colors">
                                        {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                    </button>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={isMuted ? 0 : volume}
                                        onChange={handleVolumeChange}
                                        className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                                    />
                                </div>

                                <span className="text-xs font-mono opacity-80 select-none">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </span>
                            </div>

                            {/* Right: Settings & Fullscreen */}
                            <div className="flex items-center gap-4 relative settings-container">

                                {/* Settings Menu */}
                                {showSettings && (
                                    <div className="absolute bottom-12 right-0 bg-black/90 border border-white/10 backdrop-blur-md rounded-xl p-3 w-56 shadow-2xl animate-in fade-in slide-in-from-bottom-2 z-50">

                                        {/* Section: Subtitles */}
                                        <div className="mb-3 border-b border-white/10 pb-2">
                                            <p className="text-xs font-semibold text-slate-400 px-2 py-1 mb-1 uppercase tracking-wider flex items-center gap-2">
                                                <span className="material-icons-round text-sm">subtitles</span> Subtitles
                                            </p>
                                            <button
                                                onClick={() => toggleSubtitles(false)}
                                                className={`w-full text-sm text-left px-3 py-1.5 rounded-lg transition-colors hover:bg-white/10 flex justify-between items-center ${!isSubtitleOn ? 'text-violet-400 bg-white/5' : 'text-white/80'}`}
                                            >
                                                Off
                                                {!isSubtitleOn && <Check className="w-3.5 h-3.5" />}
                                            </button>
                                            <button
                                                onClick={() => toggleSubtitles(true)}
                                                className={`w-full text-sm text-left px-3 py-1.5 rounded-lg transition-colors hover:bg-white/10 flex justify-between items-center ${isSubtitleOn ? 'text-violet-400 bg-white/5' : 'text-white/80'}`}
                                            >
                                                English
                                                {isSubtitleOn && <Check className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>

                                        {/* Section: Speed */}
                                        <div>
                                            <p className="text-xs font-semibold text-slate-400 px-2 py-1 mb-1 uppercase tracking-wider flex items-center gap-2">
                                                <span className="material-icons-round text-sm">speed</span> Speed
                                            </p>
                                            <div className="grid grid-cols-4 gap-1">
                                                {[0.5, 1, 1.5, 2].map((rate) => (
                                                    <button
                                                        key={rate}
                                                        onClick={() => handlePlaybackRate(rate)}
                                                        className={`text-xs font-medium py-1.5 rounded-md transition-colors hover:bg-white/20 ${playbackRate === rate ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'bg-white/5 text-slate-300'}`}
                                                    >
                                                        {rate}x
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className={`transition-all ${showSettings ? 'text-violet-400 rotate-90' : 'text-white hover:text-violet-400'} duration-300`}
                                >
                                    <Settings className="w-5 h-5" />
                                </button>

                                <button onClick={toggleFullscreen} className="hover:text-violet-400 transition-colors text-white">
                                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>


                <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4">

                    {/* Left: Info Block */}
                    <div className="flex items-center gap-3">
                        {/* Circle Icon */}
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                            <Info className="w-5 h-5" />
                        </div>

                        {/* Text Block */}
                        <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white max-w-[200px] truncate" title={title}>
                                Video Details
                            </p>
                            <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                                {/* Duration */}
                                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
                                    {Math.round(duration) || "0:00"} seconds
                                </span>

                                {
                                    language == "en" && detectedLanguage && (
                                        <>
                                            <span className="opacity-50">•</span>
                                            <span className="flex items-center gap-1.5">
                                                <span className="capitalize" title={`User selected: ${language}`}>
                                                    {detectedLanguage ? (
                                                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                                                            {detectedLanguage} <span className="text-[10px] text-slate-400 font-normal">(AI)</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-600 dark:text-slate-400">
                                                            {language || "Unknown"}
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="text-slate-300 dark:text-slate-600">→</span>
                                                <span className="capitalize font-bold text-violet-600 dark:text-violet-400">
                                                    {targetLanguage || "English"}
                                                </span>
                                            </span>
                                        </>

                                    )
                                }


                            </p>
                        </div>
                    </div>

                    {/* Right: Download Button */}
                    <Button
                        className="rounded-xl px-6 bg-slate-900 dark:bg-violet-600 text-white hover:bg-slate-800 dark:hover:bg-violet-700 shadow-lg shadow-slate-200 dark:shadow-none transition-all h-10 sm:h-auto"
                        onClick={onDownloadVideo}
                        disabled={isDownloadDisabled || downloadVideoLoading}
                    >
                        {downloadVideoLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing
                            </>
                        ) : (
                            <>
                                <Film className="mr-2 h-4 w-4" />
                                Download Video
                            </>
                        )}
                    </Button>
                </div>
            </section>
        );
    }
);

VideoPlayer.displayName = "VideoPlayer";