-- Story Builder v2: Add new columns for structure templates, story modes, audience level, and pacing analysis

-- New content types (drop old check, add new)
ALTER TABLE "public"."story_builder_jobs" DROP CONSTRAINT IF EXISTS "story_builder_jobs_content_type_check";
ALTER TABLE "public"."story_builder_jobs" ADD CONSTRAINT "story_builder_jobs_content_type_check"
  CHECK (content_type IN ('educational_breakdown', 'commentary', 'documentary', 'case_study', 'personal_story', 'listicle', 'tutorial'));

-- Update existing rows with old content types to new mapping
UPDATE "public"."story_builder_jobs" SET content_type = 'tutorial' WHERE content_type IN ('vlog', 'review', 'story', 'educational', 'entertainment', 'news');

-- Add new columns
ALTER TABLE "public"."story_builder_jobs"
  ADD COLUMN IF NOT EXISTS "story_mode" text NOT NULL DEFAULT 'conversational'
    CHECK (story_mode IN ('cinematic', 'high_energy', 'documentary', 'conversational', 'dramatic', 'minimal')),
  ADD COLUMN IF NOT EXISTS "audience_level" text NOT NULL DEFAULT 'general'
    CHECK (audience_level IN ('beginner', 'intermediate', 'advanced', 'general')),
  ADD COLUMN IF NOT EXISTS "ideation_id" uuid REFERENCES "public"."ideation_jobs"(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "idea_index" integer,
  ADD COLUMN IF NOT EXISTS "total_tokens" integer DEFAULT 0;

-- Add pacing analysis columns to user_style (populated during AI training)
ALTER TABLE "public"."user_style"
  ADD COLUMN IF NOT EXISTS "script_pacing" jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "humor_frequency" text,
  ADD COLUMN IF NOT EXISTS "direct_address_ratio" numeric,
  ADD COLUMN IF NOT EXISTS "stats_usage" text,
  ADD COLUMN IF NOT EXISTS "emotional_tone" text,
  ADD COLUMN IF NOT EXISTS "avg_segment_length" numeric;

-- Service role full access
CREATE POLICY IF NOT EXISTS "Allow service role full access story_builder"
ON "public"."story_builder_jobs"
AS permissive
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
