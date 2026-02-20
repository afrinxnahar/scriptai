import {
  Injectable,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SupabaseService } from '../supabase/supabase.service';
import { type CreateStoryBuilderInput, hasEnoughCredits } from '@repo/validation';

const CREDITS_PER_STORY = 1;

@Injectable()
export class StoryBuilderService {
  constructor(
    private readonly supabaseService: SupabaseService,
    @InjectQueue('story-builder') private readonly queue: Queue,
  ) {}

  async createJob(userId: string, input: CreateStoryBuilderInput) {
    const { videoTopic, targetAudience, videoDuration, contentType, tone, additionalContext, personalized } = input;

    const { data: profile, error: profileError } = await this.supabaseService
      .getClient()
      .from('profiles')
      .select('credits, ai_trained')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) throw new NotFoundException('Profile not found');
    if (!hasEnoughCredits(profile.credits, CREDITS_PER_STORY)) {
      throw new ForbiddenException(
        `Insufficient credits. Need ${CREDITS_PER_STORY}, have ${profile.credits}.`,
      );
    }

    const shouldPersonalize = personalized !== false && profile.ai_trained === true;

    const { data: job, error: jobError } = await this.supabaseService
      .getClient()
      .from('story_builder_jobs')
      .insert({
        user_id: userId,
        video_topic: videoTopic,
        target_audience: targetAudience || null,
        video_duration: videoDuration,
        content_type: contentType,
        tone: tone || null,
        additional_context: additionalContext || null,
        status: 'queued',
      })
      .select()
      .single();

    if (jobError || !job) {
      throw new InternalServerErrorException('Failed to create story builder job');
    }

    const bullJobId = `story-${userId}-${Date.now()}`;
    await this.queue.add(
      'generate-story',
      {
        userId,
        storyJobId: job.id,
        videoTopic,
        targetAudience: targetAudience || '',
        videoDuration,
        contentType,
        tone: tone || '',
        additionalContext: additionalContext || '',
        personalized: shouldPersonalize,
      },
      {
        jobId: bullJobId,
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );

    await this.supabaseService
      .getClient()
      .from('story_builder_jobs')
      .update({ job_id: bullJobId })
      .eq('id', job.id);

    return {
      id: job.id,
      jobId: bullJobId,
      status: 'queued',
      personalized: shouldPersonalize,
      message: shouldPersonalize
        ? 'Story structure generation queued (personalized to your style)'
        : 'Story structure generation queued',
    };
  }

  async listJobs(userId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('story_builder_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw new InternalServerErrorException('Failed to fetch story builder jobs');
    return data;
  }

  async getJob(id: string, userId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('story_builder_jobs')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Story builder job not found');
    return data;
  }

  async deleteJob(id: string, userId: string) {
    const { error } = await this.supabaseService
      .getClient()
      .from('story_builder_jobs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new InternalServerErrorException('Failed to delete story builder job');
    return { success: true };
  }

  async getProfileStatus(userId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('profiles')
      .select('ai_trained, credits')
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Profile not found');
    return { aiTrained: data.ai_trained ?? false, credits: data.credits ?? 0 };
  }
}
