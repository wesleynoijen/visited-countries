// =============================================================================
//  Renders everything that is not the map: header, statistics, the per-
//  continent progress bars, the traveller legend and the two lists.
//
//  The two lists are per COUNTRY, not per region: one "Netherlands" row rather
//  than twelve provinces. Tapping a row still frames exactly the regions that
//  were coloured in, so Spain zooms to Ibiza alone if that is all you visited.
// =============================================================================

import { config } from '../data/config.js';
import { flagEmoji, el, colorDot } from './util.js';

export function renderUI({ model, regions, onFocus }) {
  document.getElementById('app-title').textContent = config.title;
  document.getElementById('app-subtitle').textContent = config.subtitle;
  document.title = config.title;

  renderStats(model, regions);
  renderPeople(model);
  renderContinents(model);
  renderCountryList('everyone', model.everyone, {
    onFocus,
    empty: 'No country has been visited by everyone yet.',
  });
  renderCountryList('onlyone', model.onlyOne, {
    onFocus,
    showVisitor: true,
    empty: 'No country has been visited by exactly one person.',
  });
}

function renderStats(model, regions) {
  const stats = [
    {
      value: model.visitedCountries.size,
      label: 'Countries',
      sub: `of ${regions.countryCount}`,
    },
    {
      value: model.totalVisited,
      label: 'Regions',
      sub: `of ${regions.list.length}`,
    },
    { value: model.everyone.length, label: 'Visited by all', sub: 'countries' },
    { value: model.onlyOne.length, label: 'Unique to one', sub: 'countries' },
  ];

  const root = document.getElementById('stats');
  root.replaceChildren();
  for (const s of stats) {
    const tile = el('div', { className: 'stat' });
    tile.appendChild(el('span', { className: 'stat-value', text: String(s.value) }));
    tile.appendChild(el('span', { className: 'stat-label', text: s.label }));
    if (s.sub) tile.appendChild(el('span', { className: 'stat-sub', text: s.sub }));
    root.appendChild(tile);
  }
}

function renderPeople(model) {
  const root = document.getElementById('people');
  root.replaceChildren();
  for (const p of model.people) {
    const chip = el('div', { className: 'person' });
    chip.appendChild(colorDot(p.color, { ring: true }));
    chip.appendChild(el('span', { className: 'person-name', text: p.name }));
    const counts = el('span', { className: 'person-count' });
    counts.appendChild(el('strong', { text: String(p.countryCount) }));
    counts.appendChild(el('span', { text: p.countryCount === 1 ? ' country' : ' countries' }));
    chip.appendChild(counts);
    root.appendChild(chip);
  }
}

function renderContinents(model) {
  const section = document.getElementById('continents');
  const body = section.querySelector('.list-body');
  body.replaceChildren();

  const totalCountries = model.continents.reduce((sum, c) => sum + c.countries, 0);
  const visitedCountries = model.continents.reduce((sum, c) => sum + c.visitedCountries, 0);
  const percent = totalCountries ? Math.round((visitedCountries / totalCountries) * 100) : 0;
  section.querySelector('.list-count').textContent = `${percent}% of the world`;

  for (const continent of model.continents) {
    if (!continent.countries) continue;

    const row = el('div', { className: 'continent' });

    const head = el('div', { className: 'continent-head' });
    head.appendChild(el('span', { className: 'continent-name', text: continent.name }));
    head.appendChild(
      el('span', {
        className: 'continent-count',
        text: `${continent.visitedCountries}/${continent.countries}`,
      })
    );
    row.appendChild(head);

    const track = el('div', { className: 'bar' });
    const fill = el('div', { className: 'bar-fill' });
    // A sliver of colour reads better than an empty track for 1-of-50.
    fill.style.width = continent.share > 0 ? `${Math.max(2, continent.share * 100)}%` : '0';
    track.appendChild(fill);
    row.appendChild(track);

    if (continent.visitedRegions > continent.visitedCountries) {
      row.appendChild(
        el('span', {
          className: 'continent-sub',
          text: `${continent.visitedRegions} regions visited`,
        })
      );
    }

    body.appendChild(row);
  }
}

/** How many rows to show before collapsing a list behind a button. */
const LIST_PREVIEW = 25;

function renderCountryList(sectionId, items, { onFocus, showVisitor = false, empty }) {
  const section = document.getElementById(sectionId);
  section.querySelector('.list-count').textContent = String(items.length);
  const body = section.querySelector('.list-body');
  body.replaceChildren();

  if (items.length === 0) {
    body.appendChild(el('p', { className: 'list-empty', text: empty }));
    return;
  }

  // Well-travelled people still reach a hundred rows, which buries everything
  // below the list. Show a sensible slice by default.
  if (items.length > LIST_PREVIEW) {
    const shown = items.slice(0, LIST_PREVIEW);
    fillList(body, shown, { onFocus, showVisitor });

    const more = el('button', {
      className: 'list-more',
      text: `Show all ${items.length}`,
      attrs: { type: 'button' },
    });
    more.addEventListener('click', () => {
      more.remove();
      fillList(body, items.slice(LIST_PREVIEW), { onFocus, showVisitor });
    });
    body.appendChild(more);
    return;
  }

  fillList(body, items, { onFocus, showVisitor });
}

function fillList(body, items, { onFocus, showVisitor }) {
  for (const item of items) {
    const row = el('button', { className: 'region', attrs: { type: 'button' } });
    row.appendChild(el('span', { className: 'region-flag', text: flagEmoji(item.country) || '🏳️' }));

    const text = el('span', { className: 'region-text' });
    text.appendChild(el('span', { className: 'region-name', text: item.name }));
    const detail = detailLine(item);
    if (detail) text.appendChild(el('span', { className: 'region-country', text: detail }));
    row.appendChild(text);
    row.title = item.regionNames.join(', '); // the full list, for the curious

    if (showVisitor && item.visitors[0]) {
      const who = el('span', { className: 'region-who' });
      who.appendChild(colorDot(item.visitors[0].color));
      who.appendChild(el('span', { text: item.visitors[0].name }));
      row.appendChild(who);
    }

    // Frame every region of the country that was actually visited.
    row.addEventListener('click', () => onFocus(item.regionIds));
    body.appendChild(row);
  }
}

/**
 * Which bit of the country was coloured in — but only when the answer is short
 * enough to earn its line. 'Spain / Ibiza' is worth saying; 'Netherlands /
 * Drenthe, Flevoland, Friesland…' is noise, and the row tooltip has it all.
 */
const PARTS_SHOWN = 3;

function detailLine(item) {
  const names = item.regionNames;
  if (names.length > PARTS_SHOWN) return '';
  // One region that IS the country ('United Arab Emirates') says nothing new.
  if (names.length === 1 && names[0] === item.countryName) return '';
  return names.join(', ');
}
