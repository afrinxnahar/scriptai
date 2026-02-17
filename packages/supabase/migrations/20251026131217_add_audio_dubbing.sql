-- Migration: Create dubbing_jobs and user_voices tables with RLS for dubbing feature

-- Create user_voices table for storing cloned voices
CREATE TABLE IF NOT EXISTS user_voices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  voice_id TEXT NOT NULL,           -- ElevenLabs voice_id
  name TEXT NOT NULL,               -- e.g., 'My Cloned Voice'
  description TEXT,
  sample_url TEXT,                  -- Audio sample URL from training
  created_at TIMESTAMPTZ DEFAULT NOW(),
  gemini_input_tokens INTEGER DEFAULT 0,  -- Tokens used in training transcription
  gemini_output_tokens INTEGER DEFAULT 0,
  elevenlabs_voice_clones_created INTEGER DEFAULT 0, -- Cloning attempts
  credits_consumed INTEGER DEFAULT 0  -- Credits for voice cloning
);

-- Create dubbing_jobs table for tracking dubbing tasks
CREATE TABLE IF NOT EXISTS dubbing_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  voice_id UUID REFERENCES user_voices(id) ON DELETE SET NULL,  -- Reference pre-cloned voice
  original_file_url TEXT NOT NULL,  -- Supabase Storage URL for uploaded audio/video
  file_type TEXT CHECK (file_type IN ('audio', 'video')) NOT NULL,
  original_language TEXT NOT NULL,  -- e.g., 'en'
  target_language TEXT NOT NULL,    -- e.g., 'es'
  transcript JSONB,                 -- Gemini-extracted or reused from user_style
  translated_transcript JSONB,      -- Gemini-translated version
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')) NOT NULL,
  dubbed_audio_url TEXT,            -- Output URL from ElevenLabs
  dubbed_video_url TEXT,            -- If video input, processed video URL
  processing_duration INTEGER,      -- Seconds, for logging
  elevenlabs_characters_generated INTEGER DEFAULT 0, -- ElevenLabs chars for TTS/dubbing
  credits_consumed INTEGER DEFAULT 0,  -- Total credits deducted
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to dubbing_jobs
CREATE TRIGGER update_dubbing_jobs_updated_at
BEFORE UPDATE ON dubbing_jobs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dubbing_jobs_user_id ON dubbing_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_dubbing_jobs_status ON dubbing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_dubbing_jobs_voice_id ON dubbing_jobs(voice_id);
CREATE INDEX IF NOT EXISTS idx_user_voices_user_id ON user_voices(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE dubbing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_voices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dubbing_jobs
CREATE POLICY "Users can view own dubbing jobs" ON dubbing_jobs
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dubbing jobs" ON dubbing_jobs
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dubbing jobs" ON dubbing_jobs
FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own dubbing jobs" ON dubbing_jobs
FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_voices
CREATE POLICY "Users can view own voices" ON user_voices
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own voices" ON user_voices
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own voices" ON user_voices
FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own voices" ON user_voices
FOR DELETE USING (auth.uid() = user_id);