-- Drop existing plans table if it exists
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS plans;


CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    price_monthly NUMERIC NOT NULL CHECK (price_monthly >= 0),
    credits_monthly INTEGER NOT NULL CHECK (credits_monthly >= 0),
    features JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert plan data
INSERT INTO plans (name, price_monthly, credits_monthly, features, is_active) VALUES
(
    'Starter',
    0,
    500,
    '[
        {"feature": "Connect YouTube channel", "limit": "unlimited"},
        {"feature": "AI model training", "limit": "limited"},
        {"feature": "New idea research", "limit": "limited"},
        {"feature": "Script generation", "limit": "limited"},
        {"feature": "Thumbnail generation", "limit": "limited"},
        {"feature": "Subtitle generation", "limit": "limited"},
        {"feature": "Course module creation", "limit": "limited"}
    ]'::jsonb,
    true
),
(
    'Pro',
    20,
    5000,
    '[
        {"feature": "Connect YouTube channel", "limit": "unlimited"},
        {"feature": "AI model training", "limit": "unlimited"},
        {"feature": "New idea research", "limit": "unlimited"},
        {"feature": "Script generation", "limit": "unlimited"},
        {"feature": "Thumbnail generation", "limit": "unlimited"},
        {"feature": "Subtitle generation", "limit": "unlimited"},
        {"feature": "Audio dubbing", "limit": "unlimited"}
    ]'::jsonb,
    true
),
(
    'Enterprise',
    0,
    100000,
    '[
        {"feature": "Connect YouTube channel", "limit": "unlimited"},
        {"feature": "AI model training", "limit": "unlimited"},
        {"feature": "New idea research", "limit": "unlimited"},
        {"feature": "Script generation", "limit": "unlimited"},
        {"feature": "Thumbnail generation", "limit": "unlimited"},
        {"feature": "Subtitle generation", "limit": "unlimited"},
        {"feature": "Course module creation", "limit": "unlimited"},
        {"feature": "Audio dubbing", "limit": "unlimited"},
        {"feature": "Advanced analytics", "limit": "included"},
        {"feature": "Team collaboration", "limit": "included"}
    ]'::jsonb,
    true
);

create table public.subscriptions (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  plan_id uuid null,
  stripe_subscription_id text null,
  status text not null default 'active'::text,
  current_period_start timestamp with time zone null,
  current_period_end timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint subscriptions_pkey primary key (id),
  constraint subscriptions_stripe_subscription_id_key unique (stripe_subscription_id),
  constraint subscriptions_plan_id_fkey foreign KEY (plan_id) references plans (id)
) TABLESPACE pg_default;

create trigger handle_subscriptions_updated_at BEFORE
update on subscriptions for EACH row
execute FUNCTION handle_updated_at ();