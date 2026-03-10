# Supabase Ownership Migration Plan

## Title

Make `catalogus_admin` the Single Source of Truth for Supabase Backend Infrastructure

## Status

Planned

## Owner

Engineering

## Decision Summary

We are standardizing Supabase backend ownership so that `catalogus_admin` becomes the only canonical repository for:

- database migrations
- SQL and RPC definitions
- RLS policy changes
- triggers
- storage and backend schema changes
- Supabase Edge Functions

The `catalogus` repository will remain a consumer of the shared backend, but it will no longer be the authoritative home for Supabase backend infrastructure.

This is an ownership and workflow migration. It is not intended to change features, runtime behavior, user experience, or platform logic.

## Why This Change Is Needed

At the moment, both repositories point to the same Supabase project:

- `catalogus`
- `catalogus_admin`

However, backend infrastructure is split across both repos:

- `catalogus` contains most historical migrations and shared functions
- `catalogus_admin` contains newer admin-oriented migrations and functions

This creates operational problems:

- migration history is split
- backend deploys are ambiguous
- the Supabase CLI cannot safely deploy from one repo without seeing migration history from the other
- future database work risks drift, duplication, and deployment failure

We already saw this issue in practice:

- `catalogus_admin` had valid pending migrations
- but direct deployment failed because remote migration history existed mostly in `catalogus`

The goal of this migration is to remove that ambiguity permanently.

## Non-Goals

This migration should not:

- introduce new user-facing features
- change UI flows
- change application logic intentionally
- alter SQL behavior beyond what is already deployed
- change public API contracts intentionally
- re-architect the apps themselves
- switch Supabase projects
- merge the repositories

## Expected Outcome

After completion:

- `catalogus_admin` contains the full active Supabase migration history
- `catalogus_admin` contains all active shared Supabase Edge Functions
- all future Supabase backend changes are authored and deployed from `catalogus_admin`
- `catalogus` stops owning backend migration and function source files
- both repos clearly document the ownership boundary
- deployment workflows become simpler and less error-prone

## Current State

### Shared Supabase Project

Both repos point to the same Supabase project:

- project ref: `kakesgsqdjhrbcdhicey`

### Current Backend Ownership Split

#### In `catalogus`

Active migration history currently lives mostly here, including major backend changes such as:

- posts and content schema evolution
- profile and author-related changes
- order, pricing, and security policies
- admin dashboard metrics RPC
- public profiles view
- admin level enforcement policies

Active shared functions currently live here, including:

- `invite-staff-user`
- `translate-post`

#### In `catalogus_admin`

Newer admin and backend changes currently live here, including:

- audit event infrastructure
- content dashboard metrics RPC
- `mpesa-admin`

### Operational Problem

Because both repos describe the same backend history, a deploy from only one repo can fail unless the other repo's migration lineage is also present.

That means current ownership is ambiguous and unsafe.

## Guiding Principles

1. One backend, one source of truth
2. Preserve deployed behavior
3. Preserve migration ordering exactly
4. Do not rename valid migration files
5. Do not change function or SQL logic while migrating ownership
6. Validate before removing anything from `catalogus`
7. Keep rollback simple

## High-Level Strategy

We will do this in two stages:

### Stage 1 - Consolidate

Copy all active backend assets into `catalogus_admin` so it becomes complete and deployable on its own.

### Stage 2 - Decommission

After validation, remove or archive backend ownership artifacts from `catalogus` and document the new workflow.

## Detailed Plan

## Phase A - Ownership Freeze

### Goal

Prevent additional drift while the ownership migration is in progress.

### Actions

- Temporarily stop adding new files under:
  - `catalogus/supabase/migrations`
  - `catalogus/supabase/functions`
  - `catalogus_admin/supabase/migrations`
  - `catalogus_admin/supabase/functions`
- Announce that backend-related changes are paused until ownership migration is complete
- Confirm the target decision:
  - `catalogus_admin` will own Supabase backend infrastructure

### Exit Criteria

- Team alignment exists on ownership
- No new backend changes are being introduced during migration

## Phase B - Backend Asset Inventory

### Goal

Build an exact list of all active backend assets and classify them correctly.

### Actions

#### 1. Inventory active migrations in `catalogus`

Create a complete list of all files under:

- `catalogus/supabase/migrations/*.sql`

Classify them as:

- active and valid
- legacy or archive-only
- non-standard filename
- already deployed remotely
- local-only

#### 2. Inventory active migrations in `catalogus_admin`

Create a complete list of all files under:

- `catalogus_admin/supabase/migrations/*.sql`

Classify them the same way.

#### 3. Inventory all Supabase functions in `catalogus`

List all files under:

- `catalogus/supabase/functions/**`

Identify:

- active functions
- deprecated functions
- shared functions versus app-specific functions

#### 4. Inventory all Supabase functions in `catalogus_admin`

List all files under:

- `catalogus_admin/supabase/functions/**`

#### 5. Compare to remote

From the canonical deployment environment, verify:

- remote migration history
- remote function list
- deployed versions

### Known Current Inventory

#### `catalogus` migrations include

- `20260105_posts_feature.sql`
- `20260106_posts_previous_status.sql`
- `20260107_hero_slides.sql`
- `20260108_profiles_featured.sql`
- `20260109_authors_cpt_fields.sql`
- `20260110_authors_social_links.sql`
- `20260111_atomic_checkout_rpc.sql`
- `20260112_hero_slides_accent_color.sql`
- `20260113_decrement_book_stock.sql`
- `20260114_author_claims.sql`
- `20260115_backfill_authors_from_profiles.sql`
- `20260131_posts_author_profile_fk.sql`
- `20260203_mpesa_mark_order_paid.sql`
- `20260206130000_refresh_books_shop_view.sql`
- `20260206143000_admin_dashboard_metrics_rpc.sql`
- `20260206170000_secure_order_pricing.sql`
- `20260206190000_rls_core_policies.sql`
- `20260206200000_public_profiles_view.sql`
- `20260306101500_admin_levels_and_super_admin_policies.sql`

Also present but non-standard:

- `add_author_columns.sql`
- `fix_author_photos_paths.sql`

#### `catalogus_admin` migrations include

- `20260220123000_add_audit_events.sql`
- `20260310090000_add_content_dashboard_metrics_rpc.sql`

#### `catalogus` functions include

- `invite-staff-user`
- `translate-post`

#### `catalogus_admin` functions include

- `mpesa-admin`

### Exit Criteria

- Full asset inventory exists
- We know exactly what must move
- We know which items must be archived rather than moved

## Phase C - Define Canonical Target Layout

### Goal

Make `catalogus_admin` structurally complete as the new backend source of truth.

### Target Layout

`catalogus_admin` should become the owner of:

- `catalogus_admin/supabase/migrations/`
- `catalogus_admin/supabase/functions/`

Target examples:

- `catalogus_admin/supabase/migrations/20260105_posts_feature.sql`
- `catalogus_admin/supabase/migrations/20260306101500_admin_levels_and_super_admin_policies.sql`
- `catalogus_admin/supabase/migrations/20260220123000_add_audit_events.sql`
- `catalogus_admin/supabase/migrations/20260310090000_add_content_dashboard_metrics_rpc.sql`

Functions:

- `catalogus_admin/supabase/functions/invite-staff-user/**`
- `catalogus_admin/supabase/functions/translate-post/**`
- `catalogus_admin/supabase/functions/mpesa-admin/**`

### Rules

- Preserve filenames exactly
- Preserve timestamps exactly
- Preserve function code exactly
- Do not modify SQL contents as part of relocation
- Do not refactor backend logic during this migration

### Exit Criteria

- Clear target structure agreed before file movement begins

## Phase D - Migrate Migrations into `catalogus_admin`

### Goal

Bring full active migration history into `catalogus_admin`.

### Actions

#### 1. Copy active timestamped migrations from `catalogus`

Move or copy all valid active timestamped SQL files from:

- `catalogus/supabase/migrations/`

into:

- `catalogus_admin/supabase/migrations/`

#### 2. Preserve ordering

Do not alter names or timestamps.

#### 3. Handle non-standard files explicitly

For:

- `add_author_columns.sql`
- `fix_author_photos_paths.sql`

Decide one of the following:

- archive them as non-canonical reference files, or
- convert them into properly timestamped migrations only if they must remain executable

Preferred approach:

- archive unless still required for future environments

#### 4. Ensure no duplicate version conflicts

Check that no two files share conflicting timestamps or duplicate intent.

### Risks

- timestamp collisions
- accidental SQL edits
- accidentally introducing inactive or duplicate migrations into active history

### Exit Criteria

- `catalogus_admin/supabase/migrations/` contains the full valid migration chain
- no missing remote timestamps
- no malformed active migration filenames remain

## Phase E - Migrate Functions into `catalogus_admin`

### Goal

Bring all active shared Edge Functions into `catalogus_admin`.

### Actions

Copy function directories from `catalogus` into `catalogus_admin`:

- `invite-staff-user`
- `translate-post`

Retain:

- `mpesa-admin`

Verify function-level config files remain intact, including:

- `config.toml`
- import paths
- env expectations
- JWT verification settings

### Important Rule

This is a relocation, not a rewrite.
Do not refactor function code during ownership migration.

### Exit Criteria

- `catalogus_admin/supabase/functions/` contains every active shared function
- `catalogus` is no longer required as a source for function deployment

## Phase F - Validate `catalogus_admin` as Complete Backend Owner

### Goal

Prove that backend deployment can be done entirely from `catalogus_admin`.

### Validation Steps

#### Migrations

From `catalogus_admin`:

- run migration history inspection
- confirm all remote-applied versions are represented locally
- confirm local history can be reconciled cleanly with remote

#### Functions

From `catalogus_admin`:

- list remote functions
- confirm migrated functions exist locally
- confirm deploy tooling can operate from this repo only

#### Deployability

Perform a safe validation cycle:

- migration listing succeeds from `catalogus_admin`
- function listing succeeds from `catalogus_admin`
- if needed, redeploy a migrated function from `catalogus_admin` without altering behavior

### Success Criteria

- no dependency remains on `catalogus` for backend deployment
- `catalogus_admin` alone is operationally sufficient

## Phase G - Documentation and Governance

### Goal

Make the new ownership model explicit and durable.

### Add documentation to `catalogus_admin`

Create a backend ownership document that states:

- this repo is the source of truth for Supabase
- all migrations must be added here
- all Edge Functions must be added here
- deployment commands must be run from here
- schema, RPC, RLS, storage, and backend changes belong here

### Add documentation to `catalogus`

Create a consumer-only note that states:

- Supabase backend infrastructure is owned by `catalogus_admin`
- do not add migrations or functions here
- this repo consumes the shared backend only

### Document workflow

Include:

- when to add a migration
- when to add an Edge Function
- when `catalogus` should only consume an RPC or function instead of defining it
- how to deploy
- how to verify remote state

### Exit Criteria

- both repos clearly document ownership
- future contributors can follow the intended model without ambiguity

## Phase H - Decommission Backend Ownership in `catalogus`

### Goal

Remove active backend ownership from `catalogus` safely.

### Actions

Only after validation succeeds:

- remove or archive active migration files from `catalogus`
- remove or archive active function files from `catalogus`
- leave documentation pointing to `catalogus_admin`

Possible softer transition:

- keep archived copies temporarily in a clearly named legacy folder
- add a README warning not to deploy from `catalogus`

### Important Constraint

Do not delete anything from `catalogus` until:

- `catalogus_admin` has full migration history
- `catalogus_admin` has all functions
- deployment validation from `catalogus_admin` succeeds

### Exit Criteria

- `catalogus` no longer behaves like a backend source-of-truth repo
- ownership is fully decommissioned there

## Verification Checklist

## Backend Verification

- [ ] `catalogus_admin` contains full active migration history
- [ ] `catalogus_admin` contains all active shared functions
- [ ] remote migration list can be validated from `catalogus_admin`
- [ ] remote function list can be validated from `catalogus_admin`
- [ ] backend deploy workflow no longer depends on `catalogus`

## Runtime Safety Verification

### `catalogus`

- [ ] home page loads
- [ ] public content routes still fetch data
- [ ] storefront and auth bridge still work
- [ ] checkout-adjacent flows still read backend data correctly

### `catalogus_admin`

- [ ] login works
- [ ] dashboard loads
- [ ] analytics still works
- [ ] publication flows still work
- [ ] staff invite flow still works if applicable
- [ ] any migrated function calls still resolve correctly

## Documentation Verification

- [ ] `catalogus_admin` docs clearly state ownership
- [ ] `catalogus` docs clearly state consumer-only status
- [ ] team deployment instructions updated

## Risks

### Operational Risks

- migrating files with altered timestamps
- accidentally losing migration lineage
- function redeploys missing required secrets or env
- duplicate migrations causing future CLI conflicts
- deleting backend files from `catalogus` before the new workflow is proven

### Behavioral Risks

These should be low if the migration is done correctly, because no logic changes are intended.

Possible behavioral risk only if:

- function code changes unintentionally
- wrong migration set is treated as canonical
- deployment target differs from expected project or env

## Rollback Plan

If validation fails:

1. keep `catalogus` backend files in place
2. do not delete or archive anything from `catalogus`
3. stop the ownership cutover
4. fix `catalogus_admin` completeness first
5. retry validation only after migration and function parity is restored

Because this is an ownership migration, rollback is primarily about:

- preserving file location fallback
- not removing old source-of-truth artifacts too early

## Definition of Done

This migration is complete when:

- `catalogus_admin` contains the complete active Supabase migration history
- `catalogus_admin` contains all active shared Supabase functions
- backend deployment can be done entirely from `catalogus_admin`
- `catalogus` no longer contains active backend ownership artifacts
- both repos clearly document the new ownership model
- smoke tests confirm no feature or platform behavior changed

## Final Recommendation

Proceed with this as a dedicated infrastructure-governance change set, separate from feature work.

This should be treated as:

- an ownership migration
- a deployment workflow fix
- a repository boundary cleanup

It should not be treated as a product feature release.
