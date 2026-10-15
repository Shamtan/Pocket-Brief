"""Write data/countries.json from the country files in data/ (one per ISO3). Usage: python3 -I tools/build_manifest.py . [default_iso3]
Everything in the manifest is derived from the country files, so it never holds facts of its own. The home page
(world map, regions, Pulse) and the country switcher read only this file."""
import glob, json, os, sys

# The nine IREO research areas and the test for "covered" in a country file.
AREAS = [
    ("Structure and organisation", lambda d: bool(d["force"].get("orbat")) and bool(d["force"].get("summary"))),
    ("Budget", lambda d: bool(d["force"].get("budget", {}).get("pct_gdp") or d["force"].get("budget", {}).get("local")) and len(d["force"]["budget"].get("trend", [])) >= 3),
    ("Concept of operations", lambda d: bool(d.get("conops", {}).get("doctrine"))),
    ("Capabilities and emerging tech", lambda d: bool(d.get("capabilities", {}).get("current")) and bool(d["capabilities"].get("emerging"))),
    ("Key leadership and their words", lambda d: any(L.get("media") for L in d.get("leadership", []))),
    ("News outlets and scholarship", lambda d: bool(d.get("outlets")) and bool(d.get("scholarship") or d.get("scholars"))),
    ("How the SAF can learn", lambda d: bool(d.get("learn_from"))),
    ("Engagement angle", lambda d: bool(d.get("engagement", {}).get("relationship")) and bool(d["engagement"].get("angle"))),
    ("What we want and offer", lambda d: bool(d.get("engagement", {}).get("we_want")) and bool(d["engagement"].get("we_offer"))),
]
repo = sys.argv[1]; default = sys.argv[2] if len(sys.argv) > 2 else None
out = []
for f in sorted(glob.glob(f"{repo}/data/[a-z][a-z][a-z].json")):
    d = json.load(open(f, encoding="utf-8"))
    photos = {p["key"]: p for p in d.get("photos", [])}
    flag = next((photos[s["key"]]["src"] for s in d.get("symbols", []) if s.get("role") == "flag" and s["key"] in photos), None)
    eng = d.get("engagement", {})
    levels = [l["level_now"] for l in eng.get("lines", []) if isinstance(l.get("level_now"), int)]
    ladder = {l["level"]: l["label"] for l in eng.get("ladder", [])}
    engagement = {"level": max(levels), "label": ladder.get(max(levels), "")} if levels else None
    targets = [l["level_target"] for l in eng.get("lines", []) if isinstance(l.get("level_target"), int)]
    if engagement and targets:
        engagement["target"] = max(targets)
    covered = [name for name, test in AREAS if test(d)]
    pct = [p for p in d["force"].get("budget", {}).get("trend", []) if isinstance(p.get("pct_gdp"), (int, float))]
    spend = max(pct, key=lambda p: p["year"]) if pct else None
    pers = d.get("trends", {}).get("personnel", [])
    people = max(pers, key=lambda p: p["year"]) if pers else None
    hero = photos.get(d.get("hero_photo") or "")
    emblem = next((s for s in reversed(d.get("symbols", [])) if s.get("role") == "forces" and s["key"] in photos), None)
    leaders = [{"name": L["name"], "role": L.get("role_short") or L.get("appointment"), "photo": photos[L["photo"]]["src"] if L.get("photo") in photos else None}
               for L in d.get("leadership", [])[:6]]
    signals = [{k: s[k] for k in ("date", "short", "event_date", "event_end") if s.get(k)} for s in d.get("signals", []) if s.get("short")]
    entry = {"iso3": d["iso3"], "name": d["name"], "name_local": d.get("name_local"), "lang": d.get("lang"), "region": d.get("region"), "sub_region": d.get("sub_region"),
             "file": os.path.basename(f), "flag": flag, "status": d.get("status"), "last_refresh": d.get("last_refresh"), "last_reviewed": d.get("last_reviewed"),
             "sources": len(d.get("sources", [])), "coverage": len(covered), "engagement": engagement,
             "bluf": (d.get("snapshot", {}).get("bluf") or {}).get("text"),
             "spend": {k: spend[k] for k in ("pct_gdp", "year", "basis", "estimate") if k in spend} if spend else None,
             "personnel": {"value": people["value"], "year": people["year"]} if people else None,
             "hero": {"src": hero["src"], "alt": hero["caption"], "credit": f'{hero["author"]} · {hero["license"]}'} if hero else None,
             "emblem": {"src": photos[emblem["key"]]["src"], "alt": emblem["label"]} if emblem else None,
             "leaders": leaders or None, "signals": signals or None}
    out.append({k: v for k, v in entry.items() if v is not None})
    missing = [name for name, _ in AREAS if name not in covered]
    print(f"{d['iso3']}: {len(covered)}/9 areas{' (missing: ' + ', '.join(missing) + ')' if missing else ''}; engagement {engagement}")
assert out, "no country files found"
m = {"default": default or out[0]["iso3"], "countries": out}
json.dump(m, open(f"{repo}/data/countries.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
open(f"{repo}/data/countries.json", "a").write("\n")
