import { spawn } from 'child_process';
import path from 'path';

export function mergeVideoWithAudio({
  videoPath,
  audioPath,
  outputPath,
}: {
  videoPath: string;
  audioPath: string;
  outputPath: string;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-i', videoPath,
      '-i', audioPath,
      '-map', '0:v:0',
      '-map', '1:a:0',
      '-c:v', 'copy',
      '-shortest',
      outputPath,
    ]);

    ffmpeg.stderr.on('data', (data) => {
      console.log(`[ffmpeg] ${data}`);
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });
}
