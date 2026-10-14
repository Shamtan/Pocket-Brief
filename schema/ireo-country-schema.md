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

## v2 additions (research stages: Frame → Collect → Analyse → Present)

All additive and optional, so a v1 file still loads. Every factual node keeps `source` + `confidence`;
fields marked *judgement* are IREO assessment and are styled as such.

```
"schema": "ireo-country/2",
"geo": "geo/<iso3>.geo.json",              // pre-projected outline (Natural Earth, public domain) for the ORBAT map
"places": [ { name, lat, lon, kind: "capital" } ],
"photos": [ { key, subject, kind: "portrait"|"equipment"|"hero", src: "img/<file>", file_page, author,
              license, license_url, caption, w, h } ],      // freely licensed only (CC0 / PD / CC BY / CC BY-SA)
"hero_photo": "<photo key>",

// 1 · Frame — the 3-minute layer comes first, then the framing (judgement)
"overview": { "as_of": "YYYY-MM-DD",
              "items": [ Claim + { headline, when } ] },   // "what's happening": 5-6 sourced points
"talking_points": { "context": string,                    // who the points are for (judgement)
                    "points": [ { kind: "open"|"ask"|"offer"|"avoid", text, why?, sourceIds? } ] },
"frame": { "question": string, "want": string[], "dont_want": string[] },

// 2 · Collect
force.orbat[].hq_geo: [lat, lon]                             // city centre, WGS84 (GeoNames)
force.budget.trend[]: { year, pct_gdp?, usd_bn?, estimate: bool, basis?: "NATO"|"SIPRI", note?, sourceIds }
Claim.photo?: "<photo key>"                                  // e.g. capability cards
leadership[] += { role_short?, name_local?, born?,                 // role_short: "Chief of the General Staff" career: [{years, role}], careerSourceIds, education: Claim[],
                  positions: Claim[], social: [{platform, handle, url}],   // official accounts only
                  interests: Claim[], family: Claim|null,                  // see privacy rule below
                  hooks: Claim[],                                          // engagement hooks, assessed
                  photo?: "<photo key>", note? }        // photo only when a freely licensed file is in data/img
"partners": [ { country, iso3, types: ("alliance"|"strategic-partner"|"major-supplier"|"industrial-partner"|
               "exercise-partner"|"regional-group")[], depth: 1|2|3 /* judgement */, relation: Claim,
               agreements?: [{ name, year }] } ],
"scholars": [ { name, affiliation, country, focus[], works: [{title, url, date, publisher}], takeaway, tier } ],
"institutions": [ { name, url, kind, note, gov_linked } ],
outlets[].lang?: "pl"|"en"|"pl/en"

// 3 · Analyse
"trends": {
  "personnel": [ { year, value, counts, estimate?, sourceIds } ],
  "personnel_targets": Claim[] (+ value?, year?),
  "conops": Event[], "relations": Event[],                   // Event = Claim + { date, headline }
  "supplier_mix": { window, shares: [{country, iso3, pct}], sourceIds } | null,
  "direction": { budget, personnel, conops, relations: Claim }   // direction of travel, assessed
}

// 4 · Present
engagement += {
  "sg_ties": Event[],                                        // what exists between Singapore and the country
  "venues": [ { name, kind: "pme"|"nato-body"|"exercise"|"conference", url, note,
               partner_access: "stated"|"unclear"|"NATO-only", sourceIds } ],
  "saf_units": [ { id, name, short, service, role, url, sourceIds } ],   // public roles only
  "ladder": [ { level: 0..6, label, short } ],               // engagement ladder definition
  "lines": [ { name, objective, basis: Claim, activities: [{kind, text}], level_now, level_target,
              saf_units: unitId[], pl_counterparts[], we_offer[], horizon } ],   // judgement
  "precedents": Event[] (+ partner)                          // how the SAF engages comparable militaries
}
"gaps": [ { part, text } ]                                   // known research gaps, shown in the app
```

The app derives the reading time of the 3-minute layer (bottom line, so-what, overview, talking
points) from word count, so the layer stays honest about its length as the data changes.

### Privacy rule for people (leaders, scholars)

Public role information only. `interests` must be self-disclosed or reported by reputable press.
`family` only as stated in an official biography, summarised (e.g. "Married, two sons"): no names of
family members, nothing about children beyond a count, no addresses, no private or unverified accounts.
