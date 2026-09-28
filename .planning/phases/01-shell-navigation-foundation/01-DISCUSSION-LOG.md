# Phase 1: Shell & Navigation Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-28
**Phase:** 01-shell-navigation-foundation
**Areas discussed:** Look & feel, Screens between phases, Mobile navigation, Palette & search scope

---

## Look & feel

| Option | Description | Selected |
|--------|-------------|----------|
| Pick now, tune later | Lock in discussion; tokens defined once | ✓ |
| Sketch first | /gsd-sketch 2–3 throwaway mockups before planning | |
| You decide | Claude picks a Linear-style default | |

| Option (typeface) | Description | Selected |
|--------|-------------|----------|
| Geist | @fontsource-variable/geist; crisp, technical | ✓ |
| Inter | Safest, most "templated" | |
| Manrope | Rounder, warmer | |

| Option (accent) | Description | Selected |
|--------|-------------|----------|
| Electric orange | Energetic, "fast lane" | |
| Indigo / violet | Classic Linear | |
| Lime / acid green | Bold; clashes with success green | ✓ (then changed) |

**User's choice:** Lime at first. When asked about the conflict with success colours, the user changed it: "lets change the colour to blue itself then twitter like". Final accent is Twitter blue `#1D9BF0`.

| Option (density) | Description | Selected |
|--------|-------------|----------|
| Compact, Linear-like | 13–14px, ~32px rows, ~6px radius | ✓ |
| Comfortable | 14–15px, ~40px rows | |
| You decide | Per surface | |

| Option (success colour, asked while accent was lime) | Description | Selected |
|--------|-------------|----------|
| Separate teal/emerald token | Distinct from lime | |
| Reuse the accent | Lime = act + done | |
| Neutral + icon | Grey with check | |

**User's choice:** Superseded, since the user switched the accent to blue and green is now free for success states.

| Option (background) | Description | Selected |
|--------|-------------|----------|
| Pure black "Lights out" | #000 / #16181C / #2F3336 | ✓ |
| Dim navy | #15202B | |
| Neutral near-black | ~#0A0A0A like today | |

| Option (buttons) | Description | Selected |
|--------|-------------|----------|
| Pill primary, soft-square rest | Twitter-signature primary pill | |
| Everything pill | Max Twitter feel | |
| Everything soft-square | ~6px everywhere | ✓ |

| Option (sidebar) | Description | Selected |
|--------|-------------|----------|
| Same black, border divider | X-style left rail | ✓ |
| Raised surface | #16181C sidebar | |
| You decide | | |

| Option (avatars) | Description | Selected |
|--------|-------------|----------|
| People round, Startups rounded-square | Distinguish at a glance | |
| Everything round | | |
| Everything rounded-square | Uniform with soft-square UI | ✓ |

| Option (blue usage) | Description | Selected |
|--------|-------------|----------|
| Restrained | Primary action, links, focus, active icon, unread | ✓ |
| Generous | Headers, selected rows, badges too | |

---

## Screens between phases

| Option | Description | Selected |
|--------|-------------|----------|
| Move as-is into new routes | Keep app working end-to-end between phases | |
| Placeholders | Stub until Phases 2–5 rebuild | |
| Mix | Move lightly-touched pages, stub rebuilt ones | |

**User's choice:** Free text: "i didnt launch the app so the redesign wont hurt". Claude reflected it back as: stub the screens later phases rebuild, delete old `ui/` pages but keep their hooks and components, and move the public Pitch, profile and Discover pages over as-is. User confirmed: "ok".

| Option (keep live) | Description | Selected |
|--------|-------------|----------|
| Create Startup + accept Invite | Enough to test switcher, slug resolution, non-Member redirect | ✓ |
| Create Startup only | Founder-only testing | |
| Nothing, seed via dashboard | | |

| Option (rename timing) | Description | Selected |
|--------|-------------|----------|
| Phase 1, plain rename | No users, so no migration; drop from PLAN-05 | ✓ |
| Phase 1, via migration | widen → copy → narrow | |
| Defer to Phase 6 | Code against old name until then | |

---

## Mobile navigation

| Option (Startup tab) | Description | Selected |
|--------|-------------|----------|
| Opens a bottom sheet | Switcher + Focused-Startup sections | ✓ |
| Goes to a Startup home screen | Section strip + header switcher | |

| Option (Threads/account) | Description | Selected |
|--------|-------------|----------|
| Slim top bar with avatar | Account sheet incl. Threads | |
| Threads inside Inbox | Notifications / Threads segments | ✓ |
| Threads in the Startup sheet | | |

| Option (segment scope) | Description | Selected |
|--------|-------------|----------|
| Mobile only | Desktop keeps separate Threads item | ✓ |
| Both | Changes SHELL-01 | |

| Option (account menu) | Description | Selected |
|--------|-------------|----------|
| Avatar in a slim top bar | Also gives mobile a search/palette entry | ✓ |
| Inside the Startup sheet | No top bar | |

---

## Palette & search scope

| Option (Cycles in palette) | Description | Selected |
|--------|-------------|----------|
| Focused Startup only | Reuses existing per-Startup query | ✓ |
| All my Startups | New cross-Startup query | |

| Option (registry contents) | Description | Selected |
|--------|-------------|----------|
| Only what works, phases add theirs | No dead UI | ✓ |
| All entries now, disabled until built | "coming soon" entries | |

| Option (`/` behaviour) | Description | Selected |
|--------|-------------|----------|
| Page search, else palette | Pages register their search input | ✓ |
| Always the palette | | |
| Page search only | | |

---

## Claude's Discretion

- Exact grey/green shades, token names, type scale
- Breakpoints, and whether the desktop sidebar collapses
- Stub empty-state content
- Platform-aware ⌘/Ctrl labels
- Restyle of the signed-out public header
- Where the slug query's Plan block gets its data before Phase 6 (recommended: final shape, derived from existing `planTier` + `lib/limits.ts`)

## Deferred Ideas

None.
