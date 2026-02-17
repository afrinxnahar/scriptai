-- Migration: Add OTP fields to profiles table for password reset functionality

-- Add OTP-related columns to profiles table
ALTER TABLE "public"."profiles"
  ADD COLUMN IF NOT EXISTS "password_reset_otp" TEXT,
  ADD COLUMN IF NOT EXISTS "password_reset_otp_expires_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "password_reset_otp_attempts" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "password_reset_otp_verified" BOOLEAN DEFAULT FALSE;

-- Add indexes for faster OTP lookups
CREATE INDEX IF NOT EXISTS idx_profiles_password_reset_otp 
  ON profiles(email, password_reset_otp) 
  WHERE password_reset_otp IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_password_reset_otp_expires_at 
  ON profiles(password_reset_otp_expires_at) 
  WHERE password_reset_otp_expires_at IS NOT NULL;

-- Add comments
COMMENT ON COLUMN profiles.password_reset_otp IS '6-digit OTP code for password reset';
COMMENT ON COLUMN profiles.password_reset_otp_expires_at IS 'OTP expiration timestamp (typically 10 minutes)';
COMMENT ON COLUMN profiles.password_reset_otp_verified IS 'Whether the OTP has been verified';
COMMENT ON COLUMN profiles.password_reset_otp_attempts IS 'Number of verification attempts made';

-- Create a function to automatically clean up expired OTPs from profiles
CREATE OR REPLACE FUNCTION cleanup_expired_password_reset_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clear OTP fields for expired OTPs (older than 24 hours)
  UPDATE profiles
  SET 
    password_reset_otp = NULL,
    password_reset_otp_expires_at = NULL,
    password_reset_otp_attempts = 0,
    password_reset_otp_verified = FALSE
  WHERE password_reset_otp IS NOT NULL
    AND password_reset_otp_expires_at < NOW() - INTERVAL '24 hours';
END;
$$;

COMMENT ON FUNCTION cleanup_expired_password_reset_otps IS 'Cleans up expired OTP data from profiles table';

CREATE OR REPLACE FUNCTION increment_otp_attempts(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET password_reset_otp_attempts = COALESCE(password_reset_otp_attempts, 0) + 1
  WHERE lower(email) = lower(p_email);
END;
$$;

COMMENT ON FUNCTION increment_otp_attempts IS 'Increments OTP verification attempts before locking the request';
