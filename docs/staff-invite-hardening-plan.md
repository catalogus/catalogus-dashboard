# Staff Invite Hardening Plan

## Title

Harden invited staff onboarding so invited admins must set a password before dashboard access.

## Status

Planned

## Goal

Fix the current staff invite flow so that invited admin users:

- do not gain practical dashboard access immediately after clicking the invite email
- must complete password setup first
- are blocked from dashboard routes until setup is completed
- only become normal active admin users after finishing the onboarding step

## Problem Summary

The current flow is too permissive from a UX and access-control perspective.

### What happens now

1. A super admin invites a staff user from `catalogus_admin`
2. The Edge Function sends the Supabase invite email
3. The function immediately upserts a `profiles` row with:
   - `role = admin`
   - `admin_level = super_admin | content_admin`
4. When the invited person clicks the email link, Supabase may establish a valid session
5. The app can treat that person as authenticated before password setup is clearly completed
6. `AuthGuard` redirects authenticated users away from auth routes and toward dashboard routes

### Why this is risky

Even if the invite is not fully unsafe at the platform level, the app behavior is not strict enough.

It currently allows an invited admin to feel effectively logged in before they complete account setup properly.

That creates problems such as:

- confusing UX
- route redirect loops
- "link expired" followed by dashboard access
- invited users appearing fully onboarded before they set a password
- weak separation between invitation and activation

## Desired End State

Invited staff users should experience this flow:

1. Super admin sends invite
2. Invited user clicks invite email
3. User lands on a password setup route
4. User cannot access dashboard routes yet
5. User sets a password successfully
6. App marks invite setup as completed
7. Only then can the user enter the dashboard normally

## Recommended Design

Use a profile-level setup gate.

## Core Mechanism

Add a field to `profiles`:

- `must_set_password boolean not null default false`

### Meaning

- `false` = normal user, no setup gate
- `true` = invited user must complete password setup before being allowed into the dashboard

This is the smallest safe change that works with the current architecture.

## Why This Approach

This approach is recommended because it:

- requires minimal structural change
- keeps the current invite flow mostly intact
- is easy to reason about
- can be enforced in app guards
- avoids a full auth-system redesign
- provides a clear activation state for invited staff

## Scope

## In Scope

- add invite/setup gating field(s)
- update invite edge function
- update auth/profile typing
- restrict dashboard access until setup is complete
- clear setup gate after password is set
- improve invite/reset UX
- add clear micro interactions and feedback during invite acceptance/setup

## Out of Scope

- redesigning the entire auth system
- building a separate invitation token store
- changing Supabase invite mechanics fundamentally
- changing author onboarding unless needed for regression safety
- changing customer auth

## Current Relevant Code

### Invite sender

- `catalogus_admin/src/components/dashboard/usuarios-content.tsx`

### Invite function

- `catalogus_admin/supabase/functions/invite-staff-user/index.ts`

### Auth guard

- `catalogus_admin/src/components/auth-guard.tsx`

### Reset password page

- `catalogus_admin/src/components/auth/reset-password-page.tsx`

### Auth provider/context

- `catalogus_admin/src/lib/auth.tsx`
- `catalogus_admin/src/lib/auth-context.ts`

### Profile types

- `catalogus_admin/src/lib/database.types.ts`

## Implementation Plan

## Phase 1 - Add onboarding gate to profile model

### Goal

Extend the profile model so invited users can be marked as not yet activated.

### Changes

Add a migration in `catalogus_admin/supabase/migrations/` to extend `profiles` with:

- `must_set_password boolean not null default false`

### Optional future-friendly fields

These are optional, but useful if you want better auditability:

- `invited_at timestamptz`
- `invited_by uuid`
- `invite_completed_at timestamptz`

### Recommended first version

Start with only:

- `must_set_password`

### Migration requirements

- existing rows should default safely to `false`
- no existing user should be locked out by migration
- no current admin/author should be forced through setup unexpectedly

### Exit Criteria

- `profiles` schema supports a password-setup gate
- existing users remain unaffected

## Phase 2 - Update generated types

### Goal

Expose the new profile field to the admin app.

### Changes

Regenerate or update types in:

- `catalogus_admin/src/lib/database.types.ts`

Expected new field in `profiles`:

- `must_set_password`

### Exit Criteria

- frontend can read the new gate from profile data safely

## Phase 3 - Change invite function behavior

### Goal

Mark invited staff users as requiring setup.

### File

- `catalogus_admin/supabase/functions/invite-staff-user/index.ts`

### Required behavior change

When inviting a staff user, the profile upsert should include:

- `role = admin`
- `admin_level = chosen level`
- `must_set_password = true`

### Important rule

Do not grant full operational access simply because the invite email was accepted.

The invited profile should be treated as pending setup until password creation is completed.

### Notes

The invite can still create the admin profile now; the app guard will enforce the gate.

### Exit Criteria

- all newly invited staff users are marked `must_set_password = true`

## Phase 4 - Expose the setup gate in auth state

### Goal

Make the app aware of whether the current user must complete setup.

### Files

- `catalogus_admin/src/lib/auth.tsx`
- `catalogus_admin/src/lib/auth-context.ts`

### Changes

Expose profile-derived state such as:

- `mustSetPassword`
- or equivalent derived boolean

This can simply come from:

- `profile?.must_set_password === true`

### Expected use

This state will be consumed by:

- `AuthGuard`
- password setup route
- UI messaging

### Exit Criteria

- auth layer knows whether the user is setup-blocked

## Phase 5 - Harden route guarding

### Goal

Prevent invited admins from using dashboard routes before password setup is complete.

### File

- `catalogus_admin/src/components/auth-guard.tsx`

### New rule

If all are true:

- user is authenticated
- `profile.role === 'admin'`
- `profile.must_set_password === true`

Then allow only:

- `/auth/reset-password`

Block:

- `/`
- `/usuarios`
- `/pedidos`
- all dashboard routes
- any other authenticated CMS route

### Redirect behavior

If a setup-blocked invited admin tries to access any protected route:

- redirect to `/auth/reset-password`

### Preserve existing behavior for

- normal admins
- content admins
- authors
- customer-blocked handling
- ordinary password recovery for existing users

### Key requirement

Do not accidentally break existing admin/author password recovery flows.

### Exit Criteria

- invited admins cannot reach dashboard routes before setting a password

## Phase 6 - Complete invite setup after password update

### Goal

Remove the setup gate only after password creation succeeds.

### File

- `catalogus_admin/src/components/auth/reset-password-page.tsx`

### New behavior after successful password update

After `updatePassword(...)` succeeds:

- clear the profile gate:
  - `must_set_password = false`

### Recommended implementation

Preferred:

- use a dedicated RPC or Edge Function such as:
  - `complete_staff_invite_setup()`
  - or `complete-invite-setup`

Why preferred:

- keeps update logic server-controlled
- avoids over-broad client write permissions
- clearer auditability

Alternative:

- allow the authenticated user to update only their own `must_set_password` field directly via RLS
- only use this if self-row update policy is already safe and explicit

### Recommended post-success UX

Safer option:

- sign the user out
- show success message
- send them to normal login

Why:

- cleaner mental model
- ensures the newly created password is actually used in a real login flow
- avoids weird half-recovery/half-dashboard transitions

Alternative:

- stay signed in and redirect to dashboard after clearing the gate

Recommendation:

- sign out after completion

### Exit Criteria

- password setup successfully clears the gate
- invited admin becomes a normal admin only after setup finishes

## Phase 7 - Improve setup-specific UX and micro interactions

### Goal

Make the invite onboarding flow clear, guided, and reassuring.

### File

- `catalogus_admin/src/components/auth/reset-password-page.tsx`

### UX adjustments

If `must_set_password === true`, show account-activation wording such as:

- title:
  - `Definir senha para activar a conta`
- description:
  - `Antes de aceder ao painel, defina a sua senha.`

### Required feedback states

Add explicit feedback for:

- loading while the invite/setup context is being validated
- invalid or expired invite link
- password requirements not yet met
- password mismatch
- setup completion success
- setup completion failure

### Recommended micro interactions

- password visibility toggles on all password fields
- inline password-strength state updates as user types
- success state after password update with clear next action
- clear redirect copy if the user is being routed to setup
- friendly loading message while session or profile is being checked

### Dialogs and confirmations

Use dialogs only where there is user risk or destructive consequence.

For invite setup specifically, prefer:

- inline validation
- toasts for transient feedback
- success card or persistent success panel for next-step guidance

### Exit Criteria

- invited users understand they are completing onboarding, not just resetting a password

## Phase 8 - Improve invite sender UX in admin

### Goal

Make it obvious to super admins what the invitation does and what the invited user must do.

### File

- `catalogus_admin/src/components/dashboard/usuarios-content.tsx`

### Recommended improvements

- update invite success toast copy to mention password setup is still required
- add helper text near the invite form explaining:
  - the user will receive an email
  - the user must define a password before first access
  - the user will not have dashboard access until setup is completed
- optionally display a badge or status in the users table for:
  - `Setup pendente`

### Optional visibility improvement

If `must_set_password` is available in list data, show a clear pending-setup badge for invited admins.

### Exit Criteria

- super admins understand the invite lifecycle clearly
- invited users with pending setup can be identified operationally

## Phase 9 - Optional audit improvements

### Goal

Improve visibility and supportability later.

### Optional additions

Add fields such as:

- `invited_at`
- `invited_by`
- `invite_completed_at`

Use these for:

- admin audit trail
- support visibility
- reporting on pending invites
- cleaning up stale invited accounts

### Exit Criteria

- optional, not required for the first hardening pass

## Verification Plan

## Automated Verification

Run:

- `pnpm build`
- `pnpm test:run`

in `catalogus_admin`

## Manual Verification Checklist

### Happy path

- [ ] super admin sends invite
- [ ] invited user receives email
- [ ] invited user clicks invite link
- [ ] invited user does not reach dashboard immediately
- [ ] invited user is forced to `/auth/reset-password`
- [ ] invited user sees clear setup guidance, not ambiguous recovery language
- [ ] invited user sets valid password
- [ ] setup gate is cleared
- [ ] invited user is either signed out and asked to log in again, or redirected safely after completion
- [ ] invited user can then log in normally as admin

### Route access restrictions

- [ ] invited admin cannot access `/`
- [ ] invited admin cannot access `/usuarios`
- [ ] invited admin cannot access `/pedidos`
- [ ] invited admin cannot access any other protected dashboard routes before setup completion

### Regression checks

- [ ] existing admin password recovery still works
- [ ] existing author password recovery still works
- [ ] normal admin login is unaffected
- [ ] content admin restrictions still work
- [ ] customer-block logic is unaffected

### Edge cases

- [ ] invite link clicked twice
- [ ] expired invite link
- [ ] invited account already has a session
- [ ] invited user tries to open dashboard URL directly
- [ ] invited user closes browser and returns before finishing setup
- [ ] invited user completes password setup and then refreshes

## Risks

### Main risks

- guard logic may accidentally block legitimate recovery flows for existing users
- `must_set_password` may fail to clear and trap invited admins in setup mode
- auth/profile loading race conditions may cause redirect flicker
- profile write path after password setup may be too permissive if not designed carefully

### Risk mitigation

- keep first version minimal
- use a dedicated completion RPC/function if possible
- test all role types
- do not widen RLS unnecessarily
- release with strong manual QA on invite/recovery flows

## Rollout Order

1. add migration for `must_set_password`
2. update types
3. update invite function to set the flag
4. expose the flag in auth context/profile state
5. update `AuthGuard` to enforce the gate
6. update reset/setup flow to clear the flag
7. improve feedback/micro interactions for invited users and super admins
8. test invite flow end-to-end
9. optionally improve copy and add audit fields

## Definition of Done

This hardening work is complete when:

- invited staff users are marked as requiring password setup
- invited staff users cannot enter the dashboard before setup completion
- successful password setup clears the gate
- normal admin/author recovery remains functional
- invite acceptance no longer feels like immediate unrestricted access
- onboarding feedback is clear enough that users always know what state they are in and what action is expected next

## Final Recommendation

Implement the minimal safe version first:

- `must_set_password`
- invite function sets it to `true`
- auth guard blocks dashboard access while it is `true`
- password setup clears it
- invited user and super admin both get clear micro interactions and feedback throughout the flow

This gives the security and UX hardening needed without redesigning the entire auth system.
