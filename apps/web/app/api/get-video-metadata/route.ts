import { NextResponse } from "next/server";

function extractVideoId(url: string): string | null {
  // Support regular YouTube URLs: youtube.com/watch?v=, youtube.com/embed/, youtube.com/v/, youtu.be/, youtube.com/shorts/
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(youtubeRegex);
  return match && match[1] ? match[1] : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoUrl = searchParams.get("videoUrl");
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error("YouTube API key is not configured.");
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  if (!videoUrl) {
    return NextResponse.json({ error: "videoUrl parameter is missing" }, { status: 400 });
  }

  const videoId = extractVideoId(videoUrl);

  if (!videoId) {
    return NextResponse.json({ error: "Invalid YouTube URL format" }, { status: 400 });
  }

  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;

  try {
    const response = await fetch(apiUrl)
    const data = await response.json();

    if (!response.ok || data.items.length === 0) {
      console.error("YouTube API Error:", data.error?.message || "Video not found");
      return NextResponse.json({ error: "Failed to fetch video details or video not found" }, { status: 404 });
    }

    const snippet = data.items[0].snippet;
    // console.log(snippet)

    const thumbnail = snippet.thumbnails.maxres || snippet.thumbnails.high || snippet.thumbnails.medium;
    return NextResponse.json({
      title: snippet.title,
      thumbnail: thumbnail.url,
    });

  } catch (error) {
    console.error("Network or parsing error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }

}