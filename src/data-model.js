// =============================================================================
//  Domain model.
//  Turns the raw `people` data + country reference into everything the UI and
//  map need: who visited what, the two summary lists, and stats.
// =============================================================================

import { byName } from './util.js';

/**
 * @param {Array} people    raw people from data/people.js
 * @param {object} countries lookup helpers from loadCountries()
 */
export function buildModel(people, countries) {
  const warnings = []; // unknown codes, surfaced in the console

  // Normalise each person's visited list to a Set of canonical alpha-3 codes.
  const normPeople = people.map((p, index) => {
    const a3 = new Set();
    for (const raw of p.countries || []) {
      const code = countries.toA3(raw);
      if (code) a3.add(code);
      else warnings.push({ person: p.name, code: raw });
    }
    return { name: p.name, color: p.color, index, a3, count: a3.size };
  });

  // visitIndex: alpha-3 -> people who visited it (kept in input order).
  const visitIndex = new Map();
  for (const person of normPeople) {
    for (const code of person.a3) {
      if (!visitIndex.has(code)) visitIndex.set(code, []);
      visitIndex.get(code).push(person);
    }
  }

  const totalPeople = normPeople.length;
  const everyone = []; // visited by every person (intersection)
  const onlyOne = []; // visited by exactly one person (unique)

  const decorate = (a3) => {
    const rec = countries.get(a3);
    return {
      a3,
      a2: rec?.a2 ?? null,
      name: rec?.name ?? a3,
      region: rec?.region ?? null,
      visitors: visitIndex.get(a3),
    };
  };

  for (const [a3, visitors] of visitIndex) {
    if (totalPeople > 0 && visitors.length === totalPeople) everyone.push(decorate(a3));
    if (visitors.length === 1) onlyOne.push(decorate(a3));
  }
  everyone.sort(byName);
  onlyOne.sort(byName);

  return {
    people: normPeople,
    visitIndex,
    everyone,
    onlyOne,
    totalVisited: visitIndex.size, // distinct countries anyone has visited (union)
    warnings,
  };
}
