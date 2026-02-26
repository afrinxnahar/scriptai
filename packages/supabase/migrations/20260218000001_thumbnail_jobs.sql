-- thumbnail_jobs: Async thumbnail generation requests and results.
-- All file resources (inputs + outputs) live in the "thumbnails" storage bucket
-- organized as: {user_id}/jobs/{job_id}/inputs/  and  {user_id}/jobs/{job_id}/generated/

create table "public"."thumbnail_jobs" (
    "id"                  uuid        not null default extensions.uuid_generate_v4(),
    "user_id"             uuid        not null,
    "prompt"              text        not null,
    "status"              text        not null default 'queued'
                          check (status in ('queued', 'processing', 'completed', 'failed')),
    "ratio"               text        not null default '16:9'
                          check (ratio in ('16:9', '9:16', '1:1', '4:3')),
    "generate_count"      integer     not null default 3
                          check (generate_count between 1 and 5),

    -- Storage URLs (all point to "thumbnails" bucket public URLs)
    "image_urls"          jsonb       not null default '[]'::jsonb,   -- generated output URLs
    "reference_image_url" text,                                       -- user-uploaded style reference
    "face_image_url"      text,                                       -- user-uploaded face / person
    "video_link"          text,                                       -- YouTube / Drive link for context
    "video_frame_url"     text,                                       -- captured frame from video

    "error_message"       text,
    "credits_consumed"    integer     not null default 0,
    "job_id"              text,                                       -- BullMQ job ID for SSE polling
    "created_at"          timestamptz not null default now(),
    "updated_at"          timestamptz not null default now()
);

alter table "public"."thumbnail_jobs" enable row level security;

-- Indexes
create unique index thumbnail_jobs_pkey       on public.thumbnail_jobs using btree (id);
create index idx_thumbnail_jobs_user_id       on public.thumbnail_jobs using btree (user_id);
create index idx_thumbnail_jobs_status        on public.thumbnail_jobs using btree (status);
create index idx_thumbnail_jobs_created_at    on public.thumbnail_jobs using btree (created_at);

-- Constraints
alter table "public"."thumbnail_jobs"
  add constraint "thumbnail_jobs_pkey" PRIMARY KEY using index "thumbnail_jobs_pkey";
alter table "public"."thumbnail_jobs"
  add constraint "thumbnail_jobs_user_id_fkey"
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- RLS policies (row-level)
create policy "select_own"  on "public"."thumbnail_jobs" for select to authenticated using (user_id = auth.uid());
create policy "insert_own"  on "public"."thumbnail_jobs" for insert to authenticated with check (user_id = auth.uid());
create policy "update_own"  on "public"."thumbnail_jobs" for update to authenticated using (user_id = auth.uid());
create policy "delete_own"  on "public"."thumbnail_jobs" for delete to authenticated using (user_id = auth.uid());

-- ─── Storage bucket ───
insert into storage.buckets (id, name, public)
values ('thumbnails', 'thumbnails', true)
on conflict (id) do nothing;

-- Storage policies
-- Authenticated users can upload into their own folder:  {user_id}/jobs/...
create policy "upload_own_thumbnails"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'thumbnails'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Anyone can read (public bucket)
create policy "read_thumbnails"
  on storage.objects for select to public
  using (bucket_id = 'thumbnails');

-- Authenticated users can delete files in their own folder
create policy "delete_own_thumbnails"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'thumbnails'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
