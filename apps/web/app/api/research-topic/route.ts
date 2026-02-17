import { getSupabaseServer } from '@/lib/supabase/server';
import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { jsonrepair } from "jsonrepair"
import { parseResearchResponse } from '@/lib/parseResponse';

// Define interfaces for type safety
interface ResearchRequest {
  topic?: string;
  context?: string;
  autoResearch: boolean;
}

export interface ResearchData {
  summary: string;
  keyPoints: string[];
  trends: string[];
  questions: string[];
  contentAngles: string[];
  sources: string[];
}

interface ResearchTopicRecord {
  id: string;
  user_id: string;
  topic: string;
  context?: string;
  research_data: ResearchData;
  created_at: string;
  updated_at: string;
}

interface ProfileData {
  credits: number;
  ai_trained: boolean;
}

interface ChannelData {
  channel_name: string;
  channel_description: string | null;
  topic_details: Record<string, any>;
  default_language: string | null;
}

interface StyleData {
  tone: string;
  vocabulary_level: string;
  pacing: string;
  themes: string;
  humor_style: string;
  structure: string;
  style_analysis: string;
  recommendations: Record<string, string>;
}

// GET: Fetch recent research topics for the user
export async function GET(request: Request) {
  const supabase = await getSupabaseServer();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('research_topics')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching recent topics:', error);
      return NextResponse.json({ message: 'Failed to fetch recent topics' }, { status: 500 });
    }

    return NextResponse.json(data as ResearchTopicRecord[]);
  } catch (error: unknown) {
    console.error('Error in GET research-topic:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new research topic
export async function POST(request: Request) {
  const supabase = await getSupabaseServer();

  try {
    const body: ResearchRequest = await request.json();
    const { topic, context, autoResearch } = body;

    if (!autoResearch && !topic) {
      return NextResponse.json({ message: 'Topic is required unless auto-research is enabled' }, { status: 400 });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check credits
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('credits, ai_trained, youtube_connected')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profileData) {
      return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
    }

    if (!profileData.ai_trained && !profileData.youtube_connected) {
      return NextResponse.json({ message: 'AI training and YouTube connection are required' }, { status: 403 });
    }

    const typedProfileData: ProfileData = profileData as ProfileData;

    if (typedProfileData.credits < 1) {
      return NextResponse.json({
        message: 'Insufficient credits. Please upgrade your plan or earn more credits.'
      }, { status: 403 });
    }

    let channelData: ChannelData | null = null;
    let styleData: StyleData | null = null;
    let finalTopic = topic;

    // Fetch channel and style data if autoResearch or ai_trained
    if (autoResearch || typedProfileData.ai_trained) {
      const { data, error } = await supabase
        .from('youtube_channels')
        .select('channel_name, channel_description, topic_details, default_language')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Ignore "no rows" error
        console.error('Error fetching channel data:', error);
      } else {
        channelData = data as ChannelData;
      }

      const { data: style, error: styleError } = await supabase
        .from('user_style')
        .select('tone, vocabulary_level, pacing, themes, humor_style, structure, style_analysis, recommendations')
        .eq('user_id', user.id)
        .single();

      if (styleError && styleError.code !== 'PGRST116') {
        console.error('Error fetching style data:', styleError);
      } else {
        styleData = style as StyleData;
      }
    }

    // Initialize Gemini API
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ message: 'Server configuration error: Missing API key' }, { status: 500 });
    }
    const ai = new GoogleGenAI({ apiKey });

    // Craft prompt for research (enhanced to ensure direct, actual source links in JSON)
    let researchPrompt = autoResearch
      ? `
    As an expert YouTube research analyst, generate a unique, high-engagement research topic and comprehensive research data optimized for a YouTube video. The topic should align perfectly with the user's channel niche, style, content preferences, audience demographics, and current trends to maximize views, retention, and subscriber growth. Draw from real-time web insights on viral strategies, SEO best practices, and creator success stories.

    Creator's Profile (tailor all outputs to this for personalized, industry-level advice):
    - Channel Name: ${channelData?.channel_name || 'Unknown'}
    - Channel Description: ${channelData?.channel_description || 'None'}
    - Topic Details: ${JSON.stringify(channelData?.topic_details) || 'None'}
    - Default Language: ${channelData?.default_language || 'English'}
    - Style Profile:
      - Content Style: ${styleData?.style_analysis || 'None'} – Adapt tone, pacing, and structure accordingly.
      - Typical Tone: ${styleData?.tone || 'conversational'}
      - Vocabulary Level: ${styleData?.vocabulary_level || 'general'}
      - Pacing: ${styleData?.pacing || 'moderate'}
      - Themes: ${styleData?.themes || 'None'}
      - Humor Style: ${styleData?.humor_style || 'None'}
      - Narrative Structure: ${styleData?.structure || 'None'}
      - Recommendations: ${JSON.stringify(styleData?.recommendations) || '{}'}

    ${context ? `Additional Context: Incorporate this to refine the topic and research: ${context}` : ''}

    Ensure the research is actionable for YouTube creators: Include SEO keywords, hook ideas in key points, trend-based content angles for virality, audience questions to boost comments, and angles that drive high watch time. For sources, prioritize 3-5 recent, live valid active URL links from authoritative resources that provide deep, insights about the topic. Base these directly on the grounded search results.

    Return the output as valid JSON with no additional text, comments, markdown or formatting. The JSON should have the following structure:
    {
      "topic": "Engaging, SEO-optimized suggested topic title",
      "research": {
        "summary": "Concise, hook-filled overview tailored to the channel's style",
        "keyPoints": ["Actionable point 1 with YouTube tip", "Point 2 focused on engagement"],
        "trends": ["Current 2025 trend 1 relevant to niche", "Trend 2 with creator examples"],
        "questions": ["Viewer question 1 to spark discussions", "Question 2 for Q&A segments"],
        "contentAngles": ["Video angle 1: Step-by-step guide with thumbnails/hooks", "Angle 2: Case study for inspiration"],
        "sources": ["https://direct-valid-creator-resource-1.com", "https://direct-valid-creator-resource-2.com"]
      }
    }
    `
      : `
    As an expert YouTube research analyst, provide comprehensive, industry-level research data for a YouTube video on the topic "${topic}". Tailor everything to the user's channel niche, style, preferences, and audience needs for maximum impact: Optimize for SEO, viewer retention, viral hooks, and monetization potential. Use real-time insights on trends, tools, and strategies from top creator ecosystems.

    ${typedProfileData.ai_trained ? `
    Creator's Profile (tailor all outputs to this for personalized, industry-level advice):
    - Channel Name: ${channelData?.channel_name || 'Unknown'}
    - Channel Description: ${channelData?.channel_description || 'None'}
    - Topic Details: ${JSON.stringify(channelData?.topic_details) || 'None'}
    - Default Language: ${channelData?.default_language || 'English'}
    - Style Profile:
      - Content Style: ${styleData?.style_analysis || 'None'} – Adapt tone, pacing, and structure accordingly.
      - Typical Tone: ${styleData?.tone || 'conversational'}
      - Vocabulary Level: ${styleData?.vocabulary_level || 'general'}
      - Pacing: ${styleData?.pacing || 'moderate'}
      - Themes: ${styleData?.themes || 'None'}
      - Humor Style: ${styleData?.humor_style || 'None'}
      - Narrative Structure: ${styleData?.structure || 'None'}
      - Recommendations: ${JSON.stringify(styleData?.recommendations) || '{}'}
    ` : ''}

    ${context ? `Additional Context: Incorporate this to refine the research: ${context}` : ''}

    Ensure the research is actionable for YouTube creators: Include SEO keywords, hook ideas in key points, trend-based content angles for virality, audience questions to boost comments, and angles that drive high watch time. For sources, prioritize 3-5 recent, live active valid URL links from authoritative resources that provide deep, industry insights about the specific topic. Base these directly on the grounded search results.

    Return the output as valid JSON with no additional text, comments, markdown or formatting. The JSON should have the following structure:

    {
      "topic": "${topic}",
      "research": {
        "summary": "Concise, hook-filled overview tailored to the channel's style",
        "keyPoints": ["Actionable point 1 with YouTube tip", "Point 2 focused on engagement"],
        "trends": ["Current 2025 trend 1 relevant to niche", "Trend 2 with creator examples"],
        "questions": ["Viewer question 1 to spark discussions", "Question 2 for Q&A segments"],
        "contentAngles": ["Video angle 1: Step-by-step guide with thumbnails/hooks", "Angle 2: Case study for inspiration"],
        "sources": ["https://direct-valid-creator-resource-1.com", "https://direct-valid-creator-resource-2.com"]
      }
    }
    `;

    // Generate research with Gemini (updated with grounding via googleSearch tool)
    const groundingTool = {
      googleSearch: {},
    };

    const config = {
      tools: [groundingTool],
      // Optional: temperature: 1.0 for more factual outputs
    };

    const result: any = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [{ text: researchPrompt }]
      }],
      config,
    });

    const response = parseResearchResponse(result.text);
    if (!response) {
      return NextResponse.json({ message: 'Failed to generate valid research data' }, { status: 500 });
    }

    // Set topic for auto-research case
    if (autoResearch) {
      finalTopic = response.topic;
    }

    // Update credits
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: typedProfileData.credits - 1 })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating credits:', updateError);
      return NextResponse.json({ message: 'Failed to update credits' }, { status: 500 });
    }

    // Save research to database
    const researchRecord: ResearchTopicRecord = {
      id: uuidv4(),
      user_id: user.id,
      topic: finalTopic!,
      context,
      research_data: response.research,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error: insertError } = await supabase
      .from('research_topics')
      .insert(researchRecord)
      .select()
      .single();

    if (insertError) {
      console.error('Error saving research:', insertError);
      return NextResponse.json({ message: `Failed to save research: ${insertError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      id: (data as ResearchTopicRecord).id,
      topic: finalTopic,
      research: response.research,
    });
  } catch (error: unknown) {
    console.error('Error in POST research-topic:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}