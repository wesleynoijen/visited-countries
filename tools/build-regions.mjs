#!/usr/bin/env node
// =============================================================================
//  BUILD REGIONS
//
//  Turns Natural Earth's admin-0 / admin-1 data into the two files the app
//  needs:
//
//    assets/world-regions.geojson  one polygon per region, keyed by region id
//    assets/regions.json           the reference list (names, countries, flags)
//    REGIONS.md                    a human-readable table of every code
//
//  The interesting part is how a country becomes regions:
//
//    1. Its admin-1 units are merged up to a recognisable level where Natural
//       Earth is too fine-grained (see AGGREGATE_BY in region-rules.mjs).
//    2. Units are clustered into landmasses: anything within CLUSTER_DISTANCE_KM
//       of another unit belongs to the same landmass.
//    3. The landmass holding the country's capital is the mainland.
//    4. Countries in SPLIT_COUNTRIES keep every unit as its own region.
//       Every other country becomes ONE region for its mainland, plus a region
//       for each detached landmass big enough to be a destination of its own
//       (Galápagos, Zanzibar, Sabah…).
//
//  That is what makes `ES` mean mainland Spain while `ES-CN` is the Canaries.
//
//  Usage:  node tools/build-regions.mjs [--cache <dir>]
//  Requires: npx mapshaper (installed on demand)
// =============================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AGGREGATE_BY,
  AGGREGATE_META,
  ALIASES,
  ARCHIPELAGO_COUNTRIES,
  CLUSTER_DISTANCE_KM,
  DETACHED_NAMES,
  FORCE_DETACHED,
  FORCE_REGIONS,
  MIN_COUNTRY_AREA_KM2,
  MIN_DETACHED_AREA_KM2,
  NEVER_SPLIT,
  SPLIT_COUNTRIES,
} from './region-rules.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson';
const SOURCES = {
  admin1: `${NE}/ne_10m_admin_1_states_provinces.geojson`,
  admin0: `${NE}/ne_10m_admin_0_countries.geojson`,
  places: `${NE}/ne_10m_populated_places_simple.geojson`,
};

const cacheDir = argValue('--cache') || join(ROOT, '.cache');
const EARTH_R = 6371; // km

main();

function main() {
  mkdirSync(cacheDir, { recursive: true });

  const admin1 = load('admin1');
  const admin0 = load('admin0');
  const places = load('places');

  const countries = indexCountries(admin0);
  const capitals = indexCapitals(places);

  console.log(`Natural Earth: ${admin1.features.length} admin-1 units in ${countries.size} countries`);

  const { regions, assignments } = buildRegions(admin1, countries, capitals);
  console.log(`Built ${regions.length} regions`);

  const built = writeGeometry(admin1, assignments);
  const kept = verify(regions, built);
  writeReference(kept);
  writeMarkdown(kept);

  report(kept);
}

// -----------------------------------------------------------------------------
//  Region construction
// -----------------------------------------------------------------------------

function buildRegions(admin1, countries, capitals) {
  const byCountry = new Map();
  for (const f of admin1.features) {
    const a3 = f.properties.adm0_a3;
    if (!byCountry.has(a3)) byCountry.set(a3, []);
    byCountry.get(a3).push(f);
  }

  const regions = [];
  const assignments = new Map(); // ne_id -> region id
  const used = new Set([...countries.values()].map((c) => c.a2)); // country codes are reserved

  for (const [a3, features] of [...byCountry].sort((a, b) => a[0].localeCompare(b[0]))) {
    const country = countries.get(a3);
    if (!country) continue;

    const units = groupIntoUnits(a3, features, country, used);
    for (const u of units) {
      u.area = u.features.reduce((sum, f) => sum + geometryArea(f.geometry), 0);
      u.points = decimate(u.features);
      u.bbox = bboxOf(u.points);
    }

    const clusters = clusterUnits(units);
    const mainIndex = pickMainland(clusters, capitals.get(a3));

    const split = SPLIT_COUNTRIES.has(a3);
    const countryArea = units.reduce((sum, u) => sum + u.area, 0);
    const canDetach =
      !NEVER_SPLIT.has(a3) &&
      !ARCHIPELAGO_COUNTRIES.has(a3) &&
      countryArea >= MIN_COUNTRY_AREA_KM2 &&
      clusters.length > 1;

    clusters.forEach((cluster, ci) => {
      const isMainland = ci === mainIndex;

      if (split) {
        // Every unit is its own region; the cluster only decides `mainland`.
        for (const unit of cluster) {
          regions.push(makeRegion(unit.id, unit.name, country, isMainland, unit.area));
          for (const f of unit.features) assignments.set(f.properties.ne_id, unit.id);
        }
        return;
      }

      const forced = cluster.some((u) => u.isolate);
      const detach =
        !isMainland && (forced || (canDetach && clusterArea(cluster) >= MIN_DETACHED_AREA_KM2));
      if (isMainland || !detach) {
        // Folded into the country's single main region.
        const id = country.a2;
        if (!regions.some((r) => r.id === id)) {
          regions.push(makeRegion(id, country.name, country, true, 0));
        }
        const region = regions.find((r) => r.id === id);
        region.area += clusterArea(cluster);
        for (const unit of cluster) for (const f of unit.features) assignments.set(f.properties.ne_id, id);
        return;
      }

      // A detached landmass worth colouring in on its own.
      const lead = [...cluster].sort((a, b) => b.area - a.area)[0];
      const id = lead.id;
      const name = DETACHED_NAMES[id] || lead.name;
      regions.push(makeRegion(id, name, country, false, clusterArea(cluster)));
      for (const unit of cluster) for (const f of unit.features) assignments.set(f.properties.ne_id, id);
    });
  }

  // De-duplicate ids defensively: two units must never claim the same code.
  const seen = new Map();
  for (const r of regions) {
    if (!seen.has(r.id)) {
      seen.set(r.id, r);
      continue;
    }
    console.warn(`  ! duplicate region id ${r.id} (${r.name} / ${seen.get(r.id).name})`);
  }

  regions.sort((a, b) => a.countryName.localeCompare(b.countryName) || a.name.localeCompare(b.name));
  return { regions, assignments };
}

/** Merge admin-1 features into the units that become regions. */
function groupIntoUnits(a3, features, country, used) {
  const field = AGGREGATE_BY[a3];
  const groups = new Map();
  const forced = new Map(); // ISO 3166-2 code -> forced group definition

  for (const group of FORCE_REGIONS[a3] || []) {
    for (const code of group.units) forced.set(code, group);
  }

  for (const f of features) {
    const p = f.properties;
    const force = forced.get(cleanIso(p.iso_3166_2));
    const key = force ? `!${force.id}` : field ? String(p[field] || '').trim() : String(p.ne_id);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(f);
  }

  const units = [];
  const unnamed = [];

  for (const [key, group] of groups) {
    if (key.startsWith('!')) {
      const def = (FORCE_REGIONS[a3] || []).find((g) => `!${g.id}` === key);
      units.push({
        id: claim(def.id, def.id, used),
        name: def.name,
        features: group,
        isolate: true,
      });
      continue;
    }

    const p = group[0].properties;
    let preferred;
    let name;

    if (field) {
      const meta = AGGREGATE_META[`${a3}|${key}`];
      if (meta) {
        [preferred, name] = meta;
      } else {
        preferred = isoPrefix(group);
        name = key || p.name_en || p.name;
        console.warn(`  ? no AGGREGATE_META for ${a3}|${key} — falling back`);
      }
    } else {
      preferred = cleanIso(p.iso_3166_2);
      name = p.name_en || p.name;
    }

    // Natural Earth leaves some slivers and reefs without a name at all. They
    // should not become regions you can "visit" — fold them into a real one.
    if (!name) {
      unnamed.push(...group);
      continue;
    }

    const id = claim(preferred, `${country.a2}-${slug(name)}`, used);
    units.push({ id, name, features: group });
  }

  for (const f of unnamed) nearestUnit(f, units)?.features.push(f);
  return units;
}

/**
 * Take the first free id: the ISO code if it is available, otherwise a code
 * built from the region's own name — Lord Howe Island shares New South Wales'
 * ISO code, and `AU-LORDHOWE` reads a lot better than `AU-NSW2`.
 */
function claim(preferred, fallback, used) {
  for (const candidate of [preferred, fallback]) {
    if (!candidate || used.has(candidate)) continue;
    used.add(candidate);
    return candidate;
  }
  for (let n = 2; ; n++) {
    const candidate = `${fallback}-${n}`;
    if (used.has(candidate)) continue;
    used.add(candidate);
    return candidate;
  }
}

/** The unit whose shape lies closest to a stray feature. */
function nearestUnit(feature, units) {
  if (!units.length) return null;
  const points = decimate([feature], 40);
  let best = null;
  let bestDistance = Infinity;
  for (const unit of units) {
    const d = minDistanceKm(points, unit.points || (unit.points = decimate(unit.features)));
    if (d < bestDistance) {
      bestDistance = d;
      best = unit;
    }
  }
  return best;
}

/** Group units into landmasses: within CLUSTER_DISTANCE_KM = same landmass. */
function clusterUnits(units) {
  const parent = units.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };

  for (let i = 0; i < units.length; i++) {
    if (units[i].isolate) continue; // forced regions never merge into a neighbour
    for (let j = i + 1; j < units.length; j++) {
      if (units[j].isolate || find(i) === find(j)) continue;
      if (bboxGapKm(units[i].bbox, units[j].bbox) > CLUSTER_DISTANCE_KM) continue;
      if (minDistanceKm(units[i].points, units[j].points) <= CLUSTER_DISTANCE_KM) union(i, j);
    }
  }

  const groups = new Map();
  units.forEach((u, i) => {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(u);
  });
  return [...groups.values()];
}

/** The landmass holding the capital is the mainland; area decides otherwise. */
function pickMainland(clusters, capital) {
  if (capital) {
    for (let i = 0; i < clusters.length; i++) {
      for (const unit of clusters[i]) {
        if (!inBbox(capital, unit.bbox, 0.5)) continue;
        if (unit.features.some((f) => pointInGeometry(capital, f.geometry))) return i;
      }
    }
  }
  let best = 0;
  let bestArea = -1;
  clusters.forEach((c, i) => {
    const a = clusterArea(c);
    if (a > bestArea) {
      bestArea = a;
      best = i;
    }
  });
  return best;
}

function makeRegion(id, name, country, mainland, area) {
  return {
    id,
    name,
    country: country.a2,
    countryName: country.name,
    continent: continentOf(country),
    subregion: country.subregion,
    mainland: mainland && !FORCE_DETACHED.has(id),
    area: Math.round(area),
  };
}

/** Natural Earth files scattered islands under "Seven seas (open ocean)". */
function continentOf(country) {
  if (country.continent !== 'Seven seas (open ocean)') return country.continent;
  return /Caribbean|America/.test(country.subregion || '') ? 'North America' : 'Oceania';
}

function clusterArea(cluster) {
  return cluster.reduce((sum, u) => sum + u.area, 0);
}

// -----------------------------------------------------------------------------
//  Outputs
// -----------------------------------------------------------------------------

/** Tag every admin-1 feature with its region id, then dissolve and simplify. */
function writeGeometry(admin1, assignments) {
  const tagged = {
    type: 'FeatureCollection',
    features: [],
  };
  for (const f of admin1.features) {
    const id = assignments.get(f.properties.ne_id);
    if (!id) continue;
    tagged.features.push({
      type: 'Feature',
      properties: { id },
      geometry: f.geometry,
    });
  }

  const tmp = join(cacheDir, 'tagged.geojson');
  writeFileSync(tmp, JSON.stringify(tagged));
  console.log(`Tagged ${tagged.features.length} features; dissolving…`);

  // One simplification setting cannot serve both Russia and Santorini. Vertex
  // budgets are spent globally, so a percentage that keeps continents at a sane
  // size wipes small islands off the map entirely, and `keep-shapes` only
  // guarantees a region keeps *one* of its parts. Coordinate rounding has the
  // same problem: 0.004° is 440 m, which collapses the Vatican outright.
  //
  // So each part of the world is simplified at the scale it deserves, and the
  // three passes are stitched back together below by part area.
  const coarse = simplify(tmp, 'coarse', {
    // Continents and big islands: aggressive, since 4% of a 10m coastline is
    // still far more detail than a world map at zoom 9 can show.
    filter: 'min-area=1km2',
    steps: ['-simplify', 'visvalingam', 'weighted', 'percentage=4%', 'keep-shapes', '-clean'],
    precision: 'precision=0.004',
  });
  const fine = simplify(tmp, 'fine', {
    // Islands: a fixed 900 m tolerance, so shape quality no longer depends on
    // how big the island happens to be.
    filter: 'min-area=0.2km2',
    steps: ['-simplify', 'visvalingam', 'weighted', 'interval=900', 'keep-shapes'],
    precision: 'precision=0.004',
  });
  const raw = simplify(tmp, 'raw', {
    // Microstates and islets: untouched. They have so few vertices that full
    // detail costs almost nothing, and anything less erases them.
    filter: 'min-area=0.05km2',
    steps: [],
    precision: 'precision=0.0002',
  });

  const out = join(ROOT, 'assets', 'world-regions.geojson');
  const built = stitch([
    { source: coarse, min: 1500 }, // km² — continents and large islands
    { source: fine, min: 10 }, //          islands
    { source: raw, min: 0 }, //            islets and microstates
  ]);
  writeFileSync(out, JSON.stringify(built));
  console.log(`Wrote ${out} — ${built.features.length} features, ${sizeOf(out)}`);
  return built;
}

/** Run one simplification pass over the tagged features. */
function simplify(input, name, { filter, steps, precision }) {
  const out = join(cacheDir, `pass-${name}.geojson`);
  mapshaper([
    input,
    '-dissolve', 'id',
    '-filter-islands', filter, 'remove-empty',
    ...steps,
    '-o', precision, 'format=geojson', out,
  ]);
  return JSON.parse(readFileSync(out, 'utf8'));
}

/**
 * Rebuild each region from whichever pass suits each of its parts: the mainland
 * from the coarse pass, its islands from the fine one, its islets from the raw
 * one. Passes are listed largest-first and each claims the parts above its
 * threshold that no earlier pass took.
 */
function stitch(passes) {
  const indexed = passes.map((p) => ({
    min: p.min,
    byId: new Map(p.source.features.map((f) => [f.properties.id, f])),
  }));

  const ids = new Set(indexed.flatMap((p) => [...p.byId.keys()]));
  const features = [];

  for (const id of ids) {
    const rings = [];
    let ceiling = Infinity;
    for (const pass of indexed) {
      for (const part of polygonsOf(pass.byId.get(id))) {
        const size = geometryArea({ type: 'Polygon', coordinates: part });
        if (size > pass.min && size <= ceiling) rings.push(part);
      }
      ceiling = pass.min;
    }
    if (!rings.length) continue; // reported by verify()

    features.push({
      type: 'Feature',
      properties: { id },
      geometry:
        rings.length === 1
          ? { type: 'Polygon', coordinates: rings[0] }
          : { type: 'MultiPolygon', coordinates: rings },
    });
  }

  features.sort((a, b) => a.properties.id.localeCompare(b.properties.id));
  return { type: 'FeatureCollection', features };
}

/** Every polygon of a feature, as an array of ring-arrays. */
function polygonsOf(feature) {
  const geometry = feature?.geometry;
  if (!geometry) return [];
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  return [];
}

function writeReference(regions) {
  const ids = new Set(regions.map((r) => r.id));
  for (const key of Object.keys(ALIASES)) {
    if (!ids.has(key)) console.warn(`  ! ALIASES has no region "${key}" — check region-rules.mjs`);
  }

  const payload = regions.map((r) => {
    const entry = {
      id: r.id,
      name: r.name,
      country: r.country,
      countryName: r.countryName,
      continent: r.continent,
      subregion: r.subregion,
      mainland: r.mainland,
    };
    if (ALIASES[r.id]) entry.aliases = ALIASES[r.id];
    return entry;
  });
  const path = join(ROOT, 'assets', 'regions.json');
  writeFileSync(path, JSON.stringify(payload));
  console.log(`Wrote ${path} — ${payload.length} regions, ${sizeOf(path)}`);
}

function writeMarkdown(regions) {
  const byCountry = new Map();
  for (const r of regions) {
    if (!byCountry.has(r.countryName)) byCountry.set(r.countryName, []);
    byCountry.get(r.countryName).push(r);
  }

  const lines = [
    '# Region reference',
    '',
    'Every code you can put in [`data/people.js`](data/people.js). Generated by',
    '`node tools/build-regions.mjs` — edit [`tools/region-rules.mjs`](tools/region-rules.mjs)',
    'and re-run it rather than editing this file.',
    '',
    'You can also write a region **name** instead of its code (`\'Canary Islands\'`,',
    "`'Sicily'`, `'Tenerife'`) — matching ignores case and accents.",
    '',
    'A bare country code means **the mainland only**: `ES` is mainland Spain, and',
    'the Canaries, Balearics, Ceuta and Melilla stay uncoloured until you add them.',
    'Write `ES*` when you want the whole country, islands included.',
    '',
    `${regions.length} regions across ${byCountry.size} countries and territories.`,
    '',
  ];

  for (const [countryName, list] of [...byCountry].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`## ${countryName}`);
    lines.push('');
    lines.push('| Code | Region | Mainland | Also answers to |');
    lines.push('| --- | --- | --- | --- |');
    for (const r of list.sort((a, b) => a.name.localeCompare(b.name))) {
      const also = (ALIASES[r.id] || []).join(', ');
      lines.push(`| \`${r.id}\` | ${r.name} | ${r.mainland ? 'yes' : 'no'} | ${also} |`);
    }
    lines.push('');
  }

  const path = join(ROOT, 'REGIONS.md');
  writeFileSync(path, lines.join('\n'));
  console.log(`Wrote ${path} — ${sizeOf(path)}`);
}

/**
 * Simplifying can erase a region made only of very small islands. Rather than
 * shipping a code you can type but never see, drop it — and say so, loudly.
 */
function verify(regions, built) {
  // Note the geometry check: a feature can survive simplification as an entry
  // with `geometry: null`, which looks fine in a feature count and draws
  // nothing at all. That is how the Vatican went missing once.
  const drawn = new Set(
    built.features.filter((f) => polygonsOf(f).length > 0).map((f) => f.properties.id)
  );
  const kept = regions.filter((r) => drawn.has(r.id));
  for (const r of regions) {
    if (!drawn.has(r.id)) {
      console.warn(`  ! ${r.id} (${r.name}, ${r.countryName}) has no geometry left — dropped`);
    }
  }
  for (const id of drawn) {
    if (!kept.some((r) => r.id === id)) console.warn(`  ! geometry ${id} has no region entry`);
  }
  return kept;
}

function report(regions) {
  const detached = regions.filter((r) => !r.mainland);
  const perCountry = new Map();
  for (const r of regions) perCountry.set(r.country, (perCountry.get(r.country) || 0) + 1);
  const multi = [...perCountry.values()].filter((n) => n > 1).length;

  console.log(`\n${regions.length} regions across ${perCountry.size} countries and territories.`);
  console.log(`${multi} of those countries have more than one region.`);
  console.log(`${detached.length} regions sit away from their country's mainland.\n`);
  console.log('Detached regions — these are the ones worth eyeballing:');
  for (const r of detached) {
    console.log(`  ${r.id.padEnd(10)} ${r.name} — ${r.countryName}`);
  }
}

// -----------------------------------------------------------------------------
//  Geometry helpers (spherical, good enough at these thresholds)
// -----------------------------------------------------------------------------

function eachRing(geometry, fn) {
  if (!geometry) return;
  if (geometry.type === 'Polygon') geometry.coordinates.forEach(fn);
  else if (geometry.type === 'MultiPolygon') {
    for (const poly of geometry.coordinates) poly.forEach(fn);
  }
}

/** Spherical polygon area in km² (outer rings only — holes are negligible here). */
function geometryArea(geometry) {
  let total = 0;
  const polys =
    geometry?.type === 'Polygon'
      ? [geometry.coordinates]
      : geometry?.type === 'MultiPolygon'
        ? geometry.coordinates
        : [];
  for (const poly of polys) total += Math.abs(ringArea(poly[0]));
  return total;
}

function ringArea(ring) {
  let total = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [lon1, lat1] = ring[i];
    const [lon2, lat2] = ring[i + 1];
    total += toRad(lon2 - lon1) * (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
  }
  return (total * EARTH_R * EARTH_R) / 2;
}

/** Up to `max` evenly spread vertices, enough to measure gaps between shapes. */
function decimate(features, max = 500) {
  const all = [];
  for (const f of features) eachRing(f.geometry, (ring) => all.push(...ring));
  if (all.length <= max) return all;
  const step = all.length / max;
  const out = [];
  for (let i = 0; i < max; i++) out.push(all[Math.floor(i * step)]);
  return out;
}

function bboxOf(points) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of points) {
    if (x < b[0]) b[0] = x;
    if (y < b[1]) b[1] = y;
    if (x > b[2]) b[2] = x;
    if (y > b[3]) b[3] = y;
  }
  return b;
}

/** Lower bound on the distance between two shapes, from their bounding boxes. */
function bboxGapKm(a, b) {
  const dx = Math.max(0, Math.max(a[0] - b[2], b[0] - a[2]));
  const dy = Math.max(0, Math.max(a[1] - b[3], b[1] - a[3]));
  const lat = Math.max(-80, Math.min(80, (a[1] + a[3] + b[1] + b[3]) / 4));
  const kmX = dx * 111.32 * Math.cos(toRad(lat));
  const kmY = dy * 110.57;
  return Math.hypot(kmX, kmY);
}

function minDistanceKm(a, b) {
  let best = Infinity;
  for (const p of a) {
    for (const q of b) {
      const d = haversine(p, q);
      if (d < best) {
        best = d;
        if (best <= 1) return best;
      }
    }
  }
  return best;
}

function haversine([lon1, lat1], [lon2, lat2]) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(s)));
}

function inBbox([x, y], b, pad = 0) {
  return x >= b[0] - pad && x <= b[2] + pad && y >= b[1] - pad && y <= b[3] + pad;
}

function pointInGeometry(point, geometry) {
  const polys =
    geometry?.type === 'Polygon'
      ? [geometry.coordinates]
      : geometry?.type === 'MultiPolygon'
        ? geometry.coordinates
        : [];
  for (const poly of polys) {
    if (!pointInRing(point, poly[0])) continue;
    const inHole = poly.slice(1).some((hole) => pointInRing(point, hole));
    if (!inHole) return true;
  }
  return false;
}

function pointInRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

// -----------------------------------------------------------------------------
//  Reference data helpers
// -----------------------------------------------------------------------------

/**
 * Country reference keyed by ISO alpha-3, each with a code that is unique
 * across the whole dataset.
 *
 * Natural Earth's ISO_A2_EH field fills in the *sovereign* code for dependent
 * territories, so Clipperton Island also calls itself "FR". We hand out the
 * plain ISO_A2 codes first, then the extended ones, then fall back to alpha-3 —
 * that way France keeps `FR` and Clipperton becomes `CLP`.
 */
function indexCountries(admin0) {
  const entries = [];
  const seen = new Set();
  for (const f of admin0.features) {
    const p = f.properties;
    const a3 = p.ADM0_A3;
    if (!a3 || seen.has(a3)) continue;
    seen.add(a3);
    entries.push({
      a3,
      a2: null,
      name: p.NAME_EN || p.NAME,
      continent: p.CONTINENT,
      subregion: p.SUBREGION,
      strict: valid(p.ISO_A2),
      extended: valid(p.ISO_A2_EH),
    });
  }

  const taken = new Set();
  const assign = (entry, code) => {
    if (entry.a2 || !code || taken.has(code)) return;
    entry.a2 = code;
    taken.add(code);
  };
  for (const entry of entries) assign(entry, entry.strict);
  for (const entry of entries) assign(entry, entry.extended);
  for (const entry of entries) {
    if (!entry.a2) assign(entry, entry.a3);
    if (!entry.a2) console.warn(`  ! no free code for ${entry.name} (${entry.a3})`);
  }

  const map = new Map();
  for (const entry of entries) {
    delete entry.strict;
    delete entry.extended;
    map.set(entry.a3, entry);
  }
  return map;
}

function indexCapitals(places) {
  const map = new Map();
  for (const f of places.features) {
    if (f.properties.featurecla !== 'Admin-0 capital') continue;
    const a3 = f.properties.adm0_a3 || f.properties.sov_a3;
    if (!a3 || map.has(a3)) continue;
    map.set(a3, f.geometry.coordinates);
  }
  return map;
}

function valid(v) {
  return v && v !== '-99' && v !== '-' ? String(v).toUpperCase() : null;
}

/**
 * A usable ISO 3166-2 code, or null. Natural Earth fills gaps with placeholders
 * like `AU-X03~` and `-99-X02~`; those are not codes anybody should type.
 */
function cleanIso(code) {
  const c = valid(code);
  if (!c || !c.includes('-') || c.startsWith('-99')) return null;
  return /~|-X\d/.test(c) ? null : c;
}

/** The ISO 3166-2 code shared by a whole group, when there is exactly one. */
function isoPrefix(group) {
  const codes = new Set(group.map((f) => cleanIso(f.properties.iso_3166_2)).filter(Boolean));
  return codes.size === 1 ? [...codes][0] : null;
}

/** A short, readable code fragment from a region name. */
function slug(s) {
  const cleaned = String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // "Islands", "Archipelago" and friends add length without adding meaning.
    .replace(/\b(islands?|isla?s?|archipelago|territory|prefecture|province)\b/gi, ' ')
    .replace(/[^A-Za-z0-9]+/g, '')
    .toUpperCase();
  return cleaned.slice(0, 10) || 'X';
}

// -----------------------------------------------------------------------------
//  Plumbing
// -----------------------------------------------------------------------------

function load(name) {
  const path = join(cacheDir, `${name}.geojson`);
  if (!existsSync(path)) {
    console.log(`Downloading ${name}…`);
    execFileSync('curl', ['-sSL', '--fail', '-o', path, SOURCES[name]], { stdio: 'inherit' });
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

function mapshaper(args) {
  const local = join(ROOT, 'node_modules', '.bin', 'mapshaper');
  const bin = existsSync(local) ? local : 'npx';
  const argv = bin === 'npx' ? ['--yes', 'mapshaper@0.6.102', ...args] : args;
  execFileSync(bin, argv, { stdio: 'inherit', maxBuffer: 1 << 28 });
}

function sizeOf(path) {
  const bytes = readFileSync(path).length;
  return bytes > 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : null;
}
