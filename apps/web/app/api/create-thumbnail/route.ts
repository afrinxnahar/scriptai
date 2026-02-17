import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
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

    const { title, description, style } = await req.json()

    // Validate inputs
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Check if user has enough credits
    const cookieStore = cookies()
    const supabase = await getSupabaseServer()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

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

    // Generate thumbnail description using OpenAI
    const prompt = `
      Create a detailed description for a YouTube thumbnail image based on the following:
      
      Title: ${title}
      ${description ? `Description: ${description}` : ""}
      ${style ? `Style: ${style}` : ""}
      
      The description should include:
      1. Main visual elements
      2. Text overlay suggestions (keep it short and impactful)
      3. Color scheme
      4. Composition
      
      Make it eye-catching and optimized for click-through rate.
    `

    // Create OpenAI model - the API key is automatically read from process.env.OPENAI_API_KEY
    const model = openai("gpt-4o")

    const { text: thumbnailDescription } = await generateText({
      model,
      prompt,
    })

    // In a real implementation, you would use this description to generate an actual image
    // For now, we'll just return the description

    // Update user credits
    await supabase
      .from("profiles")
      .update({ credits: profileData.credits - 1 })
      .eq("user_id", session.user.id)

    return NextResponse.json({
      thumbnailDescription,
      // In a real implementation, you would include the image URL here
      imageUrl: "/placeholder.svg?height=720&width=1280",
    })
  } catch (error: any) {
    console.error("Error generating thumbnail:", error)
    return NextResponse.json({ error: "Failed to generate thumbnail", message: error.message }, { status: 500 })
  }
}
