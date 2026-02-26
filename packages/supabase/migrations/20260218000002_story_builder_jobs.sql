-- Story Builder Jobs: Stores async story structure generation requests and results
create table "public"."story_builder_jobs" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "video_topic" text not null,
    "target_audience" text,
    "video_duration" text not null default 'medium' check (video_duration in ('short', 'medium', 'long', 'extended')),
    "content_type" text not null default 'tutorial' check (content_type in ('tutorial', 'vlog', 'review', 'story', 'educational', 'entertainment', 'news')),
    "tone" text,
    "additional_context" text,
    "status" text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed')),
    "result" jsonb,
    "error_message" text,
    "credits_consumed" integer default 0,
    "job_id" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);

alter table "public"."story_builder_jobs" enable row level security;

create index idx_story_builder_jobs_user_id on public.story_builder_jobs using btree (user_id);
create index idx_story_builder_jobs_status on public.story_builder_jobs using btree (status);
create index idx_story_builder_jobs_created_at on public.story_builder_jobs using btree (created_at);
create unique index story_builder_jobs_pkey on public.story_builder_jobs using btree (id);

alter table "public"."story_builder_jobs" add constraint "story_builder_jobs_pkey" PRIMARY KEY using index "story_builder_jobs_pkey";
alter table "public"."story_builder_jobs" add constraint "story_builder_jobs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

create policy "Allow select for own story builder jobs"
on "public"."story_builder_jobs"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));

create policy "Allow insert for authenticated users story builder"
on "public"."story_builder_jobs"
as permissive
for insert
to authenticated
with check ((user_id = auth.uid()));

create policy "Allow update own story builder jobs"
on "public"."story_builder_jobs"
as permissive
for update
to authenticated
using ((user_id = auth.uid()));

create policy "Allow delete own story builder jobs"
on "public"."story_builder_jobs"
as permissive
for delete
to authenticated
using ((user_id = auth.uid()));
