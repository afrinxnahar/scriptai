-- BASELINE MIGRATION: Captured from production on 2026-02-12
-- Contains all tables, RLS policies, and functions.


create extension if not exists "pgjwt" with schema "extensions";

create extension if not exists "vector" with schema "extensions";


create type "public"."dubbing_status" as enum ('dubbed', 'dubbing', 'failed', 'cloning');

create table "public"."documentation_generations" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "project_name" text not null,
    "files_processed" integer default 0,
    "credits_consumed" integer default 0,
    "status" text not null default 'pending'::text,
    "output_format" text default 'markdown'::text,
    "generation_time" integer,
    "error_message" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."documentation_generations" enable row level security;

create table "public"."dubbing_jobs" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "voice_id" uuid,
    "original_file_url" text not null,
    "file_type" text not null,
    "original_language" text not null,
    "target_language" text not null,
    "transcript" jsonb,
    "translated_transcript" jsonb,
    "status" text not null default 'pending'::text,
    "dubbed_audio_url" text,
    "dubbed_video_url" text,
    "processing_duration" integer,
    "elevenlabs_characters_generated" integer default 0,
    "credits_consumed" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."dubbing_jobs" enable row level security;

create table "public"."dubbing_projects" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "project_id" text not null,
    "original_audio_name" text,
    "target_language" text,
    "dubbed_url" text,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "original_media_url" text,
    "status" dubbing_status not null default 'dubbing'::dubbing_status,
    "credits_consumed" integer,
    "is_video" boolean default false,
    "media_name" text
);


alter table "public"."dubbing_projects" enable row level security;

create table "public"."plans" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" text not null,
    "price_monthly" numeric not null,
    "credits_monthly" integer not null,
    "features" jsonb not null,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP
);


alter table "public"."plans" enable row level security;

create table "public"."profiles" (
    "id" uuid not null,
    "user_id" uuid,
    "full_name" text,
    "email" text,
    "bio" text,
    "credits" integer default 500,
    "ai_trained" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "youtube_connected" boolean default false,
    "avatar_url" text,
    "name" text,
    "language" text not null default 'en'::text,
    "referral_code" character varying(10),
    "referred_by" character varying(10),
    "total_referrals" integer default 0,
    "referral_credits" integer default 0,
    "welcome_email_sent" boolean default false,
    "password_reset_otp" text,
    "password_reset_otp_expires_at" timestamp with time zone,
    "password_reset_otp_attempts" integer default 0,
    "password_reset_otp_verified" boolean default false
);


alter table "public"."profiles" enable row level security;

create table "public"."referrals" (
    "id" uuid not null default gen_random_uuid(),
    "referrer_id" uuid,
    "referred_user_id" uuid,
    "referral_code" character varying(10) not null,
    "status" character varying(20) default 'pending'::character varying,
    "credits_awarded" integer default 0,
    "created_at" timestamp with time zone default now(),
    "completed_at" timestamp with time zone,
    "referred_email" text
);


alter table "public"."referrals" enable row level security;

create table "public"."research_topics" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "topic" text not null,
    "context" text,
    "research_data" jsonb,
    "sources" text[],
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."research_topics" enable row level security;

create table "public"."scripts" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "title" text not null,
    "content" text not null,
    "prompt" text,
    "context" text,
    "tone" text,
    "include_storytelling" boolean default false,
    "reference_links" text,
    "language" text default 'english'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "include_timestamps" boolean not null default false,
    "duration" text
);


alter table "public"."scripts" enable row level security;

create table "public"."subscriptions" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "plan_id" uuid,
    "stripe_subscription_id" text,
    "status" text not null default 'active'::text,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."subscriptions" enable row level security;

create table "public"."subtitle_jobs" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "video_path" text not null,
    "video_url" text,
    "subtitles_json" jsonb,
    "status" text not null default 'queued'::text,
    "language" text not null default 'en'::text,
    "detected_language" text,
    "duration" numeric,
    "error_message" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "target_language" text,
    "filename" text,
    "credits_consumed" integer default 0
);


alter table "public"."subtitle_jobs" enable row level security;

create table "public"."subtitles" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "job_id" uuid not null,
    "subtitle_path" text not null,
    "format" text not null,
    "language" text not null default 'en'::text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."subtitles" enable row level security;

create table "public"."usage_credits" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "credits_used" integer default 0,
    "credits_remaining" integer default 0,
    "period_start" timestamp with time zone default now(),
    "period_end" timestamp with time zone default (now() + '1 mon'::interval),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."usage_credits" enable row level security;

create table "public"."user_settings" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "email_notifications" jsonb default '{"usage_alerts": true, "product_updates": false, "documentation_updates": true}'::jsonb,
    "default_output_format" text default 'markdown'::text,
    "api_key_encrypted" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."user_settings" enable row level security;

create table "public"."user_style" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "tone" text,
    "vocabulary_level" text,
    "pacing" text,
    "themes" text,
    "humor_style" text,
    "structure" text,
    "visual_style" text,
    "audience_engagement" text[],
    "narrative_structure" text,
    "video_urls" text[],
    "style_analysis" text,
    "recommendations" jsonb,
    "transcripts" jsonb,
    "thumbnails" jsonb,
    "content" text,
    "embedding" extensions.vector(1536),
    "credits_consumed" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "gemini_total_tokens" integer not null default 0
);


alter table "public"."user_style" enable row level security;

create table "public"."user_voices" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "voice_id" text not null,
    "name" text not null,
    "description" text,
    "sample_url" text,
    "created_at" timestamp with time zone default now(),
    "gemini_input_tokens" integer default 0,
    "gemini_output_tokens" integer default 0,
    "elevenlabs_voice_clones_created" integer default 0,
    "credits_consumed" integer default 0
);


alter table "public"."user_voices" enable row level security;

create table "public"."youtube_channels" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "channel_id" text not null,
    "channel_name" text,
    "channel_description" text,
    "custom_url" text,
    "country" text,
    "default_language" text,
    "view_count" bigint,
    "subscriber_count" bigint,
    "video_count" bigint,
    "topic_details" jsonb,
    "provider_token" text,
    "refresh_token" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "published_at" timestamp with time zone,
    "thumbnail" text,
    "is_linked" boolean,
    "text_color" text,
    "background_color" text
);


alter table "public"."youtube_channels" enable row level security;

CREATE UNIQUE INDEX documentation_generations_pkey ON public.documentation_generations USING btree (id);

CREATE UNIQUE INDEX dubbing_jobs_pkey ON public.dubbing_jobs USING btree (id);

CREATE UNIQUE INDEX dubbing_projects_pkey ON public.dubbing_projects USING btree (id);

CREATE INDEX idx_dubbing_jobs_status ON public.dubbing_jobs USING btree (status);

CREATE INDEX idx_dubbing_jobs_user_id ON public.dubbing_jobs USING btree (user_id);

CREATE INDEX idx_dubbing_jobs_voice_id ON public.dubbing_jobs USING btree (voice_id);

CREATE INDEX idx_dubbing_projects_status ON public.dubbing_projects USING btree (status);

CREATE INDEX idx_profiles_password_reset_otp ON public.profiles USING btree (email, password_reset_otp) WHERE (password_reset_otp IS NOT NULL);

CREATE INDEX idx_profiles_password_reset_otp_expires_at ON public.profiles USING btree (password_reset_otp_expires_at) WHERE (password_reset_otp_expires_at IS NOT NULL);

CREATE INDEX idx_profiles_referral_code ON public.profiles USING btree (referral_code);

CREATE INDEX idx_referrals_referral_code ON public.referrals USING btree (referral_code);

CREATE INDEX idx_referrals_referred_email ON public.referrals USING btree (referred_email);

CREATE INDEX idx_referrals_referred_user_id ON public.referrals USING btree (referred_user_id);

CREATE INDEX idx_referrals_referrer_id ON public.referrals USING btree (referrer_id);

CREATE INDEX idx_referrals_status ON public.referrals USING btree (status);

CREATE INDEX idx_research_topics_created_at ON public.research_topics USING btree (created_at);

CREATE INDEX idx_research_topics_user_id ON public.research_topics USING btree (user_id);

CREATE INDEX idx_subtitle_jobs_created_at ON public.subtitle_jobs USING btree (created_at DESC);

CREATE INDEX idx_subtitle_jobs_status ON public.subtitle_jobs USING btree (status);

CREATE INDEX idx_subtitle_jobs_user_id ON public.subtitle_jobs USING btree (user_id);

CREATE INDEX idx_subtitles_job_id ON public.subtitles USING btree (job_id);

CREATE INDEX idx_user_voices_user_id ON public.user_voices USING btree (user_id);

CREATE UNIQUE INDEX plans_name_key ON public.plans USING btree (name);

CREATE UNIQUE INDEX plans_pkey ON public.plans USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX profiles_referral_code_key ON public.profiles USING btree (referral_code);

CREATE UNIQUE INDEX referrals_pkey ON public.referrals USING btree (id);

CREATE UNIQUE INDEX referrals_referrer_id_referred_user_id_key ON public.referrals USING btree (referrer_id, referred_user_id);

CREATE UNIQUE INDEX research_topics_pkey ON public.research_topics USING btree (id);

CREATE UNIQUE INDEX scripts_pkey ON public.scripts USING btree (id);

CREATE UNIQUE INDEX subscriptions_pkey ON public.subscriptions USING btree (id);

CREATE UNIQUE INDEX subscriptions_stripe_subscription_id_key ON public.subscriptions USING btree (stripe_subscription_id);

CREATE UNIQUE INDEX subtitle_jobs_pkey ON public.subtitle_jobs USING btree (id);

CREATE UNIQUE INDEX subtitles_pkey ON public.subtitles USING btree (id);

CREATE UNIQUE INDEX unique_user_channel ON public.youtube_channels USING btree (user_id, channel_id);

CREATE UNIQUE INDEX unique_user_style_user_id ON public.user_style USING btree (user_id);

CREATE UNIQUE INDEX usage_credits_pkey ON public.usage_credits USING btree (id);

CREATE UNIQUE INDEX user_settings_pkey ON public.user_settings USING btree (id);

CREATE UNIQUE INDEX user_settings_user_id_key ON public.user_settings USING btree (user_id);

CREATE INDEX user_style_embedding_idx ON public.user_style USING hnsw (embedding extensions.vector_cosine_ops);

CREATE UNIQUE INDEX user_voices_pkey ON public.user_voices USING btree (id);

CREATE UNIQUE INDEX youtube_channels_pkey ON public.youtube_channels USING btree (id);

alter table "public"."documentation_generations" add constraint "documentation_generations_pkey" PRIMARY KEY using index "documentation_generations_pkey";

alter table "public"."dubbing_jobs" add constraint "dubbing_jobs_pkey" PRIMARY KEY using index "dubbing_jobs_pkey";

alter table "public"."dubbing_projects" add constraint "dubbing_projects_pkey" PRIMARY KEY using index "dubbing_projects_pkey";

alter table "public"."plans" add constraint "plans_pkey" PRIMARY KEY using index "plans_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."referrals" add constraint "referrals_pkey" PRIMARY KEY using index "referrals_pkey";

alter table "public"."research_topics" add constraint "research_topics_pkey" PRIMARY KEY using index "research_topics_pkey";

alter table "public"."scripts" add constraint "scripts_pkey" PRIMARY KEY using index "scripts_pkey";

alter table "public"."subscriptions" add constraint "subscriptions_pkey" PRIMARY KEY using index "subscriptions_pkey";

alter table "public"."subtitle_jobs" add constraint "subtitle_jobs_pkey" PRIMARY KEY using index "subtitle_jobs_pkey";

alter table "public"."subtitles" add constraint "subtitles_pkey" PRIMARY KEY using index "subtitles_pkey";

alter table "public"."usage_credits" add constraint "usage_credits_pkey" PRIMARY KEY using index "usage_credits_pkey";

alter table "public"."user_settings" add constraint "user_settings_pkey" PRIMARY KEY using index "user_settings_pkey";

alter table "public"."user_voices" add constraint "user_voices_pkey" PRIMARY KEY using index "user_voices_pkey";

alter table "public"."youtube_channels" add constraint "youtube_channels_pkey" PRIMARY KEY using index "youtube_channels_pkey";

alter table "public"."dubbing_jobs" add constraint "dubbing_jobs_file_type_check" CHECK ((file_type = ANY (ARRAY['audio'::text, 'video'::text]))) not valid;

alter table "public"."dubbing_jobs" validate constraint "dubbing_jobs_file_type_check";

alter table "public"."dubbing_jobs" add constraint "dubbing_jobs_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text]))) not valid;

alter table "public"."dubbing_jobs" validate constraint "dubbing_jobs_status_check";

alter table "public"."dubbing_jobs" add constraint "dubbing_jobs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."dubbing_jobs" validate constraint "dubbing_jobs_user_id_fkey";

alter table "public"."dubbing_jobs" add constraint "dubbing_jobs_voice_id_fkey" FOREIGN KEY (voice_id) REFERENCES user_voices(id) ON DELETE SET NULL not valid;

alter table "public"."dubbing_jobs" validate constraint "dubbing_jobs_voice_id_fkey";

alter table "public"."dubbing_projects" add constraint "dubbing_projects_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."dubbing_projects" validate constraint "dubbing_projects_user_id_fkey";

alter table "public"."plans" add constraint "plans_credits_monthly_check" CHECK ((credits_monthly >= 0)) not valid;

alter table "public"."plans" validate constraint "plans_credits_monthly_check";

alter table "public"."plans" add constraint "plans_name_key" UNIQUE using index "plans_name_key";

alter table "public"."plans" add constraint "plans_price_monthly_check" CHECK ((price_monthly >= (0)::numeric)) not valid;

alter table "public"."plans" validate constraint "plans_price_monthly_check";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_referral_code_key" UNIQUE using index "profiles_referral_code_key";

alter table "public"."profiles" add constraint "profiles_referred_by_fkey" FOREIGN KEY (referred_by) REFERENCES profiles(referral_code) not valid;

alter table "public"."profiles" validate constraint "profiles_referred_by_fkey";

alter table "public"."profiles" add constraint "profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_user_id_fkey";

alter table "public"."referrals" add constraint "referrals_referred_user_id_fkey" FOREIGN KEY (referred_user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."referrals" validate constraint "referrals_referred_user_id_fkey";

alter table "public"."referrals" add constraint "referrals_referrer_id_fkey" FOREIGN KEY (referrer_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."referrals" validate constraint "referrals_referrer_id_fkey";

alter table "public"."referrals" add constraint "referrals_referrer_id_referred_user_id_key" UNIQUE using index "referrals_referrer_id_referred_user_id_key";

alter table "public"."research_topics" add constraint "research_topics_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."research_topics" validate constraint "research_topics_user_id_fkey";

alter table "public"."scripts" add constraint "scripts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."scripts" validate constraint "scripts_user_id_fkey";

alter table "public"."subscriptions" add constraint "subscriptions_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES plans(id) not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_plan_id_fkey";

alter table "public"."subscriptions" add constraint "subscriptions_stripe_subscription_id_key" UNIQUE using index "subscriptions_stripe_subscription_id_key";

alter table "public"."subtitle_jobs" add constraint "subtitle_jobs_status_check" CHECK ((status = ANY (ARRAY['queued'::text, 'processing'::text, 'done'::text, 'failed'::text, 'error'::text]))) not valid;

alter table "public"."subtitle_jobs" validate constraint "subtitle_jobs_status_check";

alter table "public"."subtitle_jobs" add constraint "subtitle_jobs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."subtitle_jobs" validate constraint "subtitle_jobs_user_id_fkey";

alter table "public"."subtitles" add constraint "subtitles_format_check" CHECK ((format = ANY (ARRAY['srt'::text, 'vtt'::text, 'json'::text]))) not valid;

alter table "public"."subtitles" validate constraint "subtitles_format_check";

alter table "public"."subtitles" add constraint "subtitles_job_id_fkey" FOREIGN KEY (job_id) REFERENCES subtitle_jobs(id) ON DELETE CASCADE not valid;

alter table "public"."subtitles" validate constraint "subtitles_job_id_fkey";

alter table "public"."user_settings" add constraint "user_settings_user_id_key" UNIQUE using index "user_settings_user_id_key";

alter table "public"."user_style" add constraint "unique_user_style_user_id" UNIQUE using index "unique_user_style_user_id";

alter table "public"."user_style" add constraint "user_style_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_style" validate constraint "user_style_user_id_fkey";

alter table "public"."user_voices" add constraint "user_voices_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_voices" validate constraint "user_voices_user_id_fkey";

alter table "public"."youtube_channels" add constraint "unique_user_channel" UNIQUE using index "unique_user_channel";

alter table "public"."youtube_channels" add constraint "youtube_channels_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."youtube_channels" validate constraint "youtube_channels_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.award_referral_credits()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    referrer_profile_id UUID;
    current_credits INTEGER;
    current_referral_credits INTEGER;
    current_total_referrals INTEGER;
    credits_to_award INTEGER := 5; -- 5 credits per successful referral
BEGIN
    -- Only process when status changes to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
        -- Get the referrer's profile ID
        referrer_profile_id := NEW.referrer_id;
        
        -- Get current credits, referral credits, and total referrals for the referrer
        SELECT credits, referral_credits, total_referrals 
        INTO current_credits, current_referral_credits, current_total_referrals
        FROM profiles 
        WHERE id = referrer_profile_id;
        
        -- Set defaults if NULL
        current_credits := COALESCE(current_credits, 0);
        current_referral_credits := COALESCE(current_referral_credits, 0);
        current_total_referrals := COALESCE(current_total_referrals, 0);
        
        -- Award credits to BOTH fields and increment total referrals
        UPDATE profiles 
        SET 
            credits = current_credits + credits_to_award,           -- Main credits field
            referral_credits = current_referral_credits + credits_to_award,  -- Referral credits field
            total_referrals = current_total_referrals + 1
        WHERE id = referrer_profile_id;
        
        -- Log the credit award
        RAISE NOTICE '✅ Awarded % credits to referrer % (Profile ID: %). New main credits: %, New referral credits: %, New total referrals: %', 
            credits_to_award, 
            referrer_profile_id, 
            referrer_profile_id,
            current_credits + credits_to_award,
            current_referral_credits + credits_to_award,
            current_total_referrals + 1;
            
    END IF;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_expired_referrals()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE referrals 
    SET status = 'expired' 
    WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_expired_password_reset_otps()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.complete_referral(referral_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  referrer_uuid UUID;
  credits_to_award INTEGER := 5;
BEGIN
  -- Get the referrer ID and update referral status
  UPDATE referrals 
  SET status = 'completed', 
      completed_at = NOW(),
      credits_awarded = credits_to_award
  WHERE id = referral_id 
    AND status = 'pending'
  RETURNING referrer_id INTO referrer_uuid;
  
  -- If referral was updated, award credits to referrer
  IF FOUND THEN
    UPDATE profiles 
    SET referral_credits = referral_credits + credits_to_award
    WHERE user_id = referrer_uuid;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_referral_code()
 RETURNS character varying
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  new_code VARCHAR(10);
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 8-character code
    new_code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = new_code) INTO code_exists;
    
    -- If code doesn't exist, return it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, user_id, name, email, ai_trained)
  values (new.id, new.id, new.raw_user_meta_data->>'name', new.email, false);
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_otp_attempts(p_email text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  update profiles
  set password_reset_otp_attempts = coalesce(password_reset_otp_attempts, 0) + 1
  where lower(email) = lower(p_email)
    and password_reset_otp is not null;
$function$
;

create or replace view "public"."referrals_with_profiles" as  SELECT r.id,
    r.referrer_id,
    r.referred_user_id,
    r.referral_code,
    r.status,
    r.credits_awarded,
    r.created_at,
    r.completed_at,
    p1.email AS referrer_email,
    p1.full_name AS referrer_name,
    p1.referral_code AS referrer_referral_code,
    p2.email AS referred_email,
    p2.full_name AS referred_name,
    p2.referral_code AS referred_referral_code
   FROM ((referrals r
     LEFT JOIN profiles p1 ON ((r.referrer_id = p1.id)))
     LEFT JOIN profiles p2 ON ((r.referred_user_id = p2.id)));


CREATE OR REPLACE FUNCTION public.sync_existing_referral_credits()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    referral_record RECORD;
    referrer_profile_id UUID;
    current_credits INTEGER;
    current_total_referrals INTEGER;
    credits_to_award INTEGER := 5;
    total_awarded INTEGER := 0;
BEGIN
    -- Process all existing completed referrals that haven't been credited
    FOR referral_record IN 
        SELECT r.id, r.referrer_id, r.status, r.credits_awarded
        FROM referrals r
        WHERE r.status = 'completed' 
        AND r.credits_awarded = 0
        ORDER BY r.completed_at
    LOOP
        
        referrer_profile_id := referral_record.referrer_id;
        
        -- Get current credits and total referrals
        SELECT referral_credits, total_referrals 
        INTO current_credits, current_total_referrals
        FROM profiles 
        WHERE id = referrer_profile_id;
        
        -- Set defaults if NULL
        current_credits := COALESCE(current_credits, 0);
        current_total_referrals := COALESCE(current_total_referrals, 0);
        
        -- Award credits and increment total referrals
        UPDATE profiles 
        SET 
            referral_credits = current_credits + credits_to_award,
            total_referrals = current_total_referrals + 1
        WHERE id = referrer_profile_id;
        
        -- Mark this referral as credited
        UPDATE referrals 
        SET credits_awarded = credits_to_award
        WHERE id = referral_record.id;
        
        total_awarded := total_awarded + 1;
        
        RAISE NOTICE '✅ Synced credits for referral %: Awarded % credits to referrer %', 
            referral_record.id, credits_to_award, referrer_profile_id;
            
    END LOOP;
    
    RAISE NOTICE '🎯 Total referrals synced: %', total_awarded;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_credits(user_uuid uuid, credit_change integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE profiles 
  SET credits = credits + credit_change,
      updated_at = NOW()
  WHERE user_id = user_uuid;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_referral_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Allow completion if we're setting referred_user_id at the same time
    -- OR if referred_user_id is already set
    IF NEW.status = 'completed' THEN
        -- Ensure completed_at is set when status is 'completed'
        IF NEW.completed_at IS NULL THEN
            NEW.completed_at := NOW();
        END IF;
        
        -- Ensure credits_awarded is set when status is 'completed'
        IF NEW.credits_awarded IS NULL THEN
            NEW.credits_awarded := 5; -- Default 5 credits
        END IF;
        
        -- Log the completion (fixed logging)
        RAISE NOTICE '✅ Referral % completed successfully', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$function$
;

create policy "Users can create own generations"
on "public"."documentation_generations"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own generations"
on "public"."documentation_generations"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own generations"
on "public"."documentation_generations"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can delete own dubbing jobs"
on "public"."dubbing_jobs"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert own dubbing jobs"
on "public"."dubbing_jobs"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own dubbing jobs"
on "public"."dubbing_jobs"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own dubbing jobs"
on "public"."dubbing_jobs"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Allow insert for authenticated users"
on "public"."dubbing_projects"
as permissive
for insert
to authenticated
with check ((user_id = auth.uid()));


create policy "Allow select for own projects"
on "public"."dubbing_projects"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "Allow authenticator to update profiles"
on "public"."profiles"
as permissive
for update
to authenticator
using (true);


create policy "Allow referral code lookups"
on "public"."profiles"
as permissive
for select
to public
using ((referral_code IS NOT NULL));


create policy "Enable insert for authenticated users only"
on "public"."profiles"
as permissive
for insert
to authenticated
with check (true);


create policy "Users can update their own profile"
on "public"."profiles"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own profile"
on "public"."profiles"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Allow all referral operations"
on "public"."referrals"
as permissive
for all
to public
using (true)
with check (true);


create policy "Allow inserting referrals"
on "public"."referrals"
as permissive
for insert
to public
with check (true);


create policy "Allow updating referrals"
on "public"."referrals"
as permissive
for update
to public
using (true);


create policy "Allow delete own topics"
on "public"."research_topics"
as permissive
for delete
to authenticated
using ((user_id = auth.uid()));


create policy "Allow insert for authenticated users"
on "public"."research_topics"
as permissive
for insert
to authenticated
with check ((user_id = auth.uid()));


create policy "Allow select for own topics"
on "public"."research_topics"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "Users can delete their own scripts"
on "public"."scripts"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own scripts"
on "public"."scripts"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own scripts"
on "public"."scripts"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own scripts"
on "public"."scripts"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can delete own subtitle jobs"
on "public"."subtitle_jobs"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert own subtitle jobs"
on "public"."subtitle_jobs"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own subtitle jobs"
on "public"."subtitle_jobs"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own subtitle jobs"
on "public"."subtitle_jobs"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can insert own subtitles"
on "public"."subtitles"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM subtitle_jobs
  WHERE ((subtitle_jobs.id = subtitles.job_id) AND (subtitle_jobs.user_id = auth.uid())))));


create policy "Users can view own subtitles"
on "public"."subtitles"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM subtitle_jobs
  WHERE ((subtitle_jobs.id = subtitles.job_id) AND (subtitle_jobs.user_id = auth.uid())))));


create policy "Users can update own usage"
on "public"."usage_credits"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own usage"
on "public"."usage_credits"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can insert own settings"
on "public"."user_settings"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own settings"
on "public"."user_settings"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own settings"
on "public"."user_settings"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can delete own style"
on "public"."user_style"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert own style"
on "public"."user_style"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own style"
on "public"."user_style"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own style"
on "public"."user_style"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can delete own voices"
on "public"."user_voices"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert own voices"
on "public"."user_voices"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own voices"
on "public"."user_voices"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own voices"
on "public"."user_voices"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own channel data"
on "public"."youtube_channels"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own channel data"
on "public"."youtube_channels"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own channel data"
on "public"."youtube_channels"
as permissive
for select
to public
using ((auth.uid() = user_id));


CREATE TRIGGER handle_documentation_generations_updated_at BEFORE UPDATE ON public.documentation_generations FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_dubbing_jobs_updated_at BEFORE UPDATE ON public.dubbing_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_award_referral_credits AFTER UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION award_referral_credits();

CREATE TRIGGER trigger_validate_referral_completion BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION validate_referral_completion();

CREATE TRIGGER handle_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_subtitle_jobs_updated_at BEFORE UPDATE ON public.subtitle_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER handle_usage_credits_updated_at BEFORE UPDATE ON public.usage_credits FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_user_style_updated_at BEFORE UPDATE ON public.user_style FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

--- Storage buckets
insert into storage.buckets (id, name, public)
values
    ('dubbing_media', 'dubbing_media', true),
    ('user_avatar', 'user_avatar', true),
    ('video_subtitles', 'video_subtitles', true),
    ('assets', 'assets', true),
    ('training-audio', 'training-audio', false);

  create policy "Authenticated users can delete from dubbing_media"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'dubbing_media'::text));



  create policy "Authenticated users can read own uploads (for upsert)"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'dubbing_media'::text));



  create policy "Authenticated users can upload to dubbing_media"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'dubbing_media'::text));



  create policy "Authenticated users can upsert to dubbing_media"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'dubbing_media'::text))
with check ((bucket_id = 'dubbing_media'::text));



  create policy "user can upload there avatar 1o1s1n1_0"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'user_avatar'::text));



    create policy "user can upload there avatar 1o1s1n1_1"
      on "storage"."objects"
      as permissive
      for insert
      to authenticated
      with check (
        (bucket_id = 'user_avatar') AND
        (storage.filename(name) ~* '.*\.(jpg|jpeg|png|gif|bmp|webp)$')
      );



  create policy "user can upload there avatar 1o1s1n1_2"
  on "storage"."objects"
  as permissive
  for update
to authenticated
using (bucket_id = 'user_avatar');



  create policy "user can upload there avatar 1o1s1n1_3"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'user_avatar'::text));



  create policy "user can upload there video for subtitle 16vf3x3_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'video_subtitles'::text));



  create policy "user can upload there video for subtitle 16vf3x3_1"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'video_subtitles'::text));



  create policy "user can upload there video for subtitle 16vf3x3_2"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'video_subtitles'::text));



  create policy "user can upload there video for subtitle 16vf3x3_3"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'video_subtitles'::text));

DROP TRIGGER IF EXISTS "enforce_bucket_name_length_trigger" ON "storage"."buckets";
CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


DROP TRIGGER IF EXISTS "protect_buckets_delete" ON "storage"."buckets";
CREATE TRIGGER protect_buckets_delete
    BEFORE DELETE ON storage.buckets
    FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


DROP TRIGGER IF EXISTS "protect_objects_delete" ON "storage"."objects";
CREATE TRIGGER protect_objects_delete
    BEFORE DELETE ON storage.objects
    FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();

DROP TRIGGER IF EXISTS "update_objects_updated_at" ON "storage"."objects";
CREATE TRIGGER update_objects_updated_at
    BEFORE UPDATE ON storage.objects
    FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();




