// =============================================================================
//  Export everything on the page as a plain text file.
//
//  Deliberately plain: no CSV quoting rules, no JSON braces, nothing that needs
//  an app to open it. Paste it into a message, print it, keep it in Notes.
//
//  The file is built from the same model the page renders, so what you read in
//  the download is what you were looking at when you pressed the button.
// =============================================================================

import { config } from '../data/config.js';

const INDENT = '  ';

/** Wire up the export button. Does nothing if the button is not on the page. */
export function createExport({ model, regions }) {
  const button = document.getElementById('export-txt');
  if (!button) return;

  button.addEventListener('click', () => {
    save(fileName(), buildReport(model, regions));
  });
}

function buildReport(model, regions) {
  const lines = [
    config.title,
    config.subtitle,
    `Exported ${formatDate(new Date())}`,
    '',
    'SUMMARY',
    `${INDENT}${model.visitedCountries.size} of ${regions.countryCount} countries`,
    `${INDENT}${model.visitIndex.size} of ${regions.list.length} regions`,
    `${INDENT}${model.everyone.length} visited by all, ${model.notEveryone.length} by some`,
    '',
  ];

  for (const person of model.people) {
    lines.push(`${person.name.toUpperCase()} — ${countLabel(person.countryCount)}`);
    for (const line of placesOf(person, regions)) lines.push(INDENT + line);
    if (!person.countryCount) lines.push(`${INDENT}(nowhere yet)`);
    lines.push('');
  }

  lines.push(`VISITED BY ALL — ${countLabel(model.everyone.length)}`);
  lines.push(...listCountries(model.everyone, regions));
  lines.push('');

  lines.push(`VISITED BY SOME — ${countLabel(model.notEveryone.length)}`);
  lines.push(...listCountries(model.notEveryone, regions, true));
  lines.push('');

  lines.push('BY CONTINENT');
  const nameWidth = Math.max(...model.continents.map((c) => c.name.length));
  const countWidth = Math.max(
    ...model.continents.map((c) => `${c.visitedCountries} of ${c.countries}`.length)
  );
  for (const continent of model.continents) {
    const count = `${continent.visitedCountries} of ${continent.countries}`;
    const share = `${Math.round(continent.share * 100)}%`;
    lines.push(
      INDENT + continent.name.padEnd(nameWidth + 2) + count.padEnd(countWidth + 2) + share.padStart(4)
    );
  }

  return lines.join('\n') + '\n';
}

/** One line per country a person has been to, with what they saw of it. */
function placesOf(person, regions) {
  const countries = new Map(); // country code -> the regions visited there

  for (const id of person.ids) {
    const region = regions.get(id);
    if (!region) continue;
    if (!countries.has(region.country)) countries.set(region.country, []);
    countries.get(region.country).push(region);
  }

  return [...countries]
    .map(([code, visited]) => line(regions.countryNames.get(code) || code, visited))
    .sort((a, b) => a.localeCompare(b));
}

function listCountries(items, regions, withVisitors = false) {
  if (!items.length) return [`${INDENT}(none)`];

  return items.map((item) => {
    const visited = item.parts.map((part) => regions.get(part.id)).filter(Boolean);
    const who = withVisitors ? ` — ${item.visitors.map((v) => v.name).join(', ')}` : '';
    return INDENT + line(item.name, visited) + who;
  });
}

/**
 * "Spain (15 regions, Ibiza, Tenerife)".
 *
 * Islands and overseas territories are always named, because they are the
 * reason the map is split up at all. The mainland is named too while there are
 * only a few pieces of it; past that it would be a wall of provinces, so it
 * gets counted instead — nobody needs all 81 Turkish ones spelled out.
 */
function line(countryName, visited) {
  const detached = visited.filter((r) => !r.mainland).map((r) => r.name);
  const mainland = visited.filter((r) => r.mainland).map((r) => r.name);
  detached.sort((a, b) => a.localeCompare(b));
  mainland.sort((a, b) => a.localeCompare(b));

  const parts = [];
  if (mainland.length > 3) parts.push(`${mainland.length} regions`);
  else parts.push(...mainland.filter((name) => name !== countryName));
  parts.push(...detached);

  return parts.length ? `${countryName} (${parts.join(', ')})` : countryName;
}

function countLabel(n) {
  return `${n} ${n === 1 ? 'country' : 'countries'}`;
}

function formatDate(date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fileName() {
  const slug = config.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${slug || 'visited'}-${new Date().toISOString().slice(0, 10)}.txt`;
}

/** Hand the text to the browser as a download and clean up after it. */
function save(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Safari needs the URL to outlive the click, so revoke it on the next tick.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
