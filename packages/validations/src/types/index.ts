export interface UserProfile {
  avatar_url: string
  email: string
  full_name: string
  credits: number
  ai_trained: boolean
  youtube_connected: boolean
  language: string
  referral_code: string | null
}

export interface Script {
  id: string
  title: string
  content?: string
  tone?: string
  language?: string
  created_at: string
  updated_at?: string
  user_id?: string
}

export * from "./SubtitleTypes";