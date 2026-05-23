# 10 — Temporal Input Control

**Purpose.** A reusable primitive — not a screen. Renders inside the character editor, event editor, and relationships editor wherever a `temporal_data JSONB` value is captured. Adapts visible fields by era per system-design §7.4.

This is the single most important UX component in the admin app: every date input in the system flows through it.

## Data captured

The full `temporalDataSchema` per system-design §4.6:

- `year` (number, required, integer per system-design §4.4)
- `month`, `day`, `hour`, `minute`, `second` (CE/BCE only; ranges enforced)
- `era` (CE | BCE | KYA | MYA | BYA — required)
- `precision` (exact | circa | approximate | estimated | geological — required)
- `uncertainty` (number, ± years — optional)
- `geological_period`, `geological_epoch`, `cosmological_epoch` (string — era-conditional)
- `display_format` (standard | scientific | geological | cosmological — optional)
- `dating_method` (string — optional)
- `confidence_level` (high | medium | low — optional)
- `source` (string — optional citation)

## Behavior

- Renders as a button in the parent form showing the formatted display.
- Click → popover (desktop) or full-screen sheet (mobile) opens with the editor.
- Editor adapts to the era. CE/BCE shows month/day/time. KYA/MYA/BYA hides those, shows geological/cosmological metadata.
- Live preview at the top of the popover renders the result via `TemporalService.formatDisplay()`.
- Zod validation runs on save; errors are inline per field.

## Closed (button) state

```
  ┌─────────────────────────────────────────┐
  │  Start date                             │
  │  ┌───────────────────────────────────┐  │
  │  │ 14 BYA · estimated · cosmological │  │  ← formatted display
  │  └───────────────────────────────────┘  │
  └─────────────────────────────────────────┘
```

Empty state:

```
  ┌─────────────────────────────────────────┐
  │  Start date                             │
  │  ┌───────────────────────────────────┐  │
  │  │ + Add date                        │  │
  │  └───────────────────────────────────┘  │
  └─────────────────────────────────────────┘
```

## Open (popover) state — CE / BCE

```
┌──────────────────────────────────────────────────────────────┐
│  Preview:  November 7, 1867 CE (exact)                       │
│  ──────────────────────────────────────────────────────────  │
│                                                              │
│  Era       [ CE ▾ ]    Precision  [ Exact ▾ ]                │
│                                                              │
│  Year      Month         Day                                 │
│  [ 1867 ]  [ 11 ▾ ]      [  7 ▾ ]                            │
│                                                              │
│  ▸ Time of day (optional)                                    │
│  ▸ Uncertainty (optional)                                    │
│  ▸ Dating method & source (optional)                         │
│                                                              │
│              [ Cancel ]     [ Apply ]                        │
└──────────────────────────────────────────────────────────────┘
```

## Open (popover) state — MYA / KYA / BYA

```
┌──────────────────────────────────────────────────────────────┐
│  Preview:  66 MYA (approximate, ±1,000,000 years)            │
│            Cretaceous–Paleogene boundary                     │
│  ──────────────────────────────────────────────────────────  │
│                                                              │
│  Era       [ MYA ▾ ]   Precision  [ Approximate ▾ ]          │
│                                                              │
│  Year      Uncertainty (± years)                             │
│  [   66 ]  [ 1000000  ]                                      │
│                                                              │
│  Geological context                                          │
│  Period      [ Cretaceous–Paleogene boundary       ]         │
│  Epoch       [ (none)                              ]         │
│  Cosmological [ (none)                             ]         │
│                                                              │
│  ▸ Dating method & source (optional)                         │
│    Method   [ Radiometric                          ]         │
│    Confidence [ High ▾ ]                                     │
│    Source   [ Wikipedia: K–Pg boundary             ]         │
│                                                              │
│              [ Cancel ]     [ Apply ]                        │
└──────────────────────────────────────────────────────────────┘
```

## Annotations

1. **Era is the master switch.** Changing era re-renders the visible fields. CE/BCE show calendar fields; KYA/MYA/BYA hide them and surface geological/cosmological metadata.
2. **Preview is always at the top.** Shows the formatted output that will appear in the rest of the app. Verifies the user's mental model matches what gets stored.
3. **Year is always required, always an integer.** The system-design §4.4 callout about `(temporal_data->>'year')::BIGINT` failing for fractional values is enforced by the input — no decimals accepted.
4. **Precision options drop "exact" for BYA/MYA/KYA eras.** It's almost never honest to claim "exact" at the million-year scale. The select still allows it but flags a warning.
5. **Geological/cosmological fields are progressive disclosures** (`▸`). They're optional; the default editor stays compact.
6. **Uncertainty for CE/BCE dates** is also a progressive disclosure — most modern dates are precise; uncertainty is the unusual case there.
7. **Cancel discards; Apply commits to the parent form's local state.** Save-to-database is the parent form's responsibility.
8. **Validation surfaces inline beneath each field.** Era + year are the only fields validated on close; the rest validate on type.
9. **No keyboard shortcut for "now" or "today".** This isn't a journaling app; current-date defaults would be misleading. The user types the year.

## Edge cases

- **Year out of `make_timestamp` range for CE** (year > 294,276). Per system-design §4.5, Zod validates the upper bound and surfaces a clear error rather than letting the DB error.
- **Era change with stale fields.** Switching from CE → MYA with a `month` value: the month silently clears (cannot be represented at MYA scale). Surface a small notice: "Month and day are not stored for MYA dates."
- **Empty / partial.** If the field is optional in the parent form, allow saving with no temporal value (the parent posts `null`). If required, prevent close on Apply with an inline error.
- **Loading on edit.** When opening a popover with existing data, the form populates synchronously from local state. No async fetch.

## Open questions

- Should the precision selector adjust default uncertainty values? "Circa" might default to ±5 years for CE; "approximate" might default to ±1M for MYA. Useful but easy to get wrong. Defer.
- Should there be a "copy from another field" affordance (e.g., "use this character's death date as the event's start date")? Yes, but cross-field references are an editor-level concern, not a primitive concern.
- The system-design `display_format` field is not exposed in this UI. It's primarily for output rendering. Should the user be able to override it? Probably not in the first pass.
- How does this work for ranges (start + end)? Two of these controls side-by-side. The parent form owns the relationship; this primitive remains a single-point editor.
