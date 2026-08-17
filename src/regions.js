// =============================================================================
//  Region reference data and the code resolver.
//
//  A "region" is the smallest thing you can colour in: a whole country, one of
//  its states, or an island group that sits apart from its mainland.
//
//  What you may write in data/people.js:
//
//    'ES'      the mainland only — Spain without the Canaries or Balearics
//    'ES*'     the whole country, islands and overseas territories included
//    'ES-CN'   one specific region, by its ISO 3166-2 code
//    'Tenerife'  a region by name or nickname (case and accents ignored)
//
//  Unknown codes never fail silently: they come back as warnings with the
//  closest matches, so a typo is easy to spot in the browser console.
// =============================================================================

import { normalizeCode, foldName } from './util.js';

/**
 * Load assets/regions.json and build every lookup the app needs.
 * @param {string|URL} url
 */
export async function loadRegions(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load regions.json (HTTP ${res.status})`);
  const list = await res.json();

  const byId = new Map(); // 'ES-CN' -> region
  const byName = new Map(); // folded name or alias -> region
  const byCountry = new Map(); // 'ES' -> [regions]

  for (const region of list) {
    byId.set(region.id.toUpperCase(), region);

    if (!byCountry.has(region.country)) byCountry.set(region.country, []);
    byCountry.get(region.country).push(region);

    // Names and aliases both resolve; first one wins so real names beat
    // nicknames when two regions happen to share a word.
    for (const label of [region.name, ...(region.aliases || [])]) {
      const key = foldName(label);
      if (key && !byName.has(key)) byName.set(key, region);
    }
  }

  const countryNames = new Map();
  for (const region of list) countryNames.set(region.country, region.countryName);

  /**
   * Turn one entry from data/people.js into the regions it covers.
   * @param {string} input
   * @returns {{regions: object[], kind: string}|null}
   */
  function expand(input) {
    const raw = String(input ?? '').trim();
    if (!raw) return null;

    const wholeCountry = raw.endsWith('*');
    const code = normalizeCode(wholeCountry ? raw.slice(0, -1) : raw);

    if (wholeCountry) {
      const regions = byCountry.get(code);
      return regions ? { regions: [...regions], kind: 'country' } : null;
    }

    // An exact region code always wins — 'TH' is Thailand, 'ES-CN' the Canaries.
    const exact = byId.get(code);
    if (exact) return { regions: [exact], kind: 'region' };

    // A country code on its own means everything attached to the mainland.
    const inCountry = byCountry.get(code);
    if (inCountry) {
      const mainland = inCountry.filter((r) => r.mainland);
      return { regions: mainland.length ? mainland : [...inCountry], kind: 'mainland' };
    }

    const named = byName.get(foldName(raw));
    if (named) return { regions: [named], kind: 'name' };

    return null;
  }

  /** Regions whose name, nickname or code look like `input` — used on typos. */
  function suggest(input, limit = 4) {
    const needle = foldName(input);
    const code = normalizeCode(input);
    if (!needle) return [];

    const hits = [];
    for (const region of list) {
      let best = null;
      for (const label of [region.name, region.countryName, ...(region.aliases || [])]) {
        const folded = foldName(label);
        if (!folded) continue;
        // A typo usually shares a prefix, so try both directions.
        const score =
          folded === needle
            ? 0
            : folded.startsWith(needle) || needle.startsWith(folded)
              ? 1
              : folded.includes(needle)
                ? 2
                : null;
        if (score !== null && (best === null || score < best)) best = score;
      }
      if (best === null && code.length >= 2 && region.id.toUpperCase().includes(code)) best = 3;

      // Nothing matched by substring: fall back to near-misses, so a genuine
      // typo ('Canarie', 'Sicilly') still points at the right region.
      if (best === null) {
        const budget = typoBudget(needle);
        for (const label of [region.name, ...(region.aliases || [])]) {
          const distance = editDistance(needle, foldName(label), budget);
          if (distance <= budget && (best === null || 4 + distance < best)) best = 4 + distance;
        }
      }

      if (best !== null) hits.push({ region, score: best });
    }

    hits.sort((a, b) => a.score - b.score || a.region.name.localeCompare(b.region.name));
    return hits.slice(0, limit).map((h) => `${h.region.name} (${h.region.id})`);
  }

  return {
    list,
    byId,
    byCountry,
    countryNames,
    expand,
    suggest,
    get: (id) => byId.get(normalizeCode(id)) || null,
    /** How many distinct countries the whole dataset covers. */
    countryCount: byCountry.size,
  };
}

/** How many characters a name of this length is allowed to be wrong by. */
function typoBudget(needle) {
  if (needle.length < 4) return 0; // too short to guess at
  return needle.length <= 8 ? 1 : 2;
}

/**
 * Levenshtein distance, abandoned as soon as it exceeds `max`. Only ever runs
 * on entries that failed every cheaper test, so the cost stays negligible.
 */
function editDistance(a, b, max) {
  if (max <= 0) return a === b ? 0 : 1;
  if (Math.abs(a.length - b.length) > max) return max + 1;

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let rowBest = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
      if (current[j] < rowBest) rowBest = current[j];
    }
    if (rowBest > max) return max + 1; // no cell in this row can recover
    previous = current;
  }
  return previous[b.length];
}
