import { z } from 'zod';

export const VIDEO_DURATIONS = ['short', 'medium', 'long', 'extended'] as const;
export type VideoDuration = (typeof VIDEO_DURATIONS)[number];

export const VIDEO_DURATION_LABELS: Record<VideoDuration, string> = {
  short: 'Short (under 3 min)',
  medium: 'Medium (3–10 min)',
  long: 'Long (10–30 min)',
  extended: 'Extended (30+ min)',
};

export const CONTENT_TYPES = ['tutorial', 'vlog', 'review', 'story', 'educational', 'entertainment', 'news'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  tutorial: 'Tutorial',
  vlog: 'Vlog',
  review: 'Review',
  story: 'Storytelling',
  educational: 'Educational',
  entertainment: 'Entertainment',
  news: 'News / Commentary',
};

export const CreateStoryBuilderSchema = z.object({
  videoTopic: z
    .string()
    .min(3, 'Video topic must be at least 3 characters')
    .max(500, 'Video topic must not exceed 500 characters'),
  targetAudience: z
    .string()
    .max(300, 'Target audience must not exceed 300 characters')
    .optional()
    .or(z.literal('')),
  videoDuration: z
    .enum(VIDEO_DURATIONS)
    .default('medium'),
  contentType: z
    .enum(CONTENT_TYPES)
    .default('tutorial'),
  tone: z
    .string()
    .max(200, 'Tone must not exceed 200 characters')
    .optional()
    .or(z.literal('')),
  additionalContext: z
    .string()
    .max(2000, 'Additional context must not exceed 2000 characters')
    .optional()
    .or(z.literal('')),
  personalized: z
    .boolean()
    .optional()
    .default(true),
});

export type CreateStoryBuilderInput = z.infer<typeof CreateStoryBuilderSchema>;

export interface StoryBuilderHook {
  approach: string;
  openingLine: string;
  visualSuggestion: string;
  emotionalTrigger: string;
}

export interface RetentionBeat {
  timestamp: string;
  type: string;
  description: string;
}

export interface OpenLoop {
  setup: string;
  payoffTimestamp: string;
  description: string;
}

export interface PatternInterrupt {
  timestamp: string;
  type: string;
  description: string;
}

export interface EmotionalArcBeat {
  phase: string;
  emotion: string;
  timestamp: string;
  description: string;
}

export interface EmotionalArc {
  structure: string;
  beats: EmotionalArcBeat[];
}

export interface CTAPlacement {
  timestamp: string;
  type: string;
  script: string;
  rationale: string;
}

export interface PacingSection {
  name: string;
  duration: string;
  pace: string;
  description: string;
}

export interface StoryPacing {
  overview: string;
  sections: PacingSection[];
}

export interface StoryBuilderResult {
  hookStrategy: StoryBuilderHook;
  retentionBeats: RetentionBeat[];
  openLoops: OpenLoop[];
  patternInterrupts: PatternInterrupt[];
  emotionalArc: EmotionalArc;
  ctaPlacement: CTAPlacement[];
  storyPacing: StoryPacing;
  fullOutline: string;
}

export interface StoryBuilderJobResponse {
  id: string;
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  videoTopic: string;
  videoDuration: VideoDuration;
  contentType: ContentType;
  result?: StoryBuilderResult;
  errorMessage?: string;
  creditsConsumed: number;
  createdAt: string;
}
