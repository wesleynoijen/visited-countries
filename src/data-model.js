// =============================================================================
//  Domain model.
//  Turns the raw `people` data + the region reference into everything the map
//  and the UI need: who visited what, the summary lists, and the statistics.
//
//  A note on granularity, because the two are deliberately different:
//
//    * the MAP works per region — a week on Ibiza colours Ibiza and leaves
//      mainland Spain and Tenerife grey, which is the whole point of splitting
//      countries up in the first place;
//    * the LISTS work per country — that same week shows up as one "Spain"
//      row. Rolling them up keeps the lists readable: 'NL' alone would
//      otherwise fill twelve rows with provinces nobody thinks of as places
//      they "went to".
// =============================================================================

import { byName } from './util.js';

/**
 * @param {Array} people  raw people from data/people.js
 * @param {object} regions lookup helpers from loadRegions()
 */
export function buildModel(people, regions) {
  const warnings = []; // unknown codes, surfaced in the console

  const normPeople = people.map((person, index) => {
    const ids = new Set();
    const countries = new Set();

    for (const entry of person.countries || []) {
      const match = regions.expand(entry);
      if (!match) {
        warnings.push({ person: person.name, code: entry, suggestions: regions.suggest(entry) });
        continue;
      }
      for (const region of match.regions) {
        ids.add(region.id);
        countries.add(region.country);
      }
    }

    return {
      name: person.name,
      color: person.color,
      index,
      ids,
      countries,
      count: ids.size,
      countryCount: countries.size,
    };
  });

  // visitIndex: region id -> the people who have been there, in input order.
  // This is what the map paints from, so it stays at region granularity.
  const visitIndex = new Map();
  for (const person of normPeople) {
    for (const id of person.ids) {
      if (!visitIndex.has(id)) visitIndex.set(id, []);
      visitIndex.get(id).push(person);
    }
  }

  const countries = rollUpToCountries(regions, visitIndex);
  const totalPeople = normPeople.length;

  // Visited by every single person / by exactly one — both per country.
  const everyone = countries
    .filter((c) => totalPeople > 0 && c.visitors.length === totalPeople)
    .sort(byName);
  const onlyOne = countries.filter((c) => c.visitors.length === 1).sort(byName);

  return {
    people: normPeople,
    visitIndex,
    countries,
    everyone,
    onlyOne,
    visitedCountries: new Set(countries.map((c) => c.id)),
    totalVisited: visitIndex.size,
    continents: continentStats(regions, visitIndex),
    warnings,
  };
}

/**
 * Group every visited region under its country.
 *
 * Somebody counts as having been to a country as soon as they have been to one
 * region of it, so Ibiza puts you in "Spain" without also claiming the
 * mainland — the map still knows the difference.
 *
 * @returns {Array} one entry per visited country, each carrying the region ids
 *   that were actually coloured in (used to frame the map on click).
 */
function rollUpToCountries(regions, visitIndex) {
  const byCountry = new Map();

  for (const [id, visitors] of visitIndex) {
    const region = regions.get(id);
    const code = region?.country ?? id;

    if (!byCountry.has(code)) {
      byCountry.set(code, {
        id: code,
        country: code,
        name: region?.countryName ?? code,
        countryName: region?.countryName ?? code,
        continent: region?.continent ?? null,
        parts: [],
        visitors: new Set(),
      });
    }

    const entry = byCountry.get(code);
    entry.parts.push({ id, name: region?.name ?? id });
    for (const visitor of visitors) entry.visitors.add(visitor);
  }

  return [...byCountry.values()].map((entry) => {
    entry.parts.sort(byName);
    return {
      ...entry,
      parts: entry.parts,
      regionIds: entry.parts.map((p) => p.id),
      regionNames: entry.parts.map((p) => p.name),
      // Back to input order, so "only one of us" names the right person.
      visitors: [...entry.visitors].sort((a, b) => a.index - b.index),
    };
  });
}

/**
 * Per-continent progress: how many of its regions and countries have been
 * visited. Continents with nothing in them at all are left out.
 */
function continentStats(regions, visitIndex) {
  const stats = new Map();

  for (const region of regions.list) {
    const key = region.continent || 'Elsewhere';
    if (!stats.has(key)) {
      stats.set(key, {
        name: key,
        regions: 0,
        visitedRegions: 0,
        countries: new Set(),
        visitedCountries: new Set(),
      });
    }
    const entry = stats.get(key);
    entry.regions += 1;
    entry.countries.add(region.country);
    if (visitIndex.has(region.id)) {
      entry.visitedRegions += 1;
      entry.visitedCountries.add(region.country);
    }
  }

  return [...stats.values()]
    .map((entry) => ({
      name: entry.name,
      regions: entry.regions,
      visitedRegions: entry.visitedRegions,
      countries: entry.countries.size,
      visitedCountries: entry.visitedCountries.size,
      share: entry.countries.size ? entry.visitedCountries.size / entry.countries.size : 0,
    }))
    .sort((a, b) => b.visitedCountries - a.visitedCountries || b.countries - a.countries);
}
