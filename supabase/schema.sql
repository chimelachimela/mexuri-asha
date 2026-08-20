-- Run this in Supabase Dashboard → SQL Editor → New query → Run
-- Sets up all tables, indexes, and row-level security for Asha.

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  use_case text,
  response_style text,
  onboarded boolean default false,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create a profile row the moment someone signs up via Google
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, onboarded)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), false)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- chats ----------
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text default 'New chat',
  title_locked boolean default false,
  survey_draft_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.chats enable row level security;

create policy "Users manage their own chats"
  on public.chats for all using (auth.uid() = user_id);

create index if not exists chats_user_id_idx on public.chats(user_id);

-- ---------- messages ----------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references public.chats(id) on delete cascade not null,
  role text check (role in ('user', 'assistant')) not null,
  text text not null,
  suggest_survey boolean default false,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Users manage messages in their own chats"
  on public.messages for all using (
    exists (select 1 from public.chats where chats.id = messages.chat_id and chats.user_id = auth.uid())
  );

-- ---------- message extras ----------
-- referenced_survey_*: set when a user message references an existing
--   survey from the picker (e.g. "improve this survey: ...").
-- attachment_*: set when a user message has an uploaded document/image.
-- blocks: assistant messages can carry structured content (charts,
--   the in-chat template design-suggestion card) alongside plain text —
--   jsonb array of { type, ...data }, rendered by ChatMessage.jsx.
alter table public.messages
  add column if not exists referenced_survey_id uuid,
  add column if not exists referenced_survey_title text,
  add column if not exists attachment_name text,
  add column if not exists attachment_type text,   -- 'csv' | 'xlsx' | (later: 'pdf' | 'docx' | 'image')
  add column if not exists attachment_summary text, -- compact text handed to the AI, same role as referenced_survey's responseSummary
  add column if not exists attachment_path text,
  add column if not exists blocks jsonb;

create index if not exists messages_chat_id_idx on public.messages(chat_id);

-- ---------- surveys ----------
create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  slug text unique not null,
  title text not null,
  description text,
  cover_color_seed int default 0,
  status text check (status in ('draft', 'published')) default 'draft',
  template_id text default 'stack',
  seen_at timestamptz,
  created_at timestamptz default now()
);

-- Migration for existing databases created before these columns existed:
-- alter table public.surveys add column if not exists template_id text default 'stack';
-- alter table public.surveys add column if not exists seen_at timestamptz;

alter table public.surveys enable row level security;

create policy "Owners manage their own surveys"
  on public.surveys for all using (auth.uid() = user_id);

-- published surveys are readable by anyone (needed for the public /s/:slug page)
create policy "Anyone can read published surveys"
  on public.surveys for select using (status = 'published');

create index if not exists surveys_user_id_idx on public.surveys(user_id);
create index if not exists surveys_slug_idx on public.surveys(slug);

-- ---------- questions ----------
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid references public.surveys(id) on delete cascade not null,
  type text check (type in ('single', 'multi', 'scale', 'text')) not null,
  text text not null,
  options jsonb,
  order_index int default 0
);

-- Migration: if you already ran an earlier version of this file where the
-- column was named `position`, run this once instead of the create table
-- above:
-- alter table public.questions rename column position to order_index;

alter table public.questions enable row level security;

create policy "Owners manage their own survey questions"
  on public.questions for all using (
    exists (select 1 from public.surveys where surveys.id = questions.survey_id and surveys.user_id = auth.uid())
  );

create policy "Anyone can read questions of published surveys"
  on public.questions for select using (
    exists (select 1 from public.surveys where surveys.id = questions.survey_id and surveys.status = 'published')
  );

-- ---------- responses ----------
create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid references public.surveys(id) on delete cascade not null,
  answers jsonb not null,
  submitted_at timestamptz default now()
);

alter table public.responses enable row level security;

create policy "Owners can read responses to their own surveys"
  on public.responses for select using (
    exists (select 1 from public.surveys where surveys.id = responses.survey_id and surveys.user_id = auth.uid())
  );

-- anyone (even logged out) can submit a response to a published survey
create policy "Anyone can submit a response to a published survey"
  on public.responses for insert with check (
    exists (select 1 from public.surveys where surveys.id = responses.survey_id and surveys.status = 'published')
  );

  -- ---------- Asha Sheets ----------
-- rows/columns are the live, editable dataset — copied in at creation time
-- rather than re-read from the source file on every load, so manual edits
-- on the full Sheets page just update this row directly.
create table if not exists public.sheets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  chat_id uuid references public.chats(id) on delete set null,
  title text not null,
  columns jsonb not null,
  rows jsonb not null,
  source_file_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.sheets enable row level security;

create policy "Owners manage their own sheets"
  on public.sheets for all using (auth.uid() = user_id);

create index if not exists sheets_user_id_idx on public.sheets(user_id);
-- Multi-file attachments: an array of every file attached to a message,
-- replacing the old single attachment_* columns for new messages. Old rows
-- keep working — dbService.js falls back to the singular columns when this
-- is null.
alter table public.messages
  add column if not exists attachments jsonb;
-- shape: [{ "fileName": string, "type": string, "summary": string|null, "path": string }, ...]
