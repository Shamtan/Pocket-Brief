# Pocket Brief — Build Handover for Claude Code (Opus 5.5)

> Paste this file as your kickoff context in Claude Code. It is a complete brief: what to build, what to
> preserve, the stack, the data model, the design, the milestones, and the acceptance bar. Read
> `CLAUDE.md`, `DESIGN-BRIEF.md`, `schema/ireo-country-schema.md` and `data/poland.json` alongside it.

---

## 1. The mission

Build **Pocket Brief**, the commander-facing app of the **International Research & Engagement Office
(IREO)**. It gives a commander — often on a phone, minutes before a meeting — a fast, trustworthy,
interactive brief on a foreign military: what it is, how it fights, who leads it, what the SAF can learn
from it, and how to engage it.

**v1 = one country done excellently: Poland.** Depth and interaction on one country, not breadth. Do not
rebuild the old whole-world map dashboard.

This is a ground-up redesign that **succeeds the COMPASS / "Tiny Desk" static prototype**. You are not
porting the old HTML. You are building a modern web app that keeps the prototype's *proven data logic*
(§4) and replaces its *presentation* entirely.

## 2. Your role

You are Opus 5.5 in Claude Code. Own the architecture, scaffold the repo, build it in small verified
increments, and keep `data/poland.json` as the single source of truth for facts. Write tests for the
data loader and the confidence/currency logic. Ask before introducing heavy dependencies.

## 3. What already exists (context, not code to copy)

The prototype (COMPASS) was a static site: a markdown vault → a Python `build.py` → `countries.json` →
a single-file `index.html`. It covered 28 partner countries with a world map, per-country dossiers, a
regional threat board, a demand/engagement register, and a daily OSINT auto-sweep (a scheduled job that
web-searches each partner, applies dated sourced "signals", and republishes). It taught us the data
logic in §4. **Keep those lessons; drop that presentation.** The seed data in `data/poland.json` already
carries Poland's content in the new schema, researched from open sources (Oct 2026).

## 4. Core logic to PRESERVE (non-negotiable — carried from COMPASS)

1. **Open sources only.** No internal/restricted/classified content, ever.
2. **Source + confidence on every claim.** `confidence: claimed` (what they say) vs `assessed` (what we
   judge). Source hierarchy, best → weakest: official gov/mil publications → Janes/IISS-grade → reputable
   defence press → state media (always flagged, never the sole source). The UI must make source and
   confidence visible at a glance, not buried.
3. **AI drafts, officer validates.** Every country and ideally every section carries
   `status: draft | validated`. Draft content is visibly marked. Validated content names the reviewer
   and date.
4. **Currency ≠ validation.** `last_refresh` (OSINT currency, how recently sourced) drives the
   "fresh/aging/stale" freshness indicator. `last_reviewed` (officer validation age) is a *separate*
   signal. Never compute freshness from the validation date — that was a real bug; keep them distinct.
5. **File-first, model-agnostic data.** Facts live in `data/<iso3>.json` typed to the schema. Components
   render data; they never hardcode a fact, figure, name or date.
6. **Compare to zero.** Framing is new coverage that didn't exist, not a cheaper deep desk.

## 5. Scope — the nine IREO areas (the app's spine)

Per country, Pocket Brief presents:
1. **Force structure & organisation** + **annual budget** (orbat down to divisions/brigades; budget in
   local + USD, %GDP, trend).
2. **Concept of Operations** — doctrine, how they fight, posture.
3. **Capabilities** + **upcoming/emerging tech** (current inventory highlights + what's coming).
4. **Key leadership** — service chiefs / CoS-equivalent, each with: bio, tenure, and a **media rail** of
   their **speeches/keynotes** (conference, seminar, YouTube, Jane's, think-tank), plus the country's
   **news outlets** (official + unofficial military sites) and **scholarly publications** on their
   strategy/doctrine. This is a first-class, link-rich section — commanders want the primary voice.
5. **How the SAF can learn** — named learning areas (e.g. drones/counter-UAS, logistics, mass
   mobilisation, training), each with a "why them / what specifically / confidence" note.
6. **Engagement angle** — the realistic way in (current state of the relationship, hooks).
7. **The trade** — what we want from them, what we can offer.

Every item above is a data record with source + confidence (§4), not prose baked into a component.

## 6. Tech stack (recommended — adjust with reason, note changes in CLAUDE.md)

- **React 18 + Vite + TypeScript** — fast dev, typed data contracts against the schema.
- **Tailwind CSS** for styling; **Framer Motion** for the interactions in DESIGN-BRIEF.md.
- **State**: start with React state + context; add **Zustand** only if a store is clearly needed.
- **Data viz**: **Recharts** or **visx** for budget/trend/orbat visuals. Keep charts lightweight.
- **Icons**: lucide-react. **Routing**: React Router (hash or browser) for deep-linkable sections.
- **Data layer**: `data/<iso3>.json` validated at load with **Zod** schemas generated from the IREO
  schema; a typed `useCountry(iso3)` loader. Fail loud in dev, degrade gracefully in prod.
- **PWA**: make it installable + offline-cacheable (service worker) so a commander can open it with no
  signal — this directly serves "on the go".
- **Deploy**: Netlify (the prototype already uses it). Build server-side via Netlify's Git integration so
  publishing needs no local CLI. Keep tokens out of the repo.
- **Tests**: Vitest + React Testing Library. Must-cover: data-loader validation, confidence badge logic,
  freshness(last_refresh) vs validation(last_reviewed) separation.

## 7. Information architecture

A single country workspace with a **sticky section nav** (the 7 areas of §5) and a persistent
**status/currency header** (country, flag, `validated|draft`, freshness from `last_refresh`, reviewer).
On mobile the nav collapses to a bottom tab/overflow; sections stack. Deep-linkable (`/pol/leadership`).

Suggested sections (map to §5): **Snapshot** (BLUF + key numbers), **Force & Budget**, **How They Fight**
(ConOps), **Capabilities & Emerging Tech**, **Leadership & Sources** (the media rail), **What SAF Can
Learn**, **Engagement & The Trade**.

## 8. Interactivity (this is the point — "highly interactive, on the go")

- **Snapshot-first**: open to a one-screen BLUF a commander can read in 20 seconds, then drill down.
- **Expand/collapse** every claim to reveal its source + confidence; a global "show sources" toggle.
- **Orbat explorer**: tap a division → its brigades/equipment; collapsible tree, works by thumb.
- **Budget visual**: interactive %GDP + local/USD + trend; tap a year for detail.
- **Leadership media rail**: horizontally swipeable cards linking out to speeches/keynotes/news/scholarship,
  filterable by type (speech | keynote | interview | news | scholarship) and by source tier.
- **"Learn-from" board**: each learning area as a card with why/what/confidence; filter by domain.
- **Freshness + validation chips** everywhere, honest and distinct.
- **Search / jump** within the country. **Offline** (PWA) and **fast** (<2s to interactive on mobile).
- Smooth, purposeful motion (Framer Motion) — never decoration that slows the read.

## 9. Build milestones

- **M0 — Scaffold**: Vite+TS+Tailwind+Router, CI, Netlify deploy of a hello-world. Commit the schema
  and `data/poland.json`. Wire Zod validation of the data at build + load.
- **M1 — Data layer + Snapshot**: typed `useCountry`, status/currency header, Snapshot/BLUF screen with
  honest freshness vs validation chips.
- **M2 — Force & Budget + ConOps**: orbat explorer + interactive budget; ConOps section.
- **M3 — Capabilities & Emerging Tech**: inventory highlights + "coming next", each sourced.
- **M4 — Leadership & Sources**: the media rail (speeches/keynotes/news/scholarship), filterable; this is
  the showcase section.
- **M5 — Learn-from + Engagement & Trade**: learning-area board; engagement angle; want/offer.
- **M6 — Polish + PWA + a11y**: offline, installable, WCAG AA, mobile one-hand pass, motion pass.

Ship each milestone deployed and verifiable. Screenshot mobile + desktop at each.

## 10. Acceptance criteria (v1)

- Poland renders fully from `data/poland.json` — zero facts hardcoded in components.
- Every visible claim exposes its **source** and **confidence**; state media is flagged.
- **Freshness** derives from `last_refresh`; **validation** shown separately — provably distinct (test).
- Reads excellently one-handed on a phone **and** as a full desktop app; installable PWA; works offline.
- Interactive: orbat drill-down, budget viz, filterable leadership media rail, learn-from board.
- Lighthouse: Performance & Accessibility ≥ 90 on mobile. Section-deep-linkable URLs.

## 11. Carry-forward (design for it, don't build it yet)

- **Scale to more countries**: nothing Poland-specific in components; adding `data/aus.json` should Just
  Work and surface a country switcher.
- **OSINT auto-sweep**: the old daily job web-searched each partner and applied dated sourced *signals*
  with `auto: true` + `last_refresh`. Keep a `signals[]` array per country in the schema so a future job
  can append to it and the currency header updates automatically. (Publishing via Netlify's Git build
  means a job commits data and the site rebuilds itself.)

## 12. How to start

1. `npm create vite@latest pocket-brief -- --template react-ts` ; add Tailwind, Router, Framer Motion,
   Zod, lucide-react, Recharts, Vitest.
2. Copy `schema/`, `data/`, `CLAUDE.md`, `DESIGN-BRIEF.md` into the repo root.
3. Generate Zod types from the IREO schema; build the `useCountry('pol')` loader with validation.
4. Build M0 → M6 in order, deploying each. Keep `data/poland.json` the single source of truth.

## 13. Repo structure (target)

```
pocket-brief/
  CLAUDE.md
  HANDOVER.md
  DESIGN-BRIEF.md
  schema/ireo-country-schema.md      # the data contract (this package)
  src/
    data/poland.json                 # seed data (this package) -> move here or /public/data
    lib/schema.ts                    # Zod types from the schema
    lib/useCountry.ts                # typed loader + validation
    lib/confidence.ts, freshness.ts  # the preserved logic (+ tests)
    components/ ...                   # render data; never embed facts
    sections/ Snapshot, ForceBudget, ConOps, Capabilities, Leadership, LearnFrom, Engagement
  tests/
```
