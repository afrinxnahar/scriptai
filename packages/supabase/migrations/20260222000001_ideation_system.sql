-- Ideation System: Stores async idea generation jobs with multi-layer pipeline results
create table "public"."ideation_jobs" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "status" text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
    "context" text,
    "niche_focus" text,
    "idea_count" integer not null default 3 check (idea_count between 1 and 5),
    "auto_mode" boolean not null default false,
    "result" jsonb,
    "trend_snapshot" jsonb,
    "credits_consumed" integer default 0,
    "total_tokens" integer default 0,
    "error_message" text,
    "job_id" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);

alter table "public"."ideation_jobs" enable row level security;

create index idx_ideation_jobs_user_id on public.ideation_jobs using btree (user_id);
create index idx_ideation_jobs_status on public.ideation_jobs using btree (status);
create index idx_ideation_jobs_created_at on public.ideation_jobs using btree (created_at desc);
create unique index ideation_jobs_pkey on public.ideation_jobs using btree (id);

alter table "public"."ideation_jobs" add constraint "ideation_jobs_pkey" PRIMARY KEY using index "ideation_jobs_pkey";
alter table "public"."ideation_jobs" add constraint "ideation_jobs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

create policy "Allow select own ideation jobs"
on "public"."ideation_jobs"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));

create policy "Allow insert ideation jobs"
on "public"."ideation_jobs"
as permissive
for insert
to authenticated
with check ((user_id = auth.uid()));

create policy "Allow update own ideation jobs"
on "public"."ideation_jobs"
as permissive
for update
to authenticated
using ((user_id = auth.uid()));

create policy "Allow delete own ideation jobs"
on "public"."ideation_jobs"
as permissive
for delete
to authenticated
using ((user_id = auth.uid()));

-- Extend user_style with channel intelligence data (populated during AI training)
alter table "public"."user_style"
add column if not exists "channel_intelligence" jsonb default '{}';

-- Allow service role full access for worker processors
create policy "Allow service role full access ideation"
on "public"."ideation_jobs"
as permissive
for all
to service_role
using (true)
with check (true);
