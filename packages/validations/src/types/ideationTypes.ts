export interface IdeationIdea {
  id: string;
  title: string;
  titleVariations: string[];
  coreTopic: string;
  uniqueAngle: string;
  whyItWorks: string;
  hookAngle: string;
  targetKeywords: string[];
  suggestedFormat: string;
  talkingPoints: string[];
  referenceSignals: { title: string; url: string }[];
  searchIntentSummary: string;
  opportunityScore: number;
  trendMomentum: 'rising' | 'stable' | 'declining';
}

export interface TrendingTopic {
  topic: string;
  momentum: number;
}

export interface CompetitorInsight {
  title: string;
  views: number;
  url: string;
}

export interface TrendSnapshot {
  trendingTopics: TrendingTopic[];
  saturatedTopics: string[];
  earlySignals: string[];
  nicheGaps: string[];
  competitorInsights: CompetitorInsight[];
}

export interface ChannelFit {
  bestFormats: string[];
  contentGaps: string[];
  titlePatterns: string[];
}

export interface IdeationMetadata {
  generatedAt: string;
  creditsConsumed: number;
  totalTokens: number;
}

export interface IdeationResult {
  ideas: IdeationIdea[];
  trendSnapshot: TrendSnapshot;
  channelFit: ChannelFit;
  metadata: IdeationMetadata;
}

export interface ChannelIntelligence {
  topVideos: { id: string; title: string; views: number; likes: number; comments: number }[];
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  titlePatterns: string[];
  titleFingerprints: string[];
  hookPatterns: string[];
  topicClusters: string[];
  uploadFrequencyDays: number;
  bestFormats: string[];
  contentGaps: string[];
}

export interface IdeationJob {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  context?: string;
  niche_focus?: string;
  idea_count: number;
  auto_mode: boolean;
  result?: IdeationResult;
  trend_snapshot?: TrendSnapshot;
  credits_consumed: number;
  total_tokens: number;
  error_message?: string;
  job_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateIdeationBody {
  context?: string;
  nicheFocus?: string;
  ideaCount?: number;
  autoMode?: boolean;
}
