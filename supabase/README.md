# Supabase Ownership

`catalogus_admin` is the source of truth for the shared Supabase backend used by both applications.

This directory owns:

- `supabase/migrations/`
- `supabase/functions/`
- backend SQL and RPC definitions
- RLS policy changes
- trigger changes
- storage and backend schema changes

## Rules

- Add all new Supabase migrations in this repo only.
- Add all new Supabase Edge Functions in this repo only.
- Run backend deployment commands from this repo only.
- Do not add canonical backend migrations or functions in `catalogus`.

## Deployment Workflow

Typical commands run from `catalogus_admin`:

```bash
pnpm dlx supabase migration list
pnpm dlx supabase db push
pnpm dlx supabase functions list
pnpm dlx supabase functions deploy <function-name>
```

## Relationship With `catalogus`

`catalogus` consumes the shared backend but does not own it.

That means `catalogus` may:

- call RPCs
- call Edge Functions
- use generated types or schema outputs
- use Supabase client and server access

But it should not define the canonical migration or function history.
