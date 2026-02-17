import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';

export const configureFFmpeg = () => {
    if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);
    if (ffprobePath.path) ffmpeg.setFfprobePath(ffprobePath.path);

    return (input?: string) => ffmpeg(input);
};
