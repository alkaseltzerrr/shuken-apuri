-- Shuken Apuri Supabase schema
-- Run this in Supabase SQL Editor before starting backend with Supabase env vars.

create table if not exists public.decks (
  id text primary key,
  title text not null,
  description text not null default '',
  language text not null default '',
  subject text not null default '',
  exam text not null default '',
  difficulty text not null default 'Beginner',
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cards (
  id text primary key,
  deck_id text not null references public.decks(id) on delete cascade,
  front text not null,
  back text not null,
  hint text not null default '',
  example text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cards_deck_id_position
  on public.cards(deck_id, position);

create table if not exists public.deck_progress (
  deck_id text primary key references public.decks(id) on delete cascade,
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
