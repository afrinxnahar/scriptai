import {
  Injectable,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SupabaseService } from '../supabase/supabase.service';
import { type CreateThumbnailInput, hasEnoughCredits } from '@repo/validation';

const BUCKET = 'thumbnails';
const CREDITS_PER_THUMBNAIL = 1;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

@Injectable()
export class ThumbnailService {
  constructor(
    private readonly supabaseService: SupabaseService,
    @InjectQueue('thumbnail') private readonly queue: Queue,
  ) {}

  async createJob(
    userId: string,
    input: CreateThumbnailInput,
    referenceImage?: Express.Multer.File,
    faceImage?: Express.Multer.File,
  ) {
    const { prompt, ratio, generateCount, videoLink, personalized } = input;

    if (referenceImage) this.validateImageFile(referenceImage, 'Reference image');
    if (faceImage) this.validateImageFile(faceImage, 'Face image');
    if (videoLink) this.validateVideoLink(videoLink);

    // ── Check profile + credits ──
    const requiredCredits = generateCount * CREDITS_PER_THUMBNAIL;
    const { data: profile, error: profileError } = await this.supabaseService
      .getClient()
      .from('profiles')
      .select('credits, ai_trained, youtube_connected')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) throw new NotFoundException('Profile not found');
    if (!hasEnoughCredits(profile.credits, requiredCredits)) {
      throw new ForbiddenException(
        `Insufficient credits. Need ${requiredCredits}, have ${profile.credits}.`,
      );
    }

    // ── Deterministic IDs so storage paths are stable ──
    const bullJobId = `thumb-${userId}-${Date.now()}`;

    // ── Upload input resources to storage under a job-scoped path ──
    //    Path: {userId}/jobs/{bullJobId}/inputs/{type}.{ext}
    let referenceImageUrl: string | null = null;
    let faceImageUrl: string | null = null;

    if (referenceImage) {
      referenceImageUrl = await this.uploadToStorage(
        `${userId}/jobs/${bullJobId}/inputs/reference.${this.ext(referenceImage.mimetype)}`,
        referenceImage.buffer,
        referenceImage.mimetype,
      );
    }
    if (faceImage) {
      faceImageUrl = await this.uploadToStorage(
        `${userId}/jobs/${bullJobId}/inputs/face.${this.ext(faceImage.mimetype)}`,
        faceImage.buffer,
        faceImage.mimetype,
      );
    }

    // ── Single DB insert with every column populated ──
    const shouldPersonalize = personalized && profile.ai_trained;

    const { data: job, error: jobError } = await this.supabaseService
      .getClient()
      .from('thumbnail_jobs')
      .insert({
        user_id: userId,
        prompt,
        status: 'queued',
        ratio,
        generate_count: generateCount,
        image_urls: [],
        reference_image_url: referenceImageUrl,
        face_image_url: faceImageUrl,
        video_link: videoLink || null,
        video_frame_url: null,
        error_message: null,
        credits_consumed: 0,
        job_id: bullJobId,
      })
      .select('id')
      .single();

    if (jobError || !job) {
      throw new InternalServerErrorException('Failed to create thumbnail job');
    }

    // ── Queue BullMQ job ──
    await this.queue.add(
      'generate-thumbnail',
      {
        userId,
        thumbnailJobId: job.id,
        bullJobId,
        prompt,
        ratio,
        generateCount,
        referenceImageUrl,
        faceImageUrl,
        videoLink: videoLink || null,
        personalized: shouldPersonalize,
      },
      {
        jobId: bullJobId,
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );

    return {
      id: job.id,
      jobId: bullJobId,
      status: 'queued',
      message: 'Thumbnail generation queued',
    };
  }

  async listJobs(userId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('thumbnail_jobs')
      .select(
        'id, user_id, prompt, status, ratio, generate_count, image_urls, ' +
        'reference_image_url, face_image_url, video_link, video_frame_url, ' +
        'error_message, credits_consumed, job_id, created_at, updated_at',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw new InternalServerErrorException('Failed to fetch thumbnail jobs');
    return data;
  }

  async getJob(id: string, userId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('thumbnail_jobs')
      .select(
        'id, user_id, prompt, status, ratio, generate_count, image_urls, ' +
        'reference_image_url, face_image_url, video_link, video_frame_url, ' +
        'error_message, credits_consumed, job_id, created_at, updated_at',
      )
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Thumbnail job not found');
    return data;
  }

  async deleteJob(id: string, userId: string) {
    const job = await this.getJob(id, userId);

    // Clean up all storage files under this job's folder
    const jobFolder = `${userId}/jobs/${job.job_id}`;
    const { data: files } = await this.supabaseService
      .getClient()
      .storage.from(BUCKET)
      .list(jobFolder, { limit: 100 });

    if (files && files.length > 0) {
      // List nested folders too (inputs/, generated/)
      for (const entry of files) {
        if (entry.id === null) {
          // It's a folder — list its contents
          const { data: nested } = await this.supabaseService
            .getClient()
            .storage.from(BUCKET)
            .list(`${jobFolder}/${entry.name}`, { limit: 100 });

          if (nested && nested.length > 0) {
            const paths = nested.map((f) => `${jobFolder}/${entry.name}/${f.name}`);
            await this.supabaseService.getClient().storage.from(BUCKET).remove(paths);
          }
        } else {
          await this.supabaseService.getClient().storage.from(BUCKET).remove([`${jobFolder}/${entry.name}`]);
        }
      }
    }

    // Delete DB record
    const { error } = await this.supabaseService
      .getClient()
      .from('thumbnail_jobs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new InternalServerErrorException('Failed to delete thumbnail job');
    return { success: true, message: 'Thumbnail job deleted' };
  }

  // ─── Helpers ───

  private validateImageFile(file: Express.Multer.File, label: string) {
    if (file.size > MAX_IMAGE_SIZE) {
      throw new BadRequestException(`${label} must be less than 10MB`);
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`${label} must be JPEG, PNG, or WebP`);
    }
  }

  private validateVideoLink(link: string) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    const driveRegex = /^(https?:\/\/)?(drive\.google\.com)\/.+$/;
    if (!youtubeRegex.test(link) && !driveRegex.test(link)) {
      throw new BadRequestException('Video link must be a valid YouTube or Google Drive URL');
    }
  }

  private async uploadToStorage(
    path: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    const { error } = await this.supabaseService
      .getClient()
      .storage.from(BUCKET)
      .upload(path, buffer, { contentType, upsert: true });

    if (error) throw new InternalServerErrorException(`Storage upload failed: ${error.message}`);

    const { data: { publicUrl } } = this.supabaseService
      .getClient()
      .storage.from(BUCKET)
      .getPublicUrl(path);

    return publicUrl;
  }

  private ext(mimetype: string): string {
    if (mimetype.includes('png')) return 'png';
    if (mimetype.includes('webp')) return 'webp';
    return 'jpg';
  }
}
