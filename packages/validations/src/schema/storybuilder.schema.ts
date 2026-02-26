import { z } from 'zod';

export const VIDEO_DURATIONS = ['short', 'medium', 'long', 'extended'] as const;
export type VideoDuration = (typeof VIDEO_DURATIONS)[number];

export const VIDEO_DURATION_LABELS: Record<VideoDuration, string> = {
  short: 'Short (under 3 min)',
  medium: 'Medium (3–10 min)',
  long: 'Long (10–30 min)',
  extended: 'Extended (30+ min)',
};

export const CONTENT_TYPES = [
  'educational_breakdown', 'commentary', 'documentary', 'case_study',
  'personal_story', 'listicle', 'tutorial',
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  educational_breakdown: 'Educational Breakdown',
  commentary: 'Commentary',
  documentary: 'Documentary Style',
  case_study: 'Case Study',
  personal_story: 'Personal Story',
  listicle: 'Listicle',
  tutorial: 'Tutorial',
};

export const STORY_MODES = [
  'cinematic', 'high_energy', 'documentary', 'conversational', 'dramatic', 'minimal',
] as const;
export type StoryMode = (typeof STORY_MODES)[number];

export const STORY_MODE_LABELS: Record<StoryMode, string> = {
  cinematic: 'Cinematic',
  high_energy: 'High-Energy',
  documentary: 'Documentary',
  conversational: 'Conversational',
  dramatic: 'Dramatic',
  minimal: 'Minimal',
};

export const AUDIENCE_LEVELS = ['beginner', 'intermediate', 'advanced', 'general'] as const;
export type AudienceLevel = (typeof AUDIENCE_LEVELS)[number];

export const AUDIENCE_LEVEL_LABELS: Record<AudienceLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  general: 'General Audience',
};

export const CreateStoryBuilderSchema = z.object({
  videoTopic: z
    .string()
    .min(3, 'Video topic must be at least 3 characters')
    .max(500, 'Video topic must not exceed 500 characters'),
  ideationId: z.string().uuid().optional(),
  ideaIndex: z.number().int().min(0).optional(),
  targetAudience: z
    .string()
    .max(300, 'Target audience must not exceed 300 characters')
    .optional()
    .or(z.literal('')),
  audienceLevel: z.enum(AUDIENCE_LEVELS).default('general'),
  videoDuration: z.enum(VIDEO_DURATIONS).default('medium'),
  contentType: z.enum(CONTENT_TYPES).default('tutorial'),
  storyMode: z.enum(STORY_MODES).default('conversational'),
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
  personalized: z.boolean().optional().default(true),
});

export type CreateStoryBuilderInput = z.infer<typeof CreateStoryBuilderSchema>;

// ── Structured Blueprint Types ──

export interface BlueprintHook {
  curiosityStatement: string;
  promise: string;
  stakes: string;
  openingLine: string;
  visualSuggestion: string;
  emotionalTrigger: string;
}

export interface BlueprintContext {
  problem: string;
  whyItMatters: string;
  backgroundInfo: string;
}

export interface BlueprintSegment {
  segmentNumber: number;
  title: string;
  microHook: string;
  insight: string;
  transitionTension: string;
  estimatedDuration: string;
}

export interface BlueprintClimax {
  biggestInsight: string;
  unexpectedTwist: string;
  coreValueMoment: string;
}

export interface BlueprintResolution {
  closeLoop: string;
  reinforceTransformation: string;
  softCTA: string;
}

export interface StructuredBlueprint {
  hook: BlueprintHook;
  contextSetup: BlueprintContext;
  escalationSegments: BlueprintSegment[];
  climax: BlueprintClimax;
  resolution: BlueprintResolution;
}

// ── Tension Mapping Types ──

export interface SectionScore {
  section: string;
  curiosityDensity: number;
  emotionalShift: number;
  informationSpike: number;
  overallScore: number;
}

export interface TensionMapping {
  retentionScore: number;
  curiosityLoops: number;
  emotionalPeaks: number;
  predictedDropRisk: 'low' | 'medium' | 'high';
  sectionScores: SectionScore[];
}

// ── Existing elements (kept for backward compat) ──

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

// ── Full Result ──

export interface StoryBuilderResult {
  structuredBlueprint: StructuredBlueprint;
  tensionMapping: TensionMapping;
  retentionBeats: RetentionBeat[];
  openLoops: OpenLoop[];
  patternInterrupts: PatternInterrupt[];
  emotionalArc: EmotionalArc;
  ctaPlacement: CTAPlacement[];
  storyPacing: StoryPacing;
  fullOutline: string;
  detectedContentType?: string;
  storyMode: string;
}

export interface StoryBuilderJobResponse {
  id: string;
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  videoTopic: string;
  videoDuration: VideoDuration;
  contentType: ContentType;
  storyMode: StoryMode;
  audienceLevel: AudienceLevel;
  result?: StoryBuilderResult;
  errorMessage?: string;
  creditsConsumed: number;
  createdAt: string;
}
