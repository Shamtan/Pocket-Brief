# IREO Country Schema (Pocket Brief data contract)

One JSON object per country at `data/<iso3>.json`. Generate Zod types from this and validate at load.
Every factual node carries `source` + `confidence`. Dates are ISO `YYYY-MM-DD`.

## Shared building blocks

```
Confidence  = "claimed" | "assessed"          // what they say vs what we judge
SourceTier  = "official" | "reference" | "press" | "state-media" | "think-tank" | "academic"
Status      = "draft" | "validated"
MediaType   = "speech" | "keynote" | "interview" | "news" | "scholarship" | "video" | "doc"

Source      = { id: string, title: string, url: string, tier: SourceTier,
                publisher?: string, date?: string, flagged?: boolean }   // flagged=true for state media

Claim       = { text: string, confidence: Confidence, sourceIds: string[], asOf?: string }
              // the atomic unit: a statement + how sure we are + what backs it
```

## Country object

```
{
  "iso3": "pol",
  "name": "Poland",
  "status": "draft" | "validated",
  "reviewed_by": string | null,          // officer who validated (null while draft)
  "last_reviewed": "YYYY-MM-DD" | null,   // VALIDATION age  (officer)  — do NOT drive freshness from this
  "last_refresh": "YYYY-MM-DD",           // CURRENCY: when OSINT last swept — drives the freshness chip
  "sources": Source[],                    // the source table; everything references these by id

  "snapshot": {                           // the 20-second BLUF
    "bluf": Claim,                        // one-line so-what
    "key_facts": Claim[],                 // 3-5 headline numbers/claims (active strength, budget, posture)
    "so_what_saf": string                 // why a SAF commander should care (assessed, 1-2 lines)
  },

  // §1 force structure & budget
  "force": {
    "summary": Claim,
    "active_personnel": Claim,
    "orbat": [ { "name": string, "type": "division"|"brigade"|"command"|"other",
                 "hq"?: string, "note"?: Claim, "children"?: [ ...same shape ] } ],
    "budget": {
      "year": number,
      "local": Claim,                     // e.g. "~200 billion zloty"
      "usd": Claim,                       // e.g. "~$53-55B"
      "pct_gdp": Claim,                   // e.g. "4.8%"
      "trend"?: [ { "year": number, "pct_gdp"?: number, "usd_bn"?: number } ],
      "notes"?: Claim[]
    }
  },

  // §2 concept of operations
  "conops": {
    "posture": Claim,                     // e.g. territorial/forward defence
    "doctrine": Claim[],                  // key doctrinal points
    "programmes"?: Claim[]                // named programmes that express the ConOps (e.g. Eastern Shield)
  },

  // §3 capabilities + upcoming tech
  "capabilities": {
    "current": Claim[],                   // inventory highlights that matter
    "emerging": Claim[]                   // upcoming / emerging-tech acquisitions & R&D
  },

  // §4 leadership + the sourcing rail
  "leadership": [
    { "name": string, "appointment": string, "since"?: string, "bio"?: Claim,
      "media": [ { "type": MediaType, "title": string, "url": string, "date"?: string,
                   "venue"?: string, "sourceTier": SourceTier, "note"?: string } ] }
  ],
  "outlets": [ { "name": string, "url": string, "kind": "official"|"unofficial"|"mil-site", "note"?: string } ],
  "scholarship": [ { "title": string, "author"?: string, "org"?: string, "url": string,
                     "date"?: string, "takeaway"?: string, "tier": SourceTier } ],

  // §5 how the SAF can learn
  "learn_from": [
    { "domain": string,                   // e.g. "Counter-UAS / drones"
      "why": Claim,                       // why them, specifically
      "what": string,                     // what exactly SAF could take
      "confidence": Confidence } ],

  // §6-7 engagement + the trade
  "engagement": {
    "relationship": Claim,                // current state of SG-<country> relationship (honest, incl. "thin")
    "angle": string,                      // the realistic way in
    "we_want": string[],                  // what we want from them
    "we_offer": string[]                  // what we can offer
  },

  // carry-forward: OSINT auto-sweep appends here; currency header reads latest
  "signals": [ { "date": "YYYY-MM", "headline": string, "sowhat": string,
                 "url": string, "auto": boolean } ]
}
```

## Rules

- Nothing renders without a `source` behind its `Claim` (except `so_what_saf`/`angle`/`we_*`, which are
  explicitly our assessment and should be styled as assessed).
- `flagged: true` sources (state media) must be visibly flagged and never the only source for a claim.
- `last_refresh` drives freshness; `last_reviewed` is validation age — keep them separate in code and UI.
- Keep it ISO3-keyed and country-agnostic so `data/aus.json` drops in with no code change.
