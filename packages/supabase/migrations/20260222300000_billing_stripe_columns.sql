-- Add stripe_customer_id to subscriptions for portal session lookups
ALTER TABLE "public"."subscriptions"
  ADD COLUMN IF NOT EXISTS "stripe_customer_id" text;

-- Add stripe_price_id to plans for Stripe Checkout
ALTER TABLE "public"."plans"
  ADD COLUMN IF NOT EXISTS "stripe_price_id" text;

-- Index for fast customer lookup
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id
  ON public.subscriptions (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON public.subscriptions (user_id, status);

-- Seed the three plans if they don't already exist
INSERT INTO "public"."plans" (name, price_monthly, credits_monthly, features, is_active, stripe_price_id)
VALUES
  ('Starter', 0, 500,
   '["Connect YouTube channel","AI model training","Ideation","Script generation","Thumbnail generation","Subtitle generation","Course Builder"]',
   true, NULL),
  ('Pro', 20, 5000,
   '["Everything in Starter","5k credits/month","Unlimited feature usage","Audio dubbing"]',
   true, NULL),
  ('Enterprise', 499, 100000,
   '["Everything in Pro","100k credits/month","Advanced analytics","Team collaboration","Custom fine-tuned model","Priority support"]',
   true, NULL)
ON CONFLICT (name) DO UPDATE SET
  price_monthly = EXCLUDED.price_monthly,
  credits_monthly = EXCLUDED.credits_monthly,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active;

-- RLS: Plans should be readable by everyone
CREATE POLICY IF NOT EXISTS "Plans are publicly readable"
  ON "public"."plans" FOR SELECT TO public USING (true);

-- RLS: Users can read their own subscriptions
CREATE POLICY IF NOT EXISTS "Users can view own subscriptions"
  ON "public"."subscriptions" FOR SELECT TO public
  USING (auth.uid() = user_id);

-- Service role needs insert/update on subscriptions (webhooks run server-side)
CREATE POLICY IF NOT EXISTS "Service can manage subscriptions"
  ON "public"."subscriptions" FOR ALL TO service_role
  USING (true) WITH CHECK (true);
