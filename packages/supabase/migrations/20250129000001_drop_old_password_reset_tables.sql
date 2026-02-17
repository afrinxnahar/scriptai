-- Migration: Drop old password reset tables (no longer used)
-- We now use profiles table for OTP storage instead

-- Drop cleanup functions first
DROP FUNCTION IF EXISTS cleanup_expired_reset_tokens() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_otps() CASCADE;

-- Drop RLS policies
DROP POLICY IF EXISTS "Service role can manage reset tokens" ON password_reset_tokens;
DROP POLICY IF EXISTS "Users cannot access reset tokens" ON password_reset_tokens;
DROP POLICY IF EXISTS "Users cannot insert reset tokens" ON password_reset_tokens;
DROP POLICY IF EXISTS "Users cannot update reset tokens" ON password_reset_tokens;
DROP POLICY IF EXISTS "Users cannot delete reset tokens" ON password_reset_tokens;

DROP POLICY IF EXISTS "Service role can manage OTPs" ON password_reset_otps;
DROP POLICY IF EXISTS "Users cannot directly access OTPs" ON password_reset_otps;
DROP POLICY IF EXISTS "Users cannot insert OTPs" ON password_reset_otps;
DROP POLICY IF EXISTS "Users cannot update OTPs" ON password_reset_otps;
DROP POLICY IF EXISTS "Users cannot delete OTPs" ON password_reset_otps;

-- Drop indexes
DROP INDEX IF EXISTS idx_password_reset_tokens_token;
DROP INDEX IF EXISTS idx_password_reset_tokens_user_id;
DROP INDEX IF EXISTS idx_password_reset_tokens_email;
DROP INDEX IF EXISTS idx_password_reset_tokens_expires_at;

DROP INDEX IF EXISTS idx_password_reset_otps_email_otp;
DROP INDEX IF EXISTS idx_password_reset_otps_user_id;
DROP INDEX IF EXISTS idx_password_reset_otps_email;
DROP INDEX IF EXISTS idx_password_reset_otps_expires_at;
DROP INDEX IF EXISTS idx_password_reset_otps_verified_expires;

-- Drop tables
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS password_reset_otps CASCADE;

