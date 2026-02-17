import { GoogleGenAI } from "@google/genai";
import { manageAccessToken, validateOAuthEnvironment } from "./token-manager";
import { ChannelData, StyleAnalysis, Thumbnail, Transcript, VideoData } from "@repo/validation";
import axios from "axios";
import { calculateRetryDelay, logError, shouldRetry } from "./error-handler";


// Validation functions
export async function validateInputs(userId: string, videoUrls: string[]): Promise<void> {
  if (!userId || !videoUrls || !Array.isArray(videoUrls) || videoUrls.length < 3) {
    throw new Error('Invalid input: userId and at least 3 video URLs required');
  }
}

export async function validateEnvironment(): Promise<void> {
  const envValidation = validateOAuthEnvironment();
  if (
    !envValidation.isValid ||
    !process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    !process.env.ELEVENLABS_API_KEY
  ) {
    throw new Error('Missing environment variables');
  }
}

// Fetch channel data
export async function fetchChannelData(supabase: any, userId: string): Promise<ChannelData> {
  console.log('Fetching channel data for userId:', userId);
  const { data, error } = await supabase
    .from('youtube_channels')
    .select('channel_name, channel_id, provider_token, refresh_token, channel_description, custom_url, country, default_language, view_count, subscriber_count, video_count, topic_details')
    .eq('user_id', userId)
    .single();
  if (error || !data) {
    console.log(error);
    console.log(data)
    throw new Error('YouTube channel not found');
  }
  return data;
}

// Manage YouTube access token
export async function manageYouTubeToken(
  supabase: any,
  userId: string,
  channelData: ChannelData
): Promise<{ accessToken: string; tokenRefreshed: boolean }> {
  const tokenResult = await manageAccessToken(
    channelData.provider_token,
    channelData.refresh_token || '',
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!
  );
  if (!tokenResult.isValid) {
    throw new Error('YouTube connection expired. Please reconnect.');
  }
  if (tokenResult.tokenRefreshed) {
    await supabase
      .from('youtube_channels')
      .update({ provider_token: tokenResult.accessToken, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
  }
  return { accessToken: tokenResult.accessToken!, tokenRefreshed: tokenResult.tokenRefreshed };
}

// Fetch video data from YouTube API
export async function fetchVideoData(
  videoUrls: string[],
  accessToken: string,
  channelId: string,
  maxRetries = 3
): Promise<VideoData[]> {
  const videoIds = videoUrls
    .map(url => new URL(url).searchParams.get('v') || url.split('/').pop())
    .filter((id): id is string => Boolean(id));
  if (videoIds.length < 3) {
    throw new Error('At least 3 valid YouTube video URLs required');
  }

  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: { part: 'snippet,contentDetails,statistics,topicDetails', id: videoIds.join(','), mine: true },
        headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'ScriptAI/1.0' },
        timeout: 30000,
      });
      const videos = response.data.items;
      console.log('Fetched video data:', videos);
      if (!videos || videos.length < 3) {
        throw new Error('Could not find at least 3 videos');
      }
      for (const video of videos) {
        if (video.snippet.channelId !== channelId) {
          throw new Error(`Video "${video.snippet.title}" does not belong to your channel`);
        }
      }
      return videos.map((item: any): VideoData => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        tags: item.snippet.tags || [],
        duration: item.contentDetails.duration,
        viewCount: parseInt(item.statistics.viewCount, 10) || 0,
        likeCount: parseInt(item.statistics.likeCount, 10) || 0,
        commentCount: parseInt(item.statistics.commentCount, 10) || 0,
        publishedAt: item.snippet.publishedAt,
        categoryId: item.snippet.categoryId,
        topicDetails: item.topicDetails || {},
        thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
        defaultAudioLanguage: item.snippet.defaultAudioLanguage || "en",
      }));
    } catch (error: any) {
      retryCount++;
      if (retryCount >= maxRetries || !shouldRetry(error, retryCount, maxRetries)) {
        logError('train-ai-youtube-api', error, { videoIds, retryCount });
        throw new Error('Failed to fetch video data');
      }
      await new Promise(resolve => setTimeout(resolve, calculateRetryDelay(retryCount)));
    }
  }
  throw new Error('Max retries reached for YouTube API');
}

// Analyze content style with Gemini
export async function analyzeStyle(
  genAI: any,
  channelData: ChannelData,
  videoData: VideoData[],
  videoUrls: string[],
  maxRetries = 3
): Promise<{
  styleAnalysis: StyleAnalysis;
  totalStyleTokens: number;
}> {
  const prompt = `
Analyze the following YouTube channel and video data to extract the creator's content style, which will be used for generating scripts, research topics, thumbnails, subtitles, and audio conversions. Provide a detailed analysis of the following aspects: tone (e.g., conversational, formal), vocabulary level (e.g., simple, technical), pacing (e.g., fast, slow), themes (e.g., educational, entertainment), humor style (e.g., witty, sarcastic), narrative structure (e.g., storytelling, listicle), visual style, thumbnails and descriptions, and audience engagement techniques (e.g., calls to action, audience questions). Additionally, include a comprehensive narrative overview of the creator's overall content style in the style_analysis field, synthesizing all aspects into a cohesive summary.

Channel Data:
- Name: ${channelData.channel_name}
- Description: ${channelData.channel_description || 'None'}
- Custom URL: ${channelData.custom_url || 'None'}
- Country: ${channelData.country || 'Unknown'}
- Default Language: ${channelData.default_language || 'Unknown'}
- View Count: ${channelData.view_count || 0}
- Subscriber Count: ${channelData.subscriber_count || 0}
- Video Count: ${channelData.video_count || 0}
- Topic Details: ${JSON.stringify(channelData.topic_details || {})}

Video Data:
${videoData.map((video, i) => `
Video ${i + 1}:
- URL: ${videoUrls[i]}
- Title: ${video.title}
- Description: ${video.description}
- Tags: ${video.tags.join(', ') || 'None'}
- Duration: ${video.duration}
- View Count: ${video.viewCount}
- Like Count: ${video.likeCount}
- Comment Count: ${video.commentCount}
- Published At: ${video.publishedAt}
- Category ID: ${video.categoryId}
- Topic Details: ${JSON.stringify(video.topicDetails)}
`).join('\n')}
`;

  // Define structured schema
  const schema = {
    type: "object",
    properties: {
      style_analysis: { type: "string" },
      tone: { type: "string" },
      vocabulary_level: { type: "string" },
      pacing: { type: "string" },
      themes: { type: "array", items: { type: "string" } },
      humor_style: { type: "string" },
      narrative_structure: { type: "string" },
      visual_style: { type: "string" },
      audience_engagement: { type: "array", items: { type: "string" } },
      recommendations: {
        type: "object",
        properties: {
          script_generation: { type: "string" },
          research_topics: { type: "string" },
          thumbnails: { type: "string" },
          subtitles: { type: "string" },
          audio_conversion: { type: "string" }
        },
        required: [
          "script_generation",
          "research_topics",
          "thumbnails",
          "subtitles",
          "audio_conversion"
        ]
      }
    },
    required: [
      "style_analysis",
      "tone",
      "vocabulary_level",
      "pacing",
      "themes",
      "humor_style",
      "narrative_structure",
      "visual_style",
      "audience_engagement",
      "recommendations"
    ]
  };

  let styleAnalysis: StyleAnalysis | null = null;
  let totalStyleTokens = 0;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const model = 'gemini-2.5-flash';

      const result = await genAI.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0
        }
      });

      styleAnalysis = JSON.parse(result.text) as StyleAnalysis;

      console.log('Gemini style analysis result:', styleAnalysis);

      if (!styleAnalysis) {
        throw new Error(`Gemini failed to return structured Style Analysis data.`);
      }

      totalStyleTokens += result?.usageMetadata?.totalTokenCount ?? 0;

      if (styleAnalysis) break;
    } catch (error) {
      if (attempt === maxRetries) {
        console.error('❌ analyzeStyle failed after max retries:', error);
        throw new Error('Failed to analyze content style');
      }
      console.warn(`Retrying analyzeStyle... (${attempt}/${maxRetries})`);
      await new Promise(res => setTimeout(res, 2000));
    }
  }

  return { styleAnalysis: styleAnalysis!, totalStyleTokens };
}


// Generate embedding with Gemini
export async function generateEmbedding(
  genAI: any,
  styleAnalysis: StyleAnalysis,
  maxRetries = 3
): Promise<number[]> {

  const styleText = JSON.stringify(styleAnalysis);
  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      const response = await genAI.models.embedContent({
        model: 'gemini-embedding-001',
        contents: styleText,
        config: {
          outputDimensionality: 1536,
          taskType: 'RETRIEVAL_DOCUMENT',
        }
      });

      if (!response?.embeddings) {
        throw new Error('Invalid embedding response');
      }
      const embeddingValues = response?.embeddings[0]?.values;
      if (!embeddingValues) {
        throw new Error('Invalid embedding response');
      }
      const norm = Math.sqrt(embeddingValues.reduce((sum: number, val: number) => sum + val * val, 0));
      return norm > 0 ? embeddingValues.map((val: number) => val / norm) : embeddingValues;
    } catch (error: any) {
      retryCount++;
      if (retryCount >= maxRetries) {
        logError('train-ai-embedding', error, { retryCount });
        throw new Error('Failed to generate embedding');
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  throw new Error('Max retries reached for embedding');
}

// Save style data to Supabase
export async function saveStyleData(
  supabase: any,
  userId: string,
  styleAnalysis: StyleAnalysis,
  embedding: number[],
  videoUrls: string[],
  transcripts: Transcript[],
  thumbnails: Thumbnail[],
  totalConsumedTokens: number
): Promise<void> {
  const geminiCredits = Math.ceil(totalConsumedTokens / 1000);

  console.log(`Credits to consumed: ${geminiCredits}`);

  const { data: profile } = await supabase.from('profiles').select('credits').eq('user_id', userId).single();
  if (profile.credits < geminiCredits) {
    throw new Error('Insufficient credits, Please upgrade your plan.');
  }

  await supabase.from('profiles').update({ credits: profile.credits - geminiCredits, ai_trained: true }).eq('user_id', userId);

  const styleData = {
    user_id: userId,
    tone: styleAnalysis.tone,
    vocabulary_level: styleAnalysis.vocabulary_level,
    pacing: styleAnalysis.pacing,
    themes: Array.isArray(styleAnalysis.themes) ? styleAnalysis.themes.join(', ') : styleAnalysis.themes,
    humor_style: styleAnalysis.humor_style,
    structure: styleAnalysis.narrative_structure,
    visual_style: styleAnalysis.visual_style,
    audience_engagement: Array.isArray(styleAnalysis.audience_engagement)
      ? styleAnalysis.audience_engagement
      : [styleAnalysis.audience_engagement],
    video_urls: videoUrls,
    style_analysis: styleAnalysis.style_analysis,
    recommendations: styleAnalysis.recommendations,
    updated_at: new Date().toISOString(),
    content: JSON.stringify(styleAnalysis),
    embedding,
    transcripts,
    thumbnails,
    gemini_total_tokens: totalConsumedTokens,
    credits_consumed: geminiCredits,
  };

  const { error } = await supabase.from('user_style').upsert(styleData, { onConflict: 'user_id' });
  if (error) {
    logError('train-ai-style-save', error, { userId });
    throw new Error('Failed to save style analysis');
  }
}