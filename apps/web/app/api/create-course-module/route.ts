import { GoogleGenAI } from '@google/genai';
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    // Check if OpenAI API key is available on the server
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key is not configured")
      return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 })
    }

    const { topic, description, difficulty, videoCount, references } = await req.json()

    // Validate inputs
    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 })
    }

    // Create Supabase client
    const cookieStore = cookies()
    const supabase = await getSupabaseServer()

    // Get user session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has enough credits
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("user_id", session.user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
    }

    if (profileData.credits < 2) {
      // Course modules cost 2 credits
      return NextResponse.json({ error: "Insufficient credits. Course modules require 2 credits." }, { status: 403 })
    }

    // Generate course module using OpenAI
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
      
      Format the response as a JSON object with the following structure:
      {
        "title": "Course title",
        "description": "Course description",
        "videoCount": number,
        "difficulty": "difficulty level",
        "estimatedDuration": "total duration",
        "videos": [
          {
            "id": 1,
            "title": "Video title",
            "duration": "estimated duration",
            "description": "video description",
            "script": "full script outline"
          },
          ...
        ]
      }
    `
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });

    const courseModuleJson: any = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt || '',
    });


    // Parse the JSON response
    let courseModule
    try {
      courseModule = JSON.parse(courseModuleJson)
    } catch (error) {
      return NextResponse.json({ error: "Failed to parse course module data" }, { status: 500 })
    }

    // Update user credits
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
