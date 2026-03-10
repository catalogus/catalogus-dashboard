-- Migration: Author Profile Claiming System
-- Created: 2026-01-14
-- Purpose: Link authors table to profiles table with claim workflow

-- 1. Create claim_status enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'claim_status') then
    create type public.claim_status as enum ('unclaimed', 'pending', 'approved', 'rejected');
  end if;
end $$;

-- 2. Add claim-related columns to authors table
alter table public.authors
  add column if not exists profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists claim_status public.claim_status not null default 'unclaimed',
  add column if not exists claimed_at timestamptz,
  add column if not exists claim_reviewed_at timestamptz,
  add column if not exists claim_reviewed_by uuid references public.profiles(id) on delete set null;

-- 3. Create indexes for efficient queries
create index if not exists authors_profile_id_idx on public.authors(profile_id);
create index if not exists authors_claim_status_idx on public.authors(claim_status);

-- 4. Create unique constraint: one profile can only be linked to one author
create unique index if not exists authors_profile_id_unique
  on public.authors(profile_id)
  where profile_id is not null;

-- 5. Create author_claims audit table for tracking claim history
create table if not exists public.author_claims (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.authors(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status public.claim_status not null,
  claimed_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Create indexes for author_claims table
create index if not exists author_claims_author_id_idx on public.author_claims(author_id);
create index if not exists author_claims_profile_id_idx on public.author_claims(profile_id);
create index if not exists author_claims_status_idx on public.author_claims(status);

-- 7. Enable RLS on author_claims
alter table public.author_claims enable row level security;

-- 8. Create RLS policies for author_claims

-- Users can view their own claims
drop policy if exists "AuthorClaims: users can view own claims" on public.author_claims;
create policy "AuthorClaims: users can view own claims"
  on public.author_claims
  for select
  using (profile_id = auth.uid());

-- Admins can view all claims
drop policy if exists "AuthorClaims: admins can view all" on public.author_claims;
create policy "AuthorClaims: admins can view all"
  on public.author_claims
  for select
  using (public.is_admin());

-- Admins have full access to manage claims
drop policy if exists "AuthorClaims: admins full access" on public.author_claims;
create policy "AuthorClaims: admins full access"
  on public.author_claims
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- 9. Update authors table RLS policies

-- Authors can update their own claimed author record (only certain fields)
-- This will be enforced at application level for which fields can be updated
drop policy if exists "Authors: linked authors can update own record" on public.authors;
create policy "Authors: linked authors can update own record"
  on public.authors
  for update
  using (
    profile_id = auth.uid() and claim_status = 'approved'
  )
  with check (
    profile_id = auth.uid() and claim_status = 'approved'
  );

-- Authors can submit claim requests (update profile_id and claim_status to pending)
-- Note: This policy allows updating unclaimed authors to add profile_id and set status to pending
drop policy if exists "Authors: can submit claims" on public.authors;
create policy "Authors: can submit claims"
  on public.authors
  for update
  using (
    claim_status = 'unclaimed' and profile_id is null
  )
  with check (true);

-- 10. Add trigger to update author_claims.updated_at
create or replace function public.update_author_claims_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_author_claims_updated_at on public.author_claims;
create trigger update_author_claims_updated_at
  before update on public.author_claims
  for each row
  execute function public.update_author_claims_updated_at();

-- Migration complete
