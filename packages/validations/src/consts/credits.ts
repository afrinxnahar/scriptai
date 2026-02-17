export const TOKENS_PER_CREDIT = 1000;

export const FeatureType = {
  SCRIPT_GENERATION: 'script_generation',
  THUMBNAIL_CREATION: 'thumbnail_creation',
  SUBTITLE_GENERATION: 'subtitle_generation',
  RESEARCH_TOPIC: 'research_topic',
  COURSE_MODULE: 'course_module',
  DUBBING: 'dubbing',
  AI_TRAINING: 'ai_training',
} as const;

export type FeatureType = (typeof FeatureType)[keyof typeof FeatureType];

export interface TokenBasedCreditParams {
  totalTokens: number;
}

export interface ExternalCreditParams {
  externalCreditsUsed: number;
  multiplier?: number;
}

export function calculateCreditsFromTokens(params: TokenBasedCreditParams): number {
  const { totalTokens } = params;
  return Math.max(1, Math.ceil(totalTokens / TOKENS_PER_CREDIT));
}

export function calculateDubbingCredits(params: ExternalCreditParams): number {
  const { externalCreditsUsed, multiplier = 10 } = params;
  return externalCreditsUsed * multiplier;
}

export function hasEnoughCredits(userCredits: number, requiredCredits: number): boolean {
  return userCredits >= requiredCredits;
}

export function getMinimumCreditsForGemini(): number {
  return 1;
}
