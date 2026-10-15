// Usage: node build-country.mjs ISO3  → <iso3>.geo.json (Natural Earth 1:50m via world-atlas, public domain)
import fs from 'fs';
import { feature } from 'topojson-client';
import { geoProjection, geoPath } from 'd3-geo';
const CFG = {
  POL: { id: '616', phi0: 52, W: 600, H: 560, pad: [48, 40], n: { '276': 'DEU', '203': 'CZE', '703': 'SVK', '804': 'UKR', '112': 'BLR', '440': 'LTU', '643': 'RUS', '428': 'LVA', '208': 'DNK', '752': 'SWE', '348': 'HUN', '040': 'AUT', '642': 'ROU', '498': 'MDA' } },
  // Japan: frame the four main islands plus the Ryukyu chain (Yonaguni ~122.9E); outlying Pacific islets fall outside the frame.
  JPN: { id: '392', phi0: 35, W: 600, H: 640, bbox: [[122.6, 23.9], [146.2, 45.7]], n: { '156': 'CHN', '410': 'KOR', '408': 'PRK', '643': 'RUS', '158': 'TWN' },
    labelAt: { TWN: [34, 628] },
    note: 'Boundaries follow Natural Earth (de facto control) and imply no position on disputed territory, including the Northern Territories / Southern Kurils, Takeshima / Dokdo and the Senkaku / Diaoyu Islands.' },
};
const iso = process.argv[2], c = CFG[iso];
const topo = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-50m.json'));
const all = feature(topo, topo.objects.countries).features;
const phi0 = c.phi0 * Math.PI / 180;
const proj = geoProjection((l, p) => [l * Math.cos(phi0), p]);
const focus = all.find(f => f.id === c.id);
const fitTo = c.bbox ? { type: 'Feature', geometry: { type: 'MultiPoint', coordinates: c.bbox } } : focus;
const [px, py] = c.pad || [40, 36];
proj.fitExtent([[px, py], [c.W - px, c.H - py]], fitTo);
proj.clipExtent([[0, 0], [c.W, c.H]]);
const path = geoPath(proj);
const r = n => Math.round(n * 10) / 10;
const pick = all.filter(f => f.id === c.id || c.n[f.id]);
const shapes = pick.map(f => ({ iso3: f.id === c.id ? iso : c.n[f.id], name: f.properties.name, role: f.id === c.id ? 'focus' : 'neighbour', d: (path(f) || '').replace(/-?\d+\.\d+/g, m => String(r(+m))) })).filter(s => s.d);
const k = proj.scale(), [tx, ty] = proj.translate();
const labels = shapes.filter(s => s.role === 'neighbour').map(s => { const f = pick.find(x => c.n[x.id] === s.iso3); const p = path.centroid(f); const at = (c.labelAt || {})[s.iso3]; return { iso3: s.iso3, name: s.name, x: r(at ? at[0] : p[0]), y: r(at ? at[1] : p[1]) }; });
const out = { source: { title: 'Natural Earth 1:50m admin-0 countries (via world-atlas 2.0.2)', url: 'https://www.naturalearthdata.com/', license: 'Public domain' },
  ...(c.note ? { note: c.note } : {}), viewBox: [0, 0, c.W, c.H], projection: { type: 'equirect-cos', phi0_deg: c.phi0, k: r(k), tx: r(tx), ty: r(ty) }, shapes, labels };
const file = `${iso.toLowerCase()}.geo.json`;
fs.writeFileSync(file, JSON.stringify(out));
console.log(file, fs.statSync(file).size, 'bytes; shapes', shapes.map(s => s.iso3).join(','));
console.log(JSON.stringify(labels));
