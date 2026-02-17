import { Injectable, BadRequestException, NotFoundException, ForbiddenException, InternalServerErrorException, PayloadTooLargeException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import {
  type CreateSubtitleInput,
  type UpdateSubtitleInput,
  type UpdateSubtitleByIdInput,
  type UploadVideoInput,
  type BurnSubtitleInput,
  calculateCreditsFromTokens,
  hasEnoughCredits,
  getMinimumCreditsForGemini,
} from '@repo/validation';
import {
  createGoogleAI,
  type GoogleAIInstance,
  fetchVideoAsBuffer,
  getFileNameFromUrl,
  getMimeTypeFromUrl,
  convertJsonToSrt,
  configureFFmpeg,
} from '../utils';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';

async function waitForFileActive(ai: GoogleAIInstance, fileName: string, maxWaitTime = 120000) {
  const startTime = Date.now();
  const pollInterval = 3000;

  console.log(`Polling for file status: ${fileName}`);

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const file = await ai.files.get({ name: fileName });
      console.log(`File status: ${file.state} (${Math.round((Date.now() - startTime) / 1000)}s elapsed)`);

      if (file.state === 'ACTIVE') {
        return file;
      }
      if (file.state === 'FAILED') {
        throw new Error(`File processing failed: ${(file as any).stateDescription || file.state}`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error('Error checking file status:', error);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
  throw new Error(`File processing timeout for ${fileName} after ${maxWaitTime / 1000}s`);
}

@Injectable()
export class SubtitleService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) { }

  private async logErrorToDB(message: string, subtitleId: string) {
    if (!subtitleId) return;
    try {
      await this.supabaseService.getClient()
        .from("subtitle_jobs")
        .update({
          status: "error",
          error_message: message.slice(0, 5000)
        })
        .eq("id", subtitleId);
    } catch (dbError) {
      console.error("Failed to record error in DB:", dbError);
    }
  }

  async create(input: CreateSubtitleInput, userId: string) {
    const { subtitleId, language, targetLanguage, duration } = input;
    let tempFilePath: string | null = null;
    console.log('started')

    try {
      const { data: profileData, error: profileError } = await this.supabaseService.getClient()
        .from('profiles')
        .select('credits, ai_trained, youtube_connected')
        .eq('user_id', userId)
        .single();

      if (profileError || !profileData) {
        await this.logErrorToDB('Profile not found or profile fetch failed', subtitleId);
        throw new NotFoundException('Profile not found');
      }

      if (!profileData.ai_trained && !profileData.youtube_connected) {
        await this.logErrorToDB('AI training and YouTube connection are required', subtitleId);
        throw new ForbiddenException('AI training and YouTube connection are required');
      }

      const minCredits = getMinimumCreditsForGemini();
      if (!hasEnoughCredits(profileData.credits, minCredits)) {
        await this.logErrorToDB('Insufficient credits', subtitleId);
        throw new ForbiddenException('Insufficient credits. Please upgrade your plan or earn more credits.');
      }

      const { data: subtitle, error: subtitleError } = await this.supabaseService.getClient()
        .from('subtitle_jobs')
        .select('video_url')
        .eq('user_id', userId)
        .eq('id', subtitleId)
        .single();

      if (subtitleError && subtitleError.code !== 'PGRST116' || !subtitle?.video_url) {
        await this.logErrorToDB('Subtitle lookup failed or video_url missing', subtitleId);
        throw new NotFoundException('Subtitle lookup error');
      }

      const video_url = subtitle.video_url;
      const ai = await createGoogleAI(this.configService);

      const isAutoDetect = !language || language.toLowerCase() === 'auto detect' || language.toLowerCase() === 'auto';
      const languageInstruction = isAutoDetect
        ? "Automatically detect the language being spoken and transcribe in that language."
        : `Transcribe the audio in ${language}.`;

      const hasTargetLanguage = targetLanguage && targetLanguage.toLowerCase() !== 'none' && targetLanguage.toLowerCase() !== 'same';
      const targetLanguageInstruction = hasTargetLanguage
        ? `After transcription, translate all subtitle text to ${targetLanguage}. Maintain the same timestamps but provide the translated text.`
        : "Provide subtitles in the original/detected language without translation.";

      const prompt = `
You are an expert, highly-accurate subtitle transcription service.
Your task is to transcribe the provided audio file and generate precise, time-stamped subtitles.

**LANGUAGE INSTRUCTION:** ${languageInstruction}

**TARGET LANGUAGE INSTRUCTION:** ${targetLanguageInstruction}

**CRITICAL RULES:**
1.  **Format:** Your entire response MUST be a valid JSON object with two keys: "detected_language" (string) and "subtitles" (array). Do NOT include any text, headers, or markdown formatting (like \`\`\`json) before or after the object.
2.  **Language Detection:** The "detected_language" field MUST contain the full name of the language detected in the audio (e.g., "English", "Spanish", "Hindi", "French", etc.).
3.  **Translation:** ${hasTargetLanguage ? `Translate all subtitle text to ${targetLanguage} while keeping timestamps accurate. The subtitle text should be in ${targetLanguage}, not the original language.` : 'Provide subtitles in the detected/original language.'}
4.  **Timestamps:** Timestamps MUST be in the exact \`HH:MM:SS.mmm\` format (hours:minutes:seconds.milliseconds).
5.  **Punctuation:** Include correct punctuation (commas, periods, question marks) for readability.
6.  **Silence:** Do NOT generate subtitle entries for periods of silence.
7.  **Non-Speech:** (Optional) Transcribe significant non-speech sounds in brackets, e.g., [MUSIC], [LAUGHTER], [APPLAUSE].
8.  **Accuracy:** Transcribe the audio verbatim. Do not paraphrase or correct the speaker's grammar. ${hasTargetLanguage ? `When translating, maintain the meaning and tone of the original speech.` : ''}
9.  **SUBTITLE LENGTH:** Keep each subtitle entry SHORT and concise. Each subtitle should contain a maximum of 1-2 short sentences or 5-10 words. Break longer sentences into multiple subtitle entries with appropriate timestamps. This ensures subtitles are readable and don't cover the entire screen. Think of comfortable reading speed - viewers should be able to read the subtitle in 2-3 seconds.

**Output Example:**
{
  "detected_language": "English",
  "subtitles": [
    { "start": "00:00:01.200", "end": "00:00:04.100", "text": "${hasTargetLanguage ? `[Translated text in ${targetLanguage}]` : 'Hello everyone, and welcome.'}" },
    { "start": "00:00:04.350", "end": "00:00:07.000", "text": "${hasTargetLanguage ? `[Translated text in ${targetLanguage}]` : 'Today we\'re going to discuss...'}" },
    { "start": "00:00:07.100", "end": "00:00:08.000", "text": "[MUSIC]" }
  ]
}
`;

      console.log('Converting file to buffer...');
      const audioBuffer = await fetchVideoAsBuffer(video_url);
      const fileName = getFileNameFromUrl(video_url);
      console.log('Buffer length:', audioBuffer.length);

      tempFilePath = path.join(os.tmpdir(), `${Date.now()}_${fileName}`);
      console.log('Writing to temp file:', tempFilePath);
      await fs.writeFile(tempFilePath, audioBuffer);

      console.log('Uploading to Google AI...');
      const fileType = getMimeTypeFromUrl(video_url);
      const myFile = await ai.files.upload({
        file: tempFilePath,
        config: { mimeType: fileType },
      });

      console.log('File uploaded:', myFile);
      await waitForFileActive(ai, myFile.name!);

      const parts = [
        { text: prompt },
        {
          fileData: {
            fileUri: myFile.uri,
            mimeType: myFile.mimeType
          }
        }
      ];

      console.log('Generating content...');
      let result: any;
      try {
        result = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts }],
        });
        console.log('Generation complete');
      } catch (geminiError) {
        console.error('Gemini API error:', geminiError);
        await this.logErrorToDB(`Gemini API error: ${geminiError}`, subtitleId);
        throw new InternalServerErrorException('Failed to generate subtitles from Gemini API');
      }

      if (tempFilePath) {
        await fs.unlink(tempFilePath).catch(err =>
          console.error('Failed to delete temp file:', err)
        );
      }

      let subtitlesData;
      try {
        const rawText = result.text;
        const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        subtitlesData = JSON.parse(cleanedText);

        if (!subtitlesData.detected_language || !subtitlesData.subtitles) {
          throw new Error('Invalid response structure from Gemini');
        }
      } catch (parseError) {
        await this.logErrorToDB(`Failed to parse Gemini JSON: ${String(parseError)}`, subtitleId);
        console.error('Failed to parse JSON from Gemini:', parseError, "Raw text:", result.text);
        throw new InternalServerErrorException('Failed to parse subtitle data');
      }

      const subtitlesJson = subtitlesData.subtitles;
      const detectedLanguage = subtitlesData.detected_language;

      console.log('Detected language:', detectedLanguage);

      const { data, error: subtitleInsertError } = await this.supabaseService.getClient()
        .from("subtitle_jobs")
        .update({
          subtitles_json: JSON.stringify(subtitlesJson),
          status: "done",
          language: language,
          detected_language: detectedLanguage,
          target_language: targetLanguage,
          duration: duration
        })
        .eq("id", subtitleId)
        .eq("user_id", userId)
        .select()
        .single();

      if (subtitleInsertError) {
        await this.logErrorToDB(`Failed to update subtitles: ${subtitleInsertError.message}`, subtitleId);
        throw new InternalServerErrorException('Failed to update subtitles');
      }

      const totalTokens = result?.usageMetadata?.totalTokenCount ?? 0;
      const creditsConsumed = calculateCreditsFromTokens({ totalTokens });

      console.log(`Tokens used: ${totalTokens}, Credits to deduct: ${creditsConsumed}`);

      if (!hasEnoughCredits(profileData.credits, creditsConsumed)) {
        await this.logErrorToDB('Insufficient credits for token usage', subtitleId);
        throw new ForbiddenException('Insufficient credits for this operation.');
      }

      const { error: updateError } = await this.supabaseService.getClient()
        .rpc('update_user_credits', {
          user_uuid: userId,
          credit_change: -creditsConsumed,
        });

      if (updateError) {
        console.error('Error updating credits:', updateError);
        throw new InternalServerErrorException('Failed to update credits');
      }

      await this.supabaseService.getClient()
        .from('subtitle_jobs')
        .update({ credits_consumed: creditsConsumed })
        .eq('id', subtitleId);

      return {
        success: true,
        detected_language: detectedLanguage,
        target_language: hasTargetLanguage ? targetLanguage : detectedLanguage,
        creditsConsumed,
        totalTokens,
      };
    } catch (error) {
      if (tempFilePath) {
        fs.unlink(tempFilePath).catch(err =>
          console.error('Failed to delete temp file:', err)
        );
      }
      throw error;
    }
  }

  async findAll(userId: string) {
    const { data: subtitleData, error: subtitleError } = await this.supabaseService.getClient()
      .from('subtitle_jobs')
      .select("*")
      .eq("user_id", userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (subtitleError) {
      throw new InternalServerErrorException('Error fetching subtitle');
    }

    return subtitleData;
  }

  async findOne(id: string, userId: string) {
    try {
      const { data: subtitleData, error: subtitleError } = await this.supabaseService.getClient()
        .from('subtitle_jobs')
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (subtitleError) {
        throw new InternalServerErrorException('Error fetching subtitle');
      }

      return {
        success: true,
        subtitle: subtitleData
      };
    } catch (error) {
      throw new InternalServerErrorException('Error fetching subtitle');
    }
  }

  async update(input: UpdateSubtitleInput, userId: string) {
    const { subtitle_json, subtitle_id } = input;

    if (!Array.isArray(subtitle_json)) {
      throw new BadRequestException('Invalid subtitle format');
    }

    const srtContent = convertJsonToSrt(subtitle_json);

    const { error: updateError } = await this.supabaseService.getClient()
      .from("subtitle_jobs")
      .update({
        subtitles_json: subtitle_json
      })
      .eq("id", subtitle_id)
      .eq("user_id", userId);

    if (updateError) {
      console.error(updateError);
      throw new InternalServerErrorException('Failed to update subtitles');
    }

    return {
      success: true,
      message: 'Subtitles updated successfully',
      subtitles: subtitle_json,
      srt: srtContent
    };
  }

  async remove(id: string, userId: string) {
    try {
      const { data: subtitleData, error: subtitleError } = await this.supabaseService.getClient()
        .from('subtitle_jobs')
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (subtitleError && subtitleError.code !== 'PGRST116') {
        console.error('Subtitle lookup error:', subtitleError);
        throw new NotFoundException('Subtitle lookup error');
      }

      if (subtitleData?.video_url) {
        const bucketName = 'video_subtitles';
        const filePath = subtitleData.video_url.substring(
          subtitleData.video_url.indexOf(bucketName) + bucketName.length + 1
        );
        if (filePath) {
          await this.supabaseService.getClient().storage.from(bucketName).remove([filePath]);
        }
      }

      return {
        success: true,
        message: 'Subtitle removed successfully',
      };

    } catch (error) {
      throw new InternalServerErrorException('Error removing subtitle');
    }

  }

  async updateSubtitles(id: string, input: UpdateSubtitleByIdInput, userId: string) {
    const { subtitle_json } = input;
    if (!Array.isArray(subtitle_json)) {
      throw new BadRequestException('Invalid subtitle format');
    }
    const srtContent = convertJsonToSrt(subtitle_json);
    const { error: updateError } = await this.supabaseService.getClient()
      .from("subtitle_jobs")
      .update({ subtitles_json: JSON.stringify(subtitle_json) })
      .eq("id", id)
      .eq("user_id", userId);
    if (updateError) {
      console.error(updateError);
      throw new InternalServerErrorException('Failed to update subtitles');
    }
    return {
      success: true,
      message: 'Subtitles updated successfully',
      subtitles: subtitle_json,
      srt: srtContent
    };
  }

  async upload(
    file: Express.Multer.File,
    input: UploadVideoInput,
    userId: string,
    filename: string,
  ) {
    const { duration } = input;

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!duration) {
      throw new BadRequestException('No duration provided');
    }

    const parsedDuration =
      typeof duration === 'string' ? parseFloat(duration) : duration;

    if (isNaN(parsedDuration)) {
      throw new BadRequestException('Invalid duration format');
    }

    const maxSize = 200 * 1024 * 1024; // 200MB
    if (file.size > maxSize) {
      throw new PayloadTooLargeException('File size must be less than 200MB');
    }

    const maxDuration = 10 * 60; // 10 minutes
    if (parsedDuration > maxDuration) {
      throw new BadRequestException('Video duration must be 10 minutes or less');
    }

    const newFileName = `${userId}/${Date.now()}_${file.originalname}`;

    try {
      const { error: uploadError } = await this.supabaseService
        .getClient()
        .storage
        .from('video_subtitles')
        .upload(newFileName, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) {
        throw uploadError;
      }
    } catch (err) {
      throw new InternalServerErrorException('Failed to upload video');
    } finally {
      await fs.unlink(file.path).catch(() => null);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = this.supabaseService
      .getClient()
      .storage
      .from('video_subtitles')
      .getPublicUrl(newFileName);

    // Create subtitle job
    const { data, error: subtitleInsertError } =
      await this.supabaseService
        .getClient()
        .from('subtitle_jobs')
        .insert({
          user_id: userId,
          video_path: publicUrl,
          video_url: publicUrl,
          duration: parsedDuration,
          filename: filename,
        })
        .select()
        .single();

    if (subtitleInsertError) {
      throw new InternalServerErrorException(
        'Failed to create subtitle job',
      );
    }

    return {
      success: true,
      subtitleId: data.id,
    };
  }

  async burnSubtitle(input: BurnSubtitleInput): Promise<Buffer> {
    const { videoUrl, subtitles } = input;

    console.log('Starting burnSubtitle process...');
    console.log(' Video URL:', videoUrl);
    console.log(' Subtitles received:', subtitles.length);

    const videoBuffer = await fetchVideoAsBuffer(videoUrl);

    const tmpDir = path.join(os.tmpdir(), 'video_processing');
    await fs.mkdir(tmpDir, { recursive: true });

    const videoPath = path.join(tmpDir, `input_${Date.now()}.mp4`);
    const srtPath = path.join(tmpDir, `subs_${Date.now()}.srt`);
    const outputPath = path.join(tmpDir, `output_${Date.now()}.mp4`);

    try {
      await fs.writeFile(videoPath, videoBuffer);
      console.log('💾 Saved video to:', videoPath);

      const srtContent = convertJsonToSrt(subtitles);
      await fs.writeFile(srtPath, srtContent, 'utf-8');

      const ffmpeg = configureFFmpeg();

      const safeSubtitlePath = srtPath
        .replace(/\\/g, '/')
        .replace(/:/g, '\\:');

      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .outputOptions(['-c:v', 'libx264', '-c:a', 'copy'])
          .videoFilter(`subtitles='${safeSubtitlePath}'`)
          .on('start', (cmd) => console.log(' FFmpeg command:', cmd))
          .on('progress', (p) => console.log(`⏳ FFmpeg progress: ${p.percent?.toFixed(2)}%`))
          .on('end', () => {
            console.log(' FFmpeg completed successfully');
            resolve();
          })
          .on('error', (err) => {
            console.error('Burn subtitle error:', err);
            reject(err);
          })
          .save(outputPath);
      });

      const outputBuffer = await fs.readFile(outputPath);
      console.log(' Output video size:', outputBuffer.length);

      return outputBuffer;
    } finally {
      await Promise.allSettled([
        fs.unlink(videoPath).catch(() => null),
        fs.unlink(srtPath).catch(() => null),
        fs.unlink(outputPath).catch(() => null),
      ]);
    }
  }
}
