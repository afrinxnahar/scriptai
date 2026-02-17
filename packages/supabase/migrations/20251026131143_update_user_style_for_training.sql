-- Migration: Update user_style and profiles for AI training enhancements with RLS

-- Drop existing user_style table to redefine (since no data exists yet)
DROP TABLE IF EXISTS user_style;

-- Recreate user_style with new columns
CREATE TABLE user_style (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tone text null,
  vocabulary_level text null,
  pacing text null,
  themes text null,
  humor_style text null,
  structure text null,
  visual_style text null,
  audience_engagement text[] null,
  narrative_structure text null,
  video_urls text[] null,
  style_analysis text null,
  recommendations JSONB,
  transcripts JSONB,  -- Store transcripts from training videos
  thumbnails JSONB,   -- Store thumbnail URLs from training videos
  content text null,
  embedding extensions.vector(1536) null,  -- Assuming vector extension is enabled
  gemini_input_tokens INTEGER DEFAULT 0,  -- Gemini API input tokens
  gemini_output_tokens INTEGER DEFAULT 0, -- Gemini API output tokens
  elevenlabs_voice_clones_created INTEGER DEFAULT 0, -- Voice cloning attempts
  credits_consumed INTEGER DEFAULT 0,     -- Total credits deducted
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_style_user_id UNIQUE (user_id)
) TABLESPACE pg_default;

-- Trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_style_updated_at
BEFORE UPDATE ON user_style
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index for embedding (HNSW for vector search)
-- Note: The operator class must be qualified with the extensions schema
CREATE INDEX IF NOT EXISTS user_style_embedding_idx ON user_style USING hnsw (embedding extensions.vector_cosine_ops) TABLESPACE pg_default;

-- Add credits column to profiles (if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 1000;

-- Enable RLS on user_style
ALTER TABLE user_style ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_style
CREATE POLICY "Users can view own style" ON user_style
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own style" ON user_style
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own style" ON user_style
FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own style" ON user_style
FOR DELETE USING (auth.uid() = user_id);