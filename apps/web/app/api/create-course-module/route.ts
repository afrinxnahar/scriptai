import { GoogleGenAI } from '@google/genai';
import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

const COURSE_MODULE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Course title' },
    description: { type: 'string', description: 'Course description' },
    videoCount: { type: 'integer', description: 'Number of videos in the course' },
    difficulty: { type: 'string', description: 'Difficulty level' },
    estimatedDuration: { type: 'string', description: 'Total estimated duration' },
    videos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'Video sequence number' },
          title: { type: 'string', description: 'Video title' },
          duration: { type: 'string', description: 'Estimated duration' },
          description: { type: 'string', description: 'Video description' },
          script: { type: 'string', description: 'Full script outline' },
        },
        required: ['id', 'title', 'duration', 'description', 'script'],
      },
      minItems: 1,
    },
  },
  required: ['title', 'description', 'videoCount', 'difficulty', 'estimatedDuration', 'videos'],
} as const;

export async function POST(req: Request) {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("Google Generative AI API key is not configured")
      return NextResponse.json({ error: "API key is not configured" }, { status: 500 })
    };

    const { topic, description, difficulty, videoCount, references } = await req.json()

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 })
    }

    const supabase = await getSupabaseServer()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("user_id", session.user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
    }

    if (profileData.credits < 2) {
      return NextResponse.json({ error: "Insufficient credits. Course modules require 2 credits." }, { status: 403 });
    }

    const prompt = `
      Create a detailed course module outline for a YouTube course on "${topic}".
      
      Additional details:
      - Description: ${description || `A comprehensive course on ${topic}`}
      - Difficulty level: ${difficulty || "intermediate"}
      - Number of videos: ${videoCount || 5}
      ${references ? `- References to include: ${references}` : ""}
      
      For each video in the course, include:
      1. A title
      2. Duration (estimated)
      3. Brief description
      4. A complete script outline with sections for intro, main content, key points, and conclusion
    `;

    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });

    const result: any = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: COURSE_MODULE_SCHEMA,
      },
    });

    const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text ?? result?.text;
    if (!rawText) {
      return NextResponse.json({ error: "AI returned an empty response" }, { status: 500 })
    }

    let courseModule;
    try {
      courseModule = JSON.parse(rawText)
    } catch {
      return NextResponse.json({ error: "Failed to parse course module data" }, { status: 500 })
    }

    await supabase
      .from("profiles")
      .update({ credits: profileData.credits - 2 })
      .eq("user_id", session.user.id)

    return NextResponse.json(courseModule)
  } catch (error: any) {
    console.error("Error generating course module:", error)
    return NextResponse.json({ error: "Failed to generate course module", message: error.message }, { status: 500 })
  }
}
