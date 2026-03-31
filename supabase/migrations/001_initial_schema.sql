-- =============================================================================
-- INTERVIEW MONKEY — INITIAL SCHEMA
-- Run this in the Supabase SQL editor or via: supabase db push
-- =============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";  -- pgvector for story similarity search

-- =============================================================================
-- ENUMS
-- =============================================================================

create type user_tier as enum ('core', 'pro', 'prime');
create type candidate_level as enum ('graduate', 'early', 'mid', 'senior', 'director', 'executive');
create type graph_node_type as enum ('role', 'project', 'achievement', 'proof_point', 'stakeholder', 'decision', 'failure', 'lesson', 'signal');
create type question_type as enum ('behavioural', 'competency', 'leadership', 'strategy', 'situational', 'pressure', 'motivational', 'failure', 'conflict', 'ambiguity', 'achievement', 'stakeholder', 'change', 'commercial');
create type pressure_point_type as enum ('gap', 'short_tenure', 'low_metrics', 'limited_leadership', 'apparent_pivot', 'domain_mismatch', 'title_mismatch', 'unexplained_departure', 'over_qualified');
create type pressure_severity as enum ('low', 'medium', 'high');
create type interview_type as enum ('behavioural', 'competency', 'leadership', 'strategy', 'mixed', 'panel');
create type session_type as enum ('mock_ai', 'mock_human', 'live', 'practice');
create type session_status as enum ('pending', 'active', 'paused', 'ended');
create type surface_role as enum ('lead', 'follower');
create type pair_status as enum ('pending', 'active', 'ended');
create type support_density as enum ('minimal', 'standard', 'full');

-- =============================================================================
-- USERS (extends Supabase auth.users)
-- =============================================================================

create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  tier user_tier not null default 'core',
  addons text[] not null default '{}',
  preferred_answer_style text,
  preferred_interview_modes text[] not null default '{}',
  live_workspace_declaration_accepted boolean not null default false,
  live_workspace_declaration_accepted_at timestamptz,
  gdpr_consented_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create user record on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================================================
-- CANDIDATE PROFILES
-- =============================================================================

create table public.candidate_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  raw_cv_text text,
  level candidate_level not null default 'mid',
  headline text,
  skills text[] not null default '{}',
  language_profile jsonb,
  parsing_confidence numeric(3,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- =============================================================================
-- CANDIDATE GRAPH NODES
-- =============================================================================

create table public.candidate_graph_nodes (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.candidate_profiles(id) on delete cascade,
  type graph_node_type not null,
  title text not null,
  description text not null default '',
  context text,
  date_from date,
  date_to date,
  organisation text,
  metrics text[] not null default '{}',
  tags text[] not null default '{}',
  confidence numeric(3,2) not null default 0.8,
  user_verified boolean not null default false,
  linked_node_ids uuid[] not null default '{}',
  embedding vector(1536),  -- for future semantic similarity search
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_graph_nodes_profile on public.candidate_graph_nodes(profile_id);
create index idx_graph_nodes_type on public.candidate_graph_nodes(type);

-- =============================================================================
-- STORIES
-- =============================================================================

create table public.stories (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.candidate_profiles(id) on delete cascade,
  title text not null,
  summary text not null default '',
  context text not null default '',
  challenge text not null default '',
  action text not null default '',
  outcome text not null default '',
  metric text,
  stakeholder_angle text,
  question_fit_tags question_type[] not null default '{}',
  signal_strengths jsonb not null default '{}',
  linked_node_ids uuid[] not null default '{}',
  variants jsonb not null default '[]',
  confidence_score numeric(3,2) not null default 0.7,
  is_overused boolean not null default false,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_stories_profile on public.stories(profile_id);
create index idx_stories_tags on public.stories using gin(question_fit_tags);

-- =============================================================================
-- PRESSURE POINTS
-- =============================================================================

create table public.pressure_points (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.candidate_profiles(id) on delete cascade,
  type pressure_point_type not null,
  title text not null,
  interviewer_concern text not null,
  severity pressure_severity not null default 'medium',
  defense_line text not null,
  recommended_framing text not null,
  proof_points text[] not null default '{}',
  bad_responses_to_avoid text[] not null default '{}',
  drills jsonb not null default '[]',
  interviewer_lenses text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_pressure_points_profile on public.pressure_points(profile_id);

-- =============================================================================
-- JOB PACKS
-- =============================================================================

create table public.job_packs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  profile_id uuid not null references public.candidate_profiles(id) on delete cascade,
  title text not null,
  company text,
  jd_raw text not null,
  role_level candidate_level not null default 'mid',
  interview_type interview_type not null default 'mixed',
  inferred_priorities text[] not null default '{}',
  likely_questions jsonb not null default '[]',
  mapped_story_ids uuid[] not null default '{}',
  pressure_point_ids uuid[] not null default '{}',
  target_signals text[] not null default '{}',
  vocabulary text[] not null default '{}',
  answer_priorities text[] not null default '{}',
  opening_pitch text,
  proof_point_ledger jsonb not null default '[]',
  readiness_scores jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_job_packs_user on public.job_packs(user_id);

-- =============================================================================
-- ANSWER ASSETS
-- =============================================================================

create table public.answer_assets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  pack_id uuid references public.job_packs(id) on delete set null,
  question_text text not null,
  question_type question_type,
  recommended_shape text,
  draft_answer text not null default '',
  transformed_variants jsonb not null default '[]',
  score numeric(3,1),
  linked_story_id uuid references public.stories(id) on delete set null,
  linked_proof_point_ids uuid[] not null default '{}',
  is_saved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_answer_assets_user on public.answer_assets(user_id);
create index idx_answer_assets_pack on public.answer_assets(pack_id);

-- =============================================================================
-- SESSIONS
-- =============================================================================

create table public.sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  pack_id uuid references public.job_packs(id) on delete set null,
  type session_type not null,
  status session_status not null default 'pending',
  transcript jsonb not null default '[]',
  scores jsonb not null default '{}',
  detected_issues text[] not null default '{}',
  recommendations text[] not null default '{}',
  user_self_rating smallint check (user_self_rating between 1 and 10),
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create index idx_sessions_user on public.sessions(user_id);

-- =============================================================================
-- DUAL SURFACE SESSIONS
-- =============================================================================

create table public.dual_surface_sessions (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  pairing_token_hash text not null,
  token_expires_at timestamptz not null,
  lead_device_id text,
  follower_device_id text,
  status pair_status not null default 'pending',
  realtime_channel text not null,
  active_prompt jsonb,
  support_density support_density not null default 'standard',
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

-- Auto-cleanup: tokens expire automatically
create index idx_dual_surface_token on public.dual_surface_sessions(pairing_token_hash);
create index idx_dual_surface_session on public.dual_surface_sessions(session_id);

-- =============================================================================
-- TIER LIMITS VIEW (used by access control)
-- =============================================================================

create or replace view public.tier_limits as
select
  'core'::text as tier,
  3 as max_stories,
  1 as max_packs,
  1 as max_mock_sessions,
  false as signal_engine,
  false as pressure_studio,
  false as dual_surface,
  false as coach_mode
union all
select 'pro', 999, 999, 999, true, true, true, false
union all
select 'prime', 999, 999, 999, true, true, true, true;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

alter table public.users enable row level security;
alter table public.candidate_profiles enable row level security;
alter table public.candidate_graph_nodes enable row level security;
alter table public.stories enable row level security;
alter table public.pressure_points enable row level security;
alter table public.job_packs enable row level security;
alter table public.answer_assets enable row level security;
alter table public.sessions enable row level security;
alter table public.dual_surface_sessions enable row level security;

-- Users can only see their own data
create policy "users_own" on public.users for all using (auth.uid() = id);
create policy "profiles_own" on public.candidate_profiles for all using (auth.uid() = user_id);
create policy "graph_nodes_own" on public.candidate_graph_nodes for all using (
  profile_id in (select id from public.candidate_profiles where user_id = auth.uid())
);
create policy "stories_own" on public.stories for all using (
  profile_id in (select id from public.candidate_profiles where user_id = auth.uid())
);
create policy "pressure_own" on public.pressure_points for all using (
  profile_id in (select id from public.candidate_profiles where user_id = auth.uid())
);
create policy "packs_own" on public.job_packs for all using (auth.uid() = user_id);
create policy "answers_own" on public.answer_assets for all using (auth.uid() = user_id);
create policy "sessions_own" on public.sessions for all using (auth.uid() = user_id);
create policy "dual_surface_own" on public.dual_surface_sessions for all using (auth.uid() = user_id);

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.users for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.candidate_profiles for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.candidate_graph_nodes for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.stories for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.pressure_points for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.job_packs for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.answer_assets for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.sessions for each row execute function public.set_updated_at();

-- =============================================================================
-- GDPR: DATA RETENTION (90-day transcript purge)
-- Run via pg_cron or Supabase scheduled functions
-- =============================================================================

-- Purge transcripts older than 90 days (keeps session metadata, removes PII)
create or replace function public.purge_old_transcripts()
returns void language plpgsql security definer as $$
begin
  update public.sessions
  set transcript = '[]'::jsonb
  where ended_at < now() - interval '90 days'
    and transcript != '[]'::jsonb;
end;
$$;
