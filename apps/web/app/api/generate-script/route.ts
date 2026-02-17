
import { getSupabaseServer } from '@/lib/supabase/server';
import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { parseScriptResponse } from "@/lib/parseResponse";

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

type Part = { text: string } | { fileData: { fileUri: string; mimeType: string } };

interface ScriptRequest {
  prompt: string;
  context?: string;
  tone?: string;
  includeStorytelling: boolean;
  includeTimestamps: boolean;
  duration: string;
  references?: string;
  language: string;
  personalized: boolean;
  files: { path: string; relativePath?: string }[];
}

interface ProfileData {
  credits: number;
  ai_trained: boolean;
  youtube_connected: boolean;
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

interface ScriptRecord {
  id: string;
  user_id: string;
  title: string;
  content: string;
  prompt: string;
  context?: string;
  tone?: string;
  include_storytelling: boolean;
  duration: string
  include_timestamps: boolean
  reference_links?: string;
  language: string;
  created_at: string;
  updated_at: string;
}


export async function POST(request: Request) {
  const supabase = await getSupabaseServer();

  try {

    const formData = await request.formData();

    // Strings
    const prompt = formData.get("prompt") as string;
    const context = formData.get("context") as string;
    const tone = formData.get("tone") as string;
    const includeStorytelling = formData.get("includeStorytelling") === "true";
    const references = formData.get("references") as string;
    const language = formData.get("language") as string;
    const duration = formData.get("duration") as string;
    const includeTimestamps = formData.get("includeTimestamps") === "true";
    const personalized = formData.get("personalized") === "true";

    // Files
    const files = formData.getAll("files") as File[];

    // console.log("Received files:", files);

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check credits
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('credits, ai_trained, youtube_connected')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profileData) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!profileData.ai_trained && !profileData.youtube_connected) {
      return NextResponse.json({ message: 'AI training and YouTube connection are required' }, { status: 403 });
    }

    const typedProfileData: ProfileData = profileData as ProfileData;

    if (typedProfileData.credits < 1) {
      return NextResponse.json({
        error: 'Insufficient credits. Please upgrade your plan or earn more credits.'
      }, { status: 403 });
    }

    let channelData: ChannelData | null = null;
    let styleData: StyleData | null = null;

    // Fetch channel details if personalized
    if (personalized && typedProfileData.ai_trained) {
      const { data, error } = await supabase
        .from('youtube_channels')
        .select('channel_name, channel_description, topic_details, default_language')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching channel data:', error);
      } else {
        channelData = data as ChannelData;
      }

      // Fetch user style
      const { data: style, error: styleError } = await supabase
        .from('user_style')
        .select('tone, vocabulary_level, pacing, themes, humor_style, structure, style_analysis, recommendations')
        .eq('user_id', user.id)
        .single();

      if (styleError) {
        console.error('Error fetching style data:', styleError);
      } else {
        styleData = style as StyleData;
      }
    }

    // Initialize Gemini API
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.error('Google Generative AI API key is missing');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const ai = new GoogleGenAI({ apiKey });


    let geminiPrompt = `
Generate a unique YouTube video script based on the following details:
- Prompt: ${prompt}
- Context: ${context || 'None'}
- Desired Tone: ${tone || styleData?.tone || 'conversational'}
- Language: ${language || channelData?.default_language || 'English'}
- Include Storytelling: ${includeStorytelling}
- Include Timestamps: ${includeTimestamps}
- Duration: ${duration}
- References: ${references || 'None'}


${personalized && styleData ? `
Creator's Style Profile:
- Channel Name: ${channelData?.channel_name || 'Unknown'}
- Channel Description: ${channelData?.channel_description || 'None'}
- Content Style: ${styleData.style_analysis}
- Typical Tone: ${styleData.tone}
- Vocabulary Level: ${styleData.vocabulary_level}
- Pacing: ${styleData.pacing}
- Themes: ${styleData.themes}
- Humor Style: ${styleData.humor_style}
- Narrative Structure: ${styleData.structure}
- Recommendations: ${JSON.stringify(styleData.recommendations)}
` : ''}

Return the output as valid JSON with no additional text, comments, markdown or formatting. The JSON should have the following structure:
{
  "title": "Suggested script title",
  "script": "Full script as a string text here"
}
`;

    const uploadedFiles: any[] = [];
    for (const file of files) {
      // Convert File → Buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Pick a safe path inside OS temp directory
      const tempFilePath = path.join(os.tmpdir(), file.name);

      // Write file to disk
      await fs.writeFile(tempFilePath, buffer);

      // Upload to Google AI
      const myfile = await ai.files.upload({
        file: tempFilePath,
        config: { mimeType: file.type },
      });

      uploadedFiles.push(myfile);
    }

    const parts: Part[] = [{ text: geminiPrompt }];

    for (const uploaded of uploadedFiles) {
      parts.push({ text: `Consider this file as a reference: ${uploaded.name ?? ''}` });
      parts.push({
        fileData: {
          fileUri: uploaded.uri,
          mimeType: uploaded.mimeType,
        },
      });
    }
    // console.log(parts);

    // Generate script with Gemini
    let result: any;
    try {
      result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        // contents: geminiPrompt,
        contents: [{ role: "user", parts }],
      });
    } catch (geminiError) {
      console.error('Gemini API error:', geminiError);
      return NextResponse.json({ error: 'Failed to generate script from Gemini API' }, { status: 500 });
    }

    // Parse the response
    const response = parseScriptResponse(result.text);
    if (!response) {
      console.error('Invalid Gemini response format:', result.text);
      return NextResponse.json({ error: 'Failed to parse Gemini response' }, { status: 500 });
    }

    // Update credits

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: typedProfileData.credits - 1 })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating credits:', updateError);
      return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 });
    }

    // Save script to database

    const { data, error: insertError } = await supabase
      .from('scripts')
      .insert({
        user_id: user.id,
        title: response.title,
        content: response.script,
        prompt,
        context,
        tone,
        include_storytelling: includeStorytelling,
        include_timestamps: includeTimestamps,
        duration: duration,
        reference_links: references,
        language,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as ScriptRecord)
      .select()
      .single();

    if (insertError) {
      console.error('Error saving script:', insertError);
      return NextResponse.json({ error: 'Failed to save script' }, { status: 500 });
    }

    // Return the generated script
    return NextResponse.json({
      id: (data as ScriptRecord).id,
      title: response.title,
      script: response.script
    });
  } catch (error: unknown) {
    console.error('Error in generate-script:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
