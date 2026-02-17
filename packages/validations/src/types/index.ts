export interface UserProfile {
  avatar_url: string
  email: string
  full_name: string
  credits: number
  ai_trained: boolean
  youtube_connected: boolean
  language: string
}

export interface Script {
  id: string
  title: string
  created_at: string
}

export * from "./SubtitleTypes";