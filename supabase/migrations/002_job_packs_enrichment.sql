-- Migration: add enrichment columns to job_packs
-- New fields from JD analysis (match scoring, gap analysis, experience coaching)
-- and org intelligence engine output.

alter table public.job_packs
  add column if not exists match_score        integer,
  add column if not exists match_rationale    text,
  add column if not exists overlap_areas      text[]  not null default '{}',
  add column if not exists gap_areas          text[]  not null default '{}',
  add column if not exists gap_filling_tips   text[]  not null default '{}',
  add column if not exists experience_card_prompts jsonb not null default '[]',
  add column if not exists org_intel          jsonb;
