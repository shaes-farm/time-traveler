# 01 — Sign In

**Purpose.** Auth gate. Minimal pass; this screen exists primarily to be designed elsewhere when the project is ready to commit to an auth UI direction.

## Data shown

- Email input
- Magic link CTA + password fallback CTA
- OAuth provider buttons (Google, GitHub — stack supports these per system-design §9.1)
- Marketing-ish project pitch (one paragraph) — optional

## Primary actions

- Submit email → send magic link
- Click OAuth provider → external auth
- Toggle to password sign-in

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                              + Time Traveler                                 │
│                                                                              │
│                       Temporal content management                            │
│                                                                              │
│                  ┌────────────────────────────────────┐                      │
│                  │  Email                             │                      │
│                  │  ┌──────────────────────────────┐  │                      │
│                  │  │ you@example.com              │  │                      │
│                  │  └──────────────────────────────┘  │                      │
│                  │                                    │                      │
│                  │     [  Send magic link  ]          │                      │
│                  │                                    │                      │
│                  │  ─────────── or ───────────        │                      │
│                  │                                    │                      │
│                  │     [ G  Continue with Google  ]   │                      │
│                  │     [ GH Continue with GitHub  ]   │                      │
│                  │                                    │                      │
│                  │  Use password instead              │                      │
│                  └────────────────────────────────────┘                      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Annotations

1. **Single centered card** is the only screen in the app that uses this layout. Every other screen lives inside the shell.
2. **Magic link is primary** because Supabase Auth supports it natively and it avoids password management for occasional users. Password is a fallback link, not a primary affordance.
3. **OAuth providers** depend on what's configured in Supabase. Buttons should be conditional on configured providers, not hardcoded.
4. **No sign-up CTA in this pass.** This admin app is intended for authenticated content authors. If/when public signup opens, this needs a "create account" path.

## Edge cases

- **Magic link sent.** Replace form with confirmation message: "Check your email — link sent to {email}". Provide a "resend" affordance after a 30s cooldown.
- **Bad email format.** Inline validation; no submit.
- **Provider OAuth failure.** Return URL handles the error; toast surfaces.

## Open questions

- Branding direction is deferred. The "⚡ Time Traveler" wordmark here is a placeholder.
- Do we want a separate marketing splash before the auth card? Out of scope.
