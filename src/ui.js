// =============================================================================
//  Renders the non-map UI: header, stats, traveller legend and the two lists.
//  Tapping any country row focuses it on the map (via the onFocus callback).
// =============================================================================

import { config } from '../data/config.js';
import { flagEmoji, el, colorDot } from './util.js';

export function renderUI({ model, onFocus }) {
  document.getElementById('app-title').textContent = config.title;
  document.getElementById('app-subtitle').textContent = config.subtitle;
  document.title = config.title;

  renderStats(model);
  renderPeople(model);
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

function renderStats(model) {
  const stats = [
    { value: model.totalVisited, label: 'Countries', sub: `of ${config.worldCountryCount}` },
    { value: model.people.length, label: model.people.length === 1 ? 'Traveller' : 'Travellers' },
    { value: model.everyone.length, label: 'Visited by all' },
    { value: model.onlyOne.length, label: 'Unique to one' },
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
    chip.appendChild(el('span', { className: 'person-count', text: String(p.count) }));
    root.appendChild(chip);
  }
}

function renderCountryList(sectionId, items, { onFocus, showVisitor = false, empty }) {
  const section = document.getElementById(sectionId);
  section.querySelector('.list-count').textContent = String(items.length);
  const body = section.querySelector('.list-body');
  body.replaceChildren();

  if (items.length === 0) {
    body.appendChild(el('p', { className: 'list-empty', text: empty }));
    return;
  }

  for (const c of items) {
    const row = el('button', { className: 'country', attrs: { type: 'button' } });
    row.appendChild(el('span', { className: 'country-flag', text: flagEmoji(c.a2) || '🏳️' }));
    row.appendChild(el('span', { className: 'country-name', text: c.name }));
    if (showVisitor && c.visitors[0]) {
      const who = el('span', { className: 'country-who' });
      who.appendChild(colorDot(c.visitors[0].color));
      who.appendChild(el('span', { text: c.visitors[0].name }));
      row.appendChild(who);
    }
    row.addEventListener('click', () => onFocus(c.a3));
    body.appendChild(row);
  }
}
