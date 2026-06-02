# 11 — Not Found (mid-fidelity)

Builds on: [04 wireframe — Not found](../04-wireframes/11-not-found.md) · [README visual-system reference](README.md#reader-visual-system-reference) · [motion-spec](motion-spec.md) · [accessibility-spec](accessibility-spec.md)
Route: `404` · Flows: all (fallback)

**Purpose.** Clean catch-all for missing or unpublished refs — **never confirms existence** of a private/draft entity (no 403 path, [00 §4.3](../00-ia-route-model.md)). The safety contract: every content `SELECT` leads with `published = true`, so a missing/unpublished ref resolves to 404, never 403 ([02 §1](../02-screen-inventory.md)). Structure from the [04 wireframe](../04-wireframes/11-not-found.md).

## Visual hierarchy + token callouts

- Centered single-column on `--color-background`: Display L "Not found" heading; Body M message that is **identical** whether the entity is missing, draft, or private (no information leak); return-home + **Explore** + **Stories** affordances (styled like landing secondary CTAs).
- Quiet, no decorative illustration that implies more than "this page isn't here."

## Component states

| Module      | States                          |
| ----------- | ------------------------------- |
| Home link   | default · hover · focus-visible |
| Explore CTA | default · hover · focus-visible |
| Stories CTA | default · hover · focus-visible |

## System states

- 404 is itself the terminal state; no empty/loading/error variants. Returns HTTP 404.

## Responsive

- Centered message; CTAs stack on mobile.

## Motion

- No screen-level motion (`ambient-presence` not present here — 404 is not Realtime-subscribed). **Reduced-motion:** N/A.

## Accessibility

| #   | Concern      | Spec                                                                                                |
| --- | ------------ | --------------------------------------------------------------------------------------------------- |
| 1   | Focus order  | skip-link → nav → `h1` "Not found" → message → Home → Explore → Stories → footer                    |
| 2   | No info leak | identical copy + status for missing/draft/private; never a 403 ([00 §4.3](../00-ia-route-model.md)) |
| 3   | Status code  | server responds 404 so assistive tech + crawlers get the right signal                               |
| 4   | Contrast     | heading + CTAs AA on `--color-background` ([accessibility-spec §3](accessibility-spec.md))          |
