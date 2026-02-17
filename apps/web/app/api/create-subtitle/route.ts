import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    // Check if OpenAI API key is available on the server
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key is not configured")
      return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 })
    }

    const { videoUrl, language } = await req.json()

    // Validate inputs
    if (!videoUrl) {
      return NextResponse.json({ error: "Video URL is required" }, { status: 400 })
    }

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

    if (profileData.credits < 1) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 403 })
    }

    // Generate subtitles using OpenAI
    const prompt = `
      Generate accurate SRT format subtitles for a YouTube video with the URL: ${videoUrl}
      
      The video is in ${language || "English"}.
      
      Format the subtitles in proper SRT format with timestamps and sequential numbering.
      
      Example format:
      1
      00:00:01,000 --> 00:00:04,000
      Hello and welcome to this video.
      
      2
      00:00:04,500 --> 00:00:08,000
      Today we're going to talk about an interesting topic.
    `

    // Create OpenAI model - the API key is automatically read from process.env.OPENAI_API_KEY
    const model = openai("gpt-4o")

    const { text: subtitles } = await generateText({
      model,
      prompt,
    })

    // Update user credits
    await supabase
      .from("profiles")
      .update({ credits: profileData.credits - 1 })
      .eq("user_id", session.user.id)

    return NextResponse.json({
      subtitles,
    })
  } catch (error: any) {
    console.error("Error generating subtitles:", error)
    return NextResponse.json({ error: "Failed to generate subtitles", message: error.message }, { status: 500 })
  }
}
