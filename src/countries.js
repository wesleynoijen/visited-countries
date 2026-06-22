// =============================================================================
//  Country reference data (names, ISO codes, regions).
//  Loaded from assets/countries.json and exposed as fast lookup tables.
// =============================================================================

import { normalizeCode } from './util.js';

/**
 * Load the country reference list and build lookup indexes.
 * Resolves to an object with helpers for turning user-supplied codes
 * (alpha-2 or alpha-3, any case) into a canonical country record.
 *
 * @param {string|URL} url location of countries.json
 */
export async function loadCountries(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load countries.json (HTTP ${res.status})`);
  const list = await res.json();

  const byA2 = new Map();
  const byA3 = new Map();
  for (const c of list) {
    if (c.a2) byA2.set(c.a2.toUpperCase(), c);
    if (c.a3) byA3.set(c.a3.toUpperCase(), c);
  }

  /** Resolve an alpha-2/alpha-3 code to a country record, or null. */
  function resolve(code) {
    const cc = normalizeCode(code);
    if (cc.length === 2) return byA2.get(cc) || null;
    if (cc.length === 3) return byA3.get(cc) || null;
    return null;
  }

  return {
    list, // array of { a2, a3, name, region, subregion }
    byA2,
    byA3,
    resolve,
    /** Resolve a code straight to its canonical alpha-3, or null. */
    toA3: (code) => resolve(code)?.a3 ?? null,
    /** Look up a record by canonical alpha-3. */
    get: (a3) => byA3.get(normalizeCode(a3)) || null,
  };
}
