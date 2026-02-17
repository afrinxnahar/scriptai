export interface StyleAnalysis {
  style_analysis: string;
  tone: string;
  vocabulary_level: string;
  pacing: string;
  themes: string[];
  humor_style: string;
  narrative_structure: string;
  visual_style: string;
  audience_engagement: string[];
  recommendations: {
    script_generation: string;
    research_topics: string;
    thumbnails: string;
    subtitles: string;
    audio_conversion: string;
  };
}

export interface VideoData {
  id: string;
  title: string;
  description: string;
  tags: string[];
  duration: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
  categoryId: string;
  topicDetails: any;
  thumbnailUrl: string;
  defaultAudioLanguage?: string;
}

export interface ChannelData {
  channel_name: string;
  channel_id: string;
  provider_token: string;
  refresh_token?: string;
  channel_description?: string;
  custom_url?: string;
  country?: string;
  default_language?: string;
  view_count?: number;
  subscriber_count?: number;
  video_count?: number;
  topic_details?: any;
}

export interface Thumbnail {
  videoId: string;
  thumbnailUrl: string;
}

export type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
};

export interface Transcript {
  videoId: string;
  transcriptText: string;
  segments: TranscriptSegment[];
};