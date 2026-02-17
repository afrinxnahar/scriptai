-- Add credits_consumed and target_language columns to subtitle_jobs table
ALTER TABLE "public"."subtitle_jobs" 
ADD COLUMN IF NOT EXISTS "credits_consumed" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "target_language" TEXT;

-- Add check constraint for status to include 'error' status
ALTER TABLE "public"."subtitle_jobs" 
DROP CONSTRAINT IF EXISTS "subtitle_jobs_status_check";

ALTER TABLE "public"."subtitle_jobs" 
ADD CONSTRAINT "subtitle_jobs_status_check" 
CHECK (("status" = ANY (ARRAY['queued'::"text", 'processing'::"text", 'done'::"text", 'failed'::"text", 'error'::"text"])));
