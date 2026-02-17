import { useState, useEffect, RefObject } from 'react';
import type { SubtitleLine } from "@repo/validation";
import { timeToSeconds } from '@/utils/timeUtils';

export function useVideoPlayer(
    videoRef: RefObject<HTMLVideoElement | null>,
    videoUrl: string | undefined,
    subtitles: SubtitleLine[]
) {
    const [currentTime, setCurrentTime] = useState(0);
    const [videoDuration, setVideoDuration] = useState<number | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateTime = () => setCurrentTime(video.currentTime);
        const onLoadedMetadata = () => setVideoDuration(video.duration);

        video.addEventListener('timeupdate', updateTime);
        video.addEventListener('loadedmetadata', onLoadedMetadata);

        return () => {
            video.removeEventListener('timeupdate', updateTime);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
        };
    }, [videoUrl]);

    // Find current subtitle
    const currentSubtitle = subtitles.find(s => {
        const start = timeToSeconds(s.start);
        const end = timeToSeconds(s.end);
        return currentTime >= start && currentTime <= end;
    });

    const seekTo = (time: string) => {
        if (videoRef.current) {
            videoRef.current.currentTime = timeToSeconds(time);
        }
    };

    return {
        currentTime,
        videoDuration,
        currentSubtitle,
        seekTo,
    };
}