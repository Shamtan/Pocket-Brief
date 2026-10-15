# Pocket Brief — IREO Commander's Brief  *(project memory — read this first every session)*

**Pocket Brief** is the commander-facing app of the **International Research & Engagement Office (IREO)**.
It is the ground-up redesign and successor to the COMPASS / "Tiny Desk" prototype. One job: give a
commander, on the go, a fast, trustworthy, interactive brief on a foreign military — what it is, how it
fights, who leads it, what we can learn from it, and how we engage it.

Owner: Sham. Primary user: commanders (SAF). Built on **open sources only**.

## What this is (v1 scope)

A **modern, responsive web app** (desktop-first that must read beautifully on a phone) covering **ONE
country first: Poland**. Prove the experience and the data model on one country, then scale.
Japan was added in October 2026 at the owner's request, at the same depth; readers switch countries from the
country card.

**Home page (October 2026, owner's decision):** the app opens on a whole-world dot map with five region tiles and
Pulse (each brief's short signal headlines by month). Region → country cards → the full brief. The map shows the
whole world but lights up only countries IREO has researched in full. Do NOT research or add other countries yet:
depth on each country still beats breadth, and new countries come only when the owner asks.

The nine research areas IREO covers per country (this is the spine of the app):
1. Army / Ground Forces **structure & organisation** — incl. annual **budget**
2. Military **Concept of Operations** (doctrine / how they fight)
3. Military **capabilities** + **upcoming/emerging tech**
4. **Key leadership** — service chiefs, Chief-of-Staff equivalent — with their **speeches/keynotes**
   (conferences, seminars, YouTube, Jane's, etc.), **country news outlets** (official + unofficial
   military sites), and **scholarly publications** on their strategy/doctrine
5. **How the SAF can learn** from this military — named areas (drones, logistics, training, …)
6. **Engagement angle** — the realistic way in
7. **What we want from them / what we can offer** (the trade)

## Core logic to PRESERVE from COMPASS (non-negotiable)

These were hard-won in the prototype. Keep them conceptually even though the code is new:

1. **Open sources only.** No internal/restricted/classified material, ever.
2. **Every factual claim carries a source + a confidence label**: `Claimed` (what they say) vs
   `Assessed` (what we judge). Source hierarchy: official gov/mil > Janes/IISS-grade > reputable
   defence press > state media (always flagged, never stands alone).
3. **AI drafts, officer validates.** Every record has `status: draft | validated`. Nothing is presented
   as validated truth until an officer signs it. Show the distinction in the UI.
4. **Currency is separate from validation.** `last_refresh` (when OSINT last swept it) drives the
   "fresh" indicator; `last_reviewed` (officer validation date) is shown separately. Never conflate them
   — this was an actual bug we fixed; don't reintroduce it.
5. **Model-agnostic, file-first data.** Country data lives in plain typed JSON (see `schema/`), not in
   code. The app renders data; it never hardcodes facts.
6. **Compare to zero.** The pitch is coverage that didn't exist, not a cheaper version of a deep desk.

## Hard rules

- Data is data, code is code. All facts live in `data/<iso3>.json`; components render, never embed facts.
- Every claim in the data has `source` + `confidence`. The UI must surface both.
- Responsive is a requirement, not a nice-to-have: every screen works one-handed on a phone.
- No secrets in the repo. Deploy config and tokens stay out of git.
- People: public role information only. No family names, children, addresses or private accounts (see
  `schema/` privacy rule). The app is published on the open internet, so treat every field as public.
- The app follows IREO's research stages: **Frame → Collect → Analyse → Present**, then Sources.

## Stack (see HANDOVER.md for the full spec)

React + Vite + TypeScript + Tailwind, data as typed JSON, deploy to **Railway** (Docker image serving the static
build with Caddy). Changed from Netlify at the owner's request. Full rationale, the data
schema, the design brief and the build milestones are in `HANDOVER.md`, `schema/ireo-country-schema.md`
and `DESIGN-BRIEF.md`.

## Conventions

- Country files keyed by ISO3 lowercase (`data/pol.json`, `data/jpn.json`); `data/countries.json` lists them and is
  generated from them (`python3 -I tools/build_manifest.py . pol`). A new country is a new data file plus its map and
  images: no code change. The home page reads only `data/countries.json` and `data/geo/world.json`.
- Maps come from Natural Earth via `tools/geo` (`npm ci`, then `node build-world.mjs ../../data/geo/world.json` or
  `node build-country.mjs ISO3`). Every land cell carries its ISO3 code, so a new brief lights up without a rebuild.
- URLs: no query = world overview, `?r=<region id>` = a region, `?c=<iso3>#<stage or part>` = a brief.
- Dates ISO `YYYY-MM-DD`. Confidence is `claimed | assessed`. Status is `draft | validated`.
- Keep commits small and labelled. Write tests for the data loader and the confidence/currency logic.
