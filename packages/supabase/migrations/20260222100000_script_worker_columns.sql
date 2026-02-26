-- Add worker-related columns to scripts table for BullMQ job processing
ALTER TABLE scripts
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS job_id text,
  ADD COLUMN IF NOT EXISTS credits_consumed integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS error_message text;

-- Add index for job lookups
CREATE INDEX IF NOT EXISTS idx_scripts_job_id ON scripts(job_id);
CREATE INDEX IF NOT EXISTS idx_scripts_status ON scripts(status);
