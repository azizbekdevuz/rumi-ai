# 🔐 AUTH PROVIDER INTEGRATION CONTRACT

This document defines the mandatory standards for integrating any OAuth
provider (e.g., Google, Kakao, Apple) into the system.

This is not optional guidance. All rules are enforced during PR review.

------------------------------------------------------------------------

## 1. Architectural Rules (Non-Negotiable)

All new OAuth providers MUST:

-   Use Authorization Code flow (no implicit flow).
-   Mirror the existing Kakao route structure:
    -   GET `/api/auth/{provider}/start`
    -   GET `/api/auth/{provider}/callback`
    -   POST `/api/auth/{provider}` (backend exchange)
-   Reuse existing JWT issuance (`create_access_token`).
-   Follow identical user upsert logic pattern.
-   Avoid refactoring existing auth logic unless explicitly approved.

Deviation requires architectural discussion before implementation.

------------------------------------------------------------------------

## 2. Database Rules

The following constraints are strict:

-   DO NOT create new auth tables (e.g., no `google_users`).
-   DO NOT create provider-specific ID columns (e.g., no `google_id`).
-   MUST reuse:
    -   `provider`
    -   `provider_user_id`
    -   `avatar_url`
-   No schema duplication.
-   No unnecessary nullable column expansion.

All providers must fit the same unified `users` model.

------------------------------------------------------------------------

## 3. User Upsert Logic

Provider login must:

1.  Look up user by:
    -   `provider = '{provider}'`
    -   `provider_user_id = provider_user_id`
2.  If exists:
    -   Update `last_login`
    -   Issue JWT
3.  If not exists:
    -   If provider email exists AND matches existing `provider='email'`
        user:
        -   Return 409
        -   Do NOT auto-merge
    -   Else:
        -   Create new user with:
            -   `provider`
            -   `provider_user_id`
            -   `email` (if provided)
            -   `avatar_url` (if provided)
            -   `password_hash = NULL`

Silent account merging is forbidden.

------------------------------------------------------------------------

## 4. Security Requirements

Must:

-   Validate `redirect_uri` server-side.
-   Never trust client-provided email blindly.
-   Never expose provider access tokens to frontend.
-   Never store provider access tokens in database.
-   Never log OAuth tokens.

Must NOT:

-   Use `router.push()` for OAuth start routes.
-   Hardcode client IDs or secrets.
-   Skip email collision checks.

------------------------------------------------------------------------

## 5. Frontend Rules

-   Use official provider branding assets.
-   Follow existing button order convention.
-   Use `window.location.assign()` for OAuth start navigation.
-   Do not introduce auth logic duplication in UI.

------------------------------------------------------------------------

## 6. PR Deliverables (Required)

Every OAuth provider PR must include:

-   Unified diffs only
-   Manual test checklist including:
    -   Successful login
    -   Redirect flow
    -   Email collision (409)
    -   Fresh restart test
-   Confirmation no secrets were committed
-   Confirmation `.env` unchanged except for new provider keys

PRs missing checklist will not be approved.

------------------------------------------------------------------------

## 7. Testing Checklist Template

Before submitting PR:

-   [ ] Fresh backend restart test
-   [ ] Fresh frontend restart test
-   [ ] Provider login success
-   [ ] JWT issued correctly
-   [ ] `/api/auth/me` returns authenticated
-   [ ] Email collision returns 409
-   [ ] No duplicate provider_user_id rows
-   [ ] No token logging
-   [ ] Avatar displays correctly
-   [ ] Logout invalidates session

------------------------------------------------------------------------

## 8. Philosophy

All providers must conform to one unified auth architecture. No
freestyle implementations. Consistency over cleverness. Stability over
speed.

Auth is infrastructure --- treat it as such.
