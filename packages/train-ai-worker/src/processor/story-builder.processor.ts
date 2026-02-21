import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { createSupabaseClient, getSupabaseServiceEnv, SupabaseClient } from '@repo/supabase';
import {
  type VideoDuration,
  type ContentType,
  VIDEO_DURATION_LABELS,
  CONTENT_TYPE_LABELS,
} from '@repo/validation';
import { GoogleGenAI } from '@google/genai';

interface StoryBuilderJobData {
  userId: string;
  storyJobId: string;
  videoTopic: string;
  targetAudience: string;
  videoDuration: VideoDuration;
  contentType: ContentType;
  tone: string;
  additionalContext: string;
  personalized: boolean;
}

interface UserStyleData {
  tone: string | null;
  vocabulary_level: string | null;
  pacing: string | null;
  themes: string | null;
  humor_style: string | null;
  structure: string | null;
  style_analysis: string | null;
  audience_engagement: string[] | null;
  recommendations: Record<string, string> | null;
}

interface ChannelData {
  channel_name: string | null;
  channel_description: string | null;
  topic_details: any;
  default_language: string | null;
}

const CREDITS_PER_STORY = 1;

// JSON Schema for the story structure response.
// Gemini guarantees valid JSON matching this schema when passed via responseJsonSchema.
const STORY_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    hookStrategy: {
      type: 'object',
      description: 'Strategy for the first 10 seconds to grab attention',
      properties: {
        approach: { type: 'string', description: 'A brief description of the hook strategy' },
        openingLine: { type: 'string', description: 'The exact opening line or script for the hook' },
        visualSuggestion: { type: 'string', description: 'What the viewer should see during the hook' },
        emotionalTrigger: { type: 'string', description: 'The primary emotion this hook targets' },
      },
      required: ['approach', 'openingLine', 'visualSuggestion', 'emotionalTrigger'],
    },
    retentionBeats: {
      type: 'array',
      description: 'Key moments spread throughout the video to maintain viewer attention',
      items: {
        type: 'object',
        properties: {
          timestamp: { type: 'string', description: 'Approximate timestamp e.g. 0:30, 2:00' },
          type: { type: 'string', description: 'Type of retention beat: curiosity_gap, revelation, story_twist, payoff, cliffhanger, social_proof, demonstration' },
          description: { type: 'string', description: 'What happens at this beat and why it keeps viewers watching' },
        },
        required: ['timestamp', 'type', 'description'],
      },
      minItems: 4,
    },
    openLoops: {
      type: 'array',
      description: 'Questions or teases planted early that create anticipation',
      items: {
        type: 'object',
        properties: {
          setup: { type: 'string', description: 'The question or tease planted early' },
          payoffTimestamp: { type: 'string', description: 'When this loop gets closed' },
          description: { type: 'string', description: 'How this open loop creates anticipation' },
        },
        required: ['setup', 'payoffTimestamp', 'description'],
      },
      minItems: 2,
    },
    patternInterrupts: {
      type: 'array',
      description: 'Visual or tonal changes to re-engage attention at drop-off points',
      items: {
        type: 'object',
        properties: {
          timestamp: { type: 'string', description: 'When this interrupt should occur' },
          type: { type: 'string', description: 'Type: visual_change, tone_shift, b_roll, on_screen_text, sound_effect, direct_address, humor' },
          description: { type: 'string', description: 'What changes and why it re-engages attention' },
        },
        required: ['timestamp', 'type', 'description'],
      },
      minItems: 4,
    },
    emotionalArc: {
      type: 'object',
      description: 'The emotional journey of the video',
      properties: {
        structure: { type: 'string', description: 'Overall arc e.g. Problem → Struggle → Discovery → Transformation' },
        beats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string', description: 'Phase name' },
              emotion: { type: 'string', description: 'Target emotion' },
              timestamp: { type: 'string', description: 'Approximate timestamp range' },
              description: { type: 'string', description: 'What happens emotionally at this phase' },
            },
            required: ['phase', 'emotion', 'timestamp', 'description'],
          },
          minItems: 4,
        },
      },
      required: ['structure', 'beats'],
    },
    ctaPlacement: {
      type: 'array',
      description: 'Strategically placed calls-to-action',
      items: {
        type: 'object',
        properties: {
          timestamp: { type: 'string', description: 'When to place this CTA' },
          type: { type: 'string', description: 'Type: subscribe, like, comment, link, product' },
          script: { type: 'string', description: 'Exact script for the CTA' },
          rationale: { type: 'string', description: 'Why this placement maximizes conversion' },
        },
        required: ['timestamp', 'type', 'script', 'rationale'],
      },
      minItems: 2,
    },
    storyPacing: {
      type: 'object',
      description: 'Pacing strategy for the video',
      properties: {
        overview: { type: 'string', description: 'Overall pacing strategy summary' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Section name e.g. Hook, Setup, Main Content, Climax, Resolution' },
              duration: { type: 'string', description: 'How long this section lasts' },
              pace: { type: 'string', description: 'Pacing descriptor: fast, medium, slow, building, peak' },
              description: { type: 'string', description: 'What happens in this section and how it flows' },
            },
            required: ['name', 'duration', 'pace', 'description'],
          },
          minItems: 4,
        },
      },
      required: ['overview', 'sections'],
    },
    fullOutline: {
      type: 'string',
      description: 'A complete chronological outline incorporating all elements into a cohesive narrative flow. Detailed and actionable, at least 200 words.',
    },
  },
  required: [
    'hookStrategy', 'retentionBeats', 'openLoops', 'patternInterrupts',
    'emotionalArc', 'ctaPlacement', 'storyPacing', 'fullOutline',
  ],
} as const;

@Processor('story-builder', { concurrency: 3 })
export class StoryBuilderProcessor extends WorkerHost {
  private readonly logger = new Logger(StoryBuilderProcessor.name);
  private readonly supabase: SupabaseClient;
  private readonly genAI: GoogleGenAI;

  constructor() {
    super();
    const { url, key } = getSupabaseServiceEnv();
    this.supabase = createSupabaseClient(url, key);
    this.genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });
  }

  async process(job: Job<StoryBuilderJobData>): Promise<{ result: any }> {
    const {
      userId,
      storyJobId,
      videoTopic,
      targetAudience,
      videoDuration,
      contentType,
      tone,
      additionalContext,
      personalized,
    } = job.data;

    await job.updateProgress(0);
    await job.log('Starting story structure generation...');

    try {
      await this.updateJobStatus(storyJobId, 'processing');
      await job.updateProgress(5);

      let styleData: UserStyleData | null = null;
      let channelData: ChannelData | null = null;

      if (personalized) {
        await job.log('Fetching your creator profile for personalized results...');

        const [styleResult, channelResult] = await Promise.all([
          this.supabase
            .from('user_style')
            .select('tone, vocabulary_level, pacing, themes, humor_style, structure, style_analysis, audience_engagement, recommendations')
            .eq('user_id', userId)
            .single(),
          this.supabase
            .from('youtube_channels')
            .select('channel_name, channel_description, topic_details, default_language')
            .eq('user_id', userId)
            .single(),
        ]);

        if (!styleResult.error && styleResult.data) {
          styleData = styleResult.data as UserStyleData;
          await job.log('Creator style profile loaded successfully');
        } else {
          await job.log('No style profile found — generating without personalization');
        }

        if (!channelResult.error && channelResult.data) {
          channelData = channelResult.data as ChannelData;
          await job.log(`Channel context loaded: ${channelData.channel_name || 'unnamed'}`);
        }
      }

      await job.updateProgress(15);

      const durationLabel = VIDEO_DURATION_LABELS[videoDuration];
      const contentLabel = CONTENT_TYPE_LABELS[contentType];

      const prompt = this.buildPrompt(
        videoTopic, targetAudience, durationLabel, contentLabel,
        tone, additionalContext, styleData, channelData,
      );

      await job.updateProgress(20);
      await job.log(styleData
        ? 'Generating personalized story structure with AI...'
        : 'Generating story structure with AI...');

      // Structured output: Gemini returns guaranteed-valid JSON matching STORY_RESPONSE_SCHEMA.
      // No jsonrepair, no markdown fence stripping, no manual field checks needed.
      const response: any = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: STORY_RESPONSE_SCHEMA,
        },
      });

      await job.updateProgress(70);
      await job.log('Parsing AI response...');

      const rawText = response?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('AI returned an empty response');
      }

      const result = JSON.parse(rawText);

      await job.updateProgress(85);
      await job.log('Saving results...');

      await this.supabase
        .from('story_builder_jobs')
        .update({
          status: 'completed',
          result,
          updated_at: new Date().toISOString(),
        })
        .eq('id', storyJobId);

      const { error: creditError } = await this.supabase.rpc('update_user_credits', {
        user_uuid: userId,
        credit_change: -CREDITS_PER_STORY,
      });

      if (creditError) {
        this.logger.error(`Failed to deduct credits for user ${userId}: ${creditError.message}`);
      }

      await this.supabase
        .from('story_builder_jobs')
        .update({ credits_consumed: CREDITS_PER_STORY })
        .eq('id', storyJobId);

      await job.updateProgress(100);
      await job.log('Story structure generated successfully!');

      return { result };
    } catch (error: any) {
      await job.log(`Fatal error: ${error.message}`);
      this.logger.error(`Story builder job ${job.id} failed: ${error.message}`, error.stack);

      await this.supabase
        .from('story_builder_jobs')
        .update({
          status: 'failed',
          error_message: error.message?.slice(0, 5000),
          updated_at: new Date().toISOString(),
        })
        .eq('id', storyJobId);

      throw error;
    }
  }

  private buildPrompt(
    videoTopic: string,
    targetAudience: string,
    durationLabel: string,
    contentLabel: string,
    tone: string,
    additionalContext: string,
    styleData: UserStyleData | null,
    channelData: ChannelData | null,
  ): string {
    const creatorProfileSection = styleData ? `
--- CREATOR'S STYLE PROFILE ---
This creator has trained their AI profile. Use this data to make the story structure match their unique style:
${channelData?.channel_name ? `- Channel: ${channelData.channel_name}` : ''}
${channelData?.channel_description ? `- Channel Description: ${channelData.channel_description}` : ''}
- Content Style Analysis: ${styleData.style_analysis || 'N/A'}
- Typical Tone: ${styleData.tone || 'N/A'}
- Vocabulary Level: ${styleData.vocabulary_level || 'N/A'}
- Pacing Preference: ${styleData.pacing || 'N/A'}
- Content Themes: ${styleData.themes || 'N/A'}
- Humor Style: ${styleData.humor_style || 'N/A'}
- Narrative Structure: ${styleData.structure || 'N/A'}
- Audience Engagement Tactics: ${styleData.audience_engagement?.join(', ') || 'N/A'}
${styleData.recommendations?.story_builder ? `- Story Builder Recommendations: ${styleData.recommendations.story_builder}` : ''}
${styleData.recommendations?.script_generation ? `- Script Style Notes: ${styleData.recommendations.script_generation}` : ''}
${channelData?.topic_details ? `- Channel Topics: ${JSON.stringify(channelData.topic_details)}` : ''}

IMPORTANT: Adapt ALL suggestions (hooks, retention beats, emotional arcs, CTAs, pacing) to match this creator's established style, tone, and audience. The output should feel like it was written specifically for this creator's channel.
---
` : '';

    return `You are an expert YouTube content strategist and story structure consultant. Your job is to help creators plan compelling, high-retention video structures.

Given the following video details, generate a comprehensive story structure blueprint:

**Video Topic:** ${videoTopic}
**Content Type:** ${contentLabel}
**Video Duration:** ${durationLabel}
${targetAudience ? `**Target Audience:** ${targetAudience}` : ''}
${tone ? `**Desired Tone:** ${tone}` : (styleData?.tone ? `**Tone (from creator profile):** ${styleData.tone}` : '')}
${additionalContext ? `**Additional Context:** ${additionalContext}` : ''}
${creatorProfileSection}
Important guidelines:
- Make timestamps realistic for the specified video duration
- Provide at least 4-6 retention beats spread throughout the video
- Include 2-4 open loops with proper setup and payoff timing
- Suggest 4-6 pattern interrupts at natural attention drop-off points
- The emotional arc should have 4-6 distinct phases
- Include 2-3 strategically placed CTAs (never in the first 30 seconds)
- Story pacing should have 4-6 clear sections
- The full outline should be detailed and actionable (at least 200 words)
- All advice should be specific to the video topic, not generic`;
  }

  private async updateJobStatus(jobId: string, status: string) {
    await this.supabase
      .from('story_builder_jobs')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', jobId);
  }
}
