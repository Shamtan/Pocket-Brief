// Builds data/geo/world.json: the dot-matrix world map and region maps on the home page.
// Usage (from tools/geo): npm ci && node build-world.mjs ../../data/geo/world.json
//
// Source: Natural Earth admin-0 countries (public domain) via world-atlas 2.0.2; 1:110m for the world, 1:50m for regions.
// Every land cell carries its country's ISO3 code, so a new country brief lights up on the map without rebuilding it.
// Rows are run-length coded: <token><count>, where the token is an ISO3 code, '.' for sea, or a lower-case region
// letter for land Natural Earth gives no ISO code (e, i, m, f, a; n for land outside every region).
import fs from 'fs';
import { feature } from 'topojson-client';
import { geoArea, geoBounds, geoCentroid, geoContains } from 'd3-geo';
import countries from 'i18n-iso-countries';

const load = f => {
  const t = JSON.parse(fs.readFileSync(new URL(`node_modules/world-atlas/${f}`, import.meta.url)));
  return feature(t, t.objects.countries).features;
};

// IREO regions. A country's region is decided once, here, and written to the file; no region facts live in the app.
const REGIONS = [
  { id: 'indo-pacific', name: 'Indo-Pacific', letter: 'i', frame: { lon0: 60, lon1: 182, lat0: -48, lat1: 52, phi0: 8 } },
  { id: 'europe', name: 'Europe', letter: 'e', frame: { lon0: -14, lon1: 52, lat0: 34, lat1: 69, phi0: 52 } },
  { id: 'middle-east', name: 'Middle East', letter: 'm', frame: { lon0: 24, lon1: 66, lat0: 10, lat1: 44, phi0: 27 } },
  { id: 'africa', name: 'Africa', letter: 'f', frame: { lon0: -20, lon1: 56, lat0: -36, lat1: 38, phi0: 0 } },
  { id: 'americas', name: 'Americas', letter: 'a', frame: { lon0: -170, lon1: -28, lat0: -57, lat1: 75, phi0: 15 } },
];
const WORLD = { lon0: -170, lon1: 190, lat0: -58, lat1: 78, phi0: 0 };
const HOME = { iso3: 'SGP', name: 'Singapore', lon: 103.82, lat: 1.35 };
// Land shown but outside every IREO region for now (Russia, Central Asia, the Caucasus, Greenland, Antarctica).
const NONE = new Set(['RUS', 'KAZ', 'UZB', 'TKM', 'KGZ', 'TJK', 'GEO', 'ARM', 'AZE', 'GRL', 'ATA', 'ATF']);
const MIDEAST = new Set(['SAU', 'YEM', 'OMN', 'ARE', 'QAT', 'BHR', 'KWT', 'IRQ', 'IRN', 'SYR', 'JOR', 'ISR', 'PSE', 'LBN', 'AFG']);
const EUROPE_EXTRA = new Set(['TUR', 'CYP']);
const AFRICA_EXTRA = new Set(['MUS', 'SYC']);
// Features Natural Earth leaves without an ISO code at these scales.
const NO_CODE = { Kosovo: 'XKX' };

const iso3Of = f => {
  const a3 = f.id && countries.numericToAlpha3(f.id);
  return a3 || NO_CODE[f.properties.name] || null;
};
// Label point: the centroid of the largest polygon, so overseas territories do not drag it out to sea.
const labelPoint = f => {
  const g = f.geometry;
  if (g.type !== 'MultiPolygon') return geoCentroid(f);
  const parts = g.coordinates.map(c => ({ type: 'Polygon', coordinates: c }));
  return geoCentroid(parts.reduce((a, b) => (geoArea(b) > geoArea(a) ? b : a)));
};
const regionOf = (iso, f) => {
  if (NONE.has(iso)) return null;
  if (MIDEAST.has(iso)) return 'middle-east';
  if (EUROPE_EXTRA.has(iso)) return 'europe';
  if (AFRICA_EXTRA.has(iso)) return 'africa';
  const [lon, lat] = labelPoint(f);
  if (lon < -125 && lat < 30) return 'indo-pacific'; // Pacific islands east of the date line
  if (lon < -25) return 'americas';
  if (lon <= 45 && lat > 35) return 'europe';
  if (lon <= 52 && lat <= 37) return 'africa';
  return 'indo-pacific';
};
const letterOf = (region, lon, lat) => {
  if (region) return REGIONS.find(r => r.id === region).letter;
  return 'n';
};

function prepare(features) {
  return features.map(f => {
    const iso = iso3Of(f);
    const [[a0, b0], [a1, b1]] = geoBounds(f);
    return { f, iso, region: iso ? regionOf(iso, f) : regionOf('---', f), box: [a0, b0, a1, b1] };
  });
}
function build(items, fr, W, step) {
  const c = Math.cos(fr.phi0 * Math.PI / 180), k = W / ((fr.lon1 - fr.lon0) * c), H = Math.round((fr.lat1 - fr.lat0) * k);
  const proj = (lon, lat) => [(lon - fr.lon0) * c * k, (fr.lat1 - lat) * k];
  const rows = [];
  let dots = 0;
  for (let y = step / 2; y < H; y += step) {
    let s = '', run = null, n = 0;
    const push = t => { if (t === run) n++; else { if (n) s += run + n; run = t; n = 1; } };
    for (let x = step / 2; x < W; x += step) {
      let lon = fr.lon0 + x / (c * k);
      const lat = fr.lat1 - y / k;
      if (lon > 180) lon -= 360;
      let tok = '.';
      for (const it of items) {
        const [a0, b0, a1, b1] = it.box;
        if (lat < b0 || lat > b1) continue;
        if (a0 <= a1 && (lon < a0 || lon > a1)) continue;
        if (!geoContains(it.f, [lon, lat])) continue;
        tok = it.iso || letterOf(it.region, lon, lat);
        if (tok === 'FRA' && lon < -30) tok = 'GUF'; // French Guiana is part of France's Natural Earth shape
        break;
      }
      if (tok !== '.') dots++;
      push(tok);
    }
    if (run !== '.' && n) s += run + n;
    rows.push(s);
  }
  const r1 = v => Math.round(v * 10) / 10;
  const points = {};
  for (const it of items) {
    if (!it.iso) continue;
    const [lon, lat] = labelPoint(it.f), [x, y] = proj(lon > fr.lon1 ? lon - 360 : lon < fr.lon0 ? lon + 360 : lon, lat);
    if (x >= 0 && x <= W && y >= 0 && y <= H) points[it.iso] = [r1(x), r1(y)];
  }
  const [hx, hy] = proj(HOME.lon, HOME.lat);
  if (hx >= 0 && hx <= W && hy >= 0 && hy <= H) points[HOME.iso3] = [r1(hx), r1(hy)];
  return { frame: fr, w: W, h: H, step, dots, rows: rows.join('|'), points };
}

const coarse = prepare(load('countries-110m.json')), fine = prepare(load('countries-50m.json'));
const regionOfIso = {};
for (const it of fine) if (it.iso) regionOfIso[it.iso] = it.region;
regionOfIso.GUF = 'americas';
const out = {
  source: { title: 'Natural Earth admin-0 countries, 1:110m (world) and 1:50m (regions), via world-atlas 2.0.2', url: 'https://www.naturalearthdata.com/', license: 'Public domain' },
  note: 'Boundaries follow Natural Earth (de facto control) and imply no position on disputed territory.',
  home: HOME,
  regions: REGIONS.map(({ id, name, letter }) => ({ id, name, letter })),
  region_of: regionOfIso,
  maps: { world: build(coarse, WORLD, 1000, 7.4) },
};
for (const r of REGIONS) out.maps[r.id] = build(fine, r.frame, 1000, 11);
const file = process.argv[2] || 'world.json';
fs.writeFileSync(file, JSON.stringify(out) + '\n');
console.log(file, fs.statSync(file).size, 'bytes;', Object.entries(out.maps).map(([k, m]) => `${k} ${m.w}x${m.h} ${m.dots} dots`).join(', '));
