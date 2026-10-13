# Pocket Brief — Design Brief

**Product feeling:** a sharp, trustworthy field brief you pull from your pocket. Calm under pressure,
dense but never cluttered, premium but not flashy. A commander should feel *oriented in 20 seconds* and
*able to go deeper without friction*.

## Principles

1. **Snapshot-first.** The first screen is a BLUF: who they are, the 3–4 numbers that matter, the one-line
   so-what, and the freshness/validation state. Everything else is one tap away.
2. **Honest at a glance.** Source tier and confidence (`claimed` vs `assessed`) are always reachable, and
   draft vs validated and fresh vs stale are never hidden to look more finished than the data is.
3. **Thumb-reachable.** Primary actions and navigation sit in the lower half on mobile. One-handed use is
   the default, not an afterthought. Desktop gets the same content with more shown at once.
4. **Motion with meaning.** Framer Motion for drill-downs, card expansion, rail swipes and section
   transitions — fast (150–250ms), spatial, reversible. Never animation for its own sake.
5. **Legible density.** Information-rich without noise: strong type hierarchy, generous spacing, restrained
   colour used to carry meaning (confidence, source tier, freshness), not decoration.

## Visual language

- **Mode**: dark-first command aesthetic (reads well in low light / briefing rooms), with a clean light
  mode. Both WCAG AA.
- **Type**: a crisp grotesque for UI/numbers (e.g. Space Grotesk / Inter), a readable sans for body.
  Numbers are a feature — tabular, confident.
- **Colour carries meaning, consistently**:
  - Confidence: `assessed` vs `claimed` visually distinct (e.g. solid vs outlined chips).
  - Source tier: official / reference-grade / press / **state-media-flagged** each has a consistent cue.
  - Freshness: fresh / aging / stale (from `last_refresh`).
  - Status: `validated` (signed, with reviewer) vs `draft` (clearly marked).
- **Flags/imagery**: load from CDN with graceful fallback; never block render on an image.

## Signature interactions

- **Status/currency header** (sticky): country + flag, `validated|draft`, freshness chip (from
  `last_refresh`), reviewer + date (from `last_reviewed`) — the two kept visibly separate.
- **Claim disclosure**: tap any claim to reveal its source link + confidence; a global "show all sources".
- **Orbat explorer**: collapsible force tree, thumb-driven, division → brigade → key equipment.
- **Budget visual**: %GDP gauge + local/USD + multi-year trend; tap a year for the detail + source.
- **Leadership media rail**: swipeable cards → speeches, keynotes, interviews, news outlets, scholarship;
  filter by media type and by source tier; each card links out to the primary voice.
- **Learn-from board**: domain cards (drones, logistics, training…) with why/what/confidence; filterable.

## Responsive

- **Mobile (default design target)**: single column, stacked sections, bottom section-nav, swipe rails,
  collapsible claims. Fast: <2s to interactive, offline via PWA.
- **Desktop**: two-/three-column where it helps (nav rail + content + sources/aside), the same components
  reflowed — not a separate design. "A full desktop webapp that fits a phone."

## Don'ts

- No fake polish that hides draft/stale/weak-source data.
- No walls of prose — everything is a scannable, sourced record.
- No blocking spinners on images or fonts; no layout shift.
