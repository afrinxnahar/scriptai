import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createSupabaseClient, getSupabaseServiceEnv, SupabaseClient } from '@repo/supabase';
import { Thumbnail, Transcript, VideoData } from "@repo/validation";
import { GoogleGenAI } from '@google/genai';
import {
  validateInputs,
  validateEnvironment,
  fetchChannelData,
  manageYouTubeToken,
  fetchVideoData,
  analyzeStyle,
  generateEmbedding,
  saveStyleData,
} from './utils/train-ai';

interface TrainAiJobData {
  userId: string;
  videoUrls: string[];
  isRetraining?: boolean;
}

@Processor('train-ai', { concurrency: 1 })
export class TrainAiProcessor extends WorkerHost {
  private readonly logger = new Logger(TrainAiProcessor.name);
  private readonly supabase: SupabaseClient;
  private readonly genAI: GoogleGenAI;

  constructor(private readonly configService: ConfigService) {
    super();
    const { url, key } = getSupabaseServiceEnv();
    this.supabase = createSupabaseClient(url, key);

    this.genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });
  }

  async process(job: Job<TrainAiJobData>): Promise<void> {
    const { userId, videoUrls, isRetraining } = job.data;

    await job.updateProgress(0);
    await job.log('Job queued and validations starting...');

    let totalConsumedTokens = 0;

    try {
      await validateInputs(userId, videoUrls);
      await validateEnvironment();

      await job.updateProgress(10);
      await job.log('Fetching channel and token...');

      const channelData = await fetchChannelData(this.supabase, userId);
      const { accessToken } = await manageYouTubeToken(this.supabase, userId, channelData);

      await job.updateProgress(20);
      await job.log('Fetching video data...');

      const videoData = await fetchVideoData(videoUrls, accessToken, channelData.channel_id);

      await job.updateProgress(30);
      await job.log('Processing transcripts and thumbnails...');

      const { transcripts, thumbnails, totalVideoTokens } =
        await this.processVideoAssets(videoData, videoUrls);

      totalConsumedTokens += totalVideoTokens;

      await job.updateProgress(60);
      await job.log('Analyzing style and embedding...');

      const { styleAnalysis, totalStyleTokens } =
        await analyzeStyle(this.genAI, channelData, videoData, videoUrls);

      totalConsumedTokens += totalStyleTokens;

      const embedding = await generateEmbedding(this.genAI, styleAnalysis);

      await job.updateProgress(80);
      await job.log('Saving data...');

      await saveStyleData(
        this.supabase,
        userId,
        styleAnalysis,
        embedding,
        videoUrls,
        transcripts,
        thumbnails,
        totalConsumedTokens
      );

      await job.updateProgress(100);
      this.logger.log(`Train AI completed for ${userId}, retraining: ${isRetraining}`);
    } catch (error: any) {
      await job.log(`Error: ${error.message}`);
      this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async processVideoAssets(
    videos: VideoData[],
    videoUrls: string[],
  ): Promise<{
    transcripts: Transcript[];
    thumbnails: Thumbnail[];
    totalVideoTokens: number;
  }> {
    const transcripts: Transcript[] = [];
    const thumbnails: Thumbnail[] = [];
    let totalVideoTokens = 0;

    for (const [index, video] of videos.entries()) {
      const videoUrl = videoUrls[index];
      if (!videoUrl) {
        throw new Error(`Missing videoUrl for index ${index} (video id: ${video.id})`);
      }

      const prompt = `Analyze this YouTube video: ${videoUrl}. 
      Task: Transcribe the video into structured JSON. 
      Include the full text and timed segments.`;

      const schema = {
        type: "object",
        properties: {
          videoId: { type: "string" },
          transcriptText: { type: "string" },
          segments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                start: { type: "number" },
                end: { type: "number" },
                text: { type: "string" }
              },
              required: ["start", "end", "text"]
            }
          }
        },
        required: ["videoId", "transcriptText", "segments"],
      };

      const model = 'gemini-2.5-flash';

      const result: any = await this.genAI.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0
        },
      });

      let parsed = JSON.parse(result.text);

      if (!parsed) {
        throw new Error(`Gemini failed to return structured data for video ${video.id}`);
      }

      transcripts.push({
        videoId: video.id,
        transcriptText: parsed.transcriptText,
        segments: parsed.segments,
      });

      thumbnails.push({ videoId: video.id, thumbnailUrl: video.thumbnailUrl });

      totalVideoTokens += result?.usageMetadata?.totalTokenCount ?? 0;
    }

    return { transcripts, thumbnails, totalVideoTokens };
  }
}