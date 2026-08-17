// =============================================================================
//  Region search.
//
//  With ~950 regions on the map, the small islands are hard to hit with a
//  finger. Typing three letters and pressing Enter is faster than any amount of
//  pinching, so the search box is the primary way to get somewhere.
//
//  Matching is deliberately forgiving: it folds accents, searches names,
//  nicknames, country names and ISO codes, and ranks whole-word starts first.
// =============================================================================

import { flagEmoji, el } from './util.js';
import { foldName, normalizeCode } from './util.js';

const MAX_RESULTS = 8;

/**
 * @param {object} options
 * @param {object} options.regions  lookup helpers from loadRegions()
 * @param {object} options.model    the built data model
 * @param {(id: string) => void} options.onPick
 */
export function createSearch({ regions, model, onPick }) {
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  if (!input || !results) return;

  // Pre-fold every searchable string once; 950 regions is small, but this keeps
  // typing instant on an old phone.
  const index = regions.list.map((region) => ({
    region,
    haystack: [region.name, region.countryName, ...(region.aliases || [])].map(foldName),
    code: region.id.toUpperCase(),
  }));

  let matches = [];
  let active = -1;

  const close = () => {
    results.replaceChildren();
    results.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    active = -1;
  };

  const pick = (entry) => {
    if (!entry) return;
    input.value = '';
    close();
    input.blur();
    onPick(entry.region.id);
  };

  input.addEventListener('input', () => {
    matches = search(index, input.value);
    render();
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      input.value = '';
      close();
      return;
    }
    if (!matches.length) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      active = (active + step + matches.length) % matches.length;
      render();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      pick(matches[active === -1 ? 0 : active]);
    }
  });

  input.addEventListener('focus', () => {
    if (input.value.trim()) {
      matches = search(index, input.value);
      render();
    }
  });

  document.addEventListener('click', (event) => {
    if (!results.hidden && !event.target.closest('.search')) close();
  });

  function render() {
    results.replaceChildren();
    if (!matches.length) {
      results.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      return;
    }

    matches.forEach((entry, i) => {
      const { region } = entry;
      const visitors = model.visitIndex.get(region.id);
      const row = el('button', {
        className: i === active ? 'search-result is-active' : 'search-result',
        attrs: { type: 'button', role: 'option', 'aria-selected': String(i === active) },
      });

      row.appendChild(el('span', { className: 'search-flag', text: flagEmoji(region.country) || '🏳️' }));

      const text = el('span', { className: 'search-text' });
      text.appendChild(el('span', { className: 'search-name', text: region.name }));
      if (region.name !== region.countryName) {
        text.appendChild(el('span', { className: 'search-country', text: region.countryName }));
      }
      row.appendChild(text);

      const meta = el('span', { className: 'search-meta' });
      if (visitors?.length) {
        meta.classList.add('is-visited');
        meta.textContent = visitors.map((v) => v.name).join(', ');
      } else {
        meta.appendChild(el('code', { text: region.id }));
      }
      row.appendChild(meta);

      row.addEventListener('click', () => pick(entry));
      row.addEventListener('mousemove', () => {
        if (active === i) return;
        active = i;
        render();
      });
      results.appendChild(row);
    });

    results.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }
}

/** Rank regions against what has been typed so far. */
function search(index, query) {
  const needle = foldName(query);
  const code = normalizeCode(query);
  if (needle.length < 1) return [];

  const hits = [];
  for (const entry of index) {
    let best = null;

    if (entry.code === code) best = 0;
    else {
      for (const hay of entry.haystack) {
        if (!hay) continue;
        const score = hay === needle ? 1 : hay.startsWith(needle) ? 2 : hay.includes(needle) ? 4 : null;
        if (score !== null && (best === null || score < best)) best = score;
      }
      if (best === null && entry.code.startsWith(code)) best = 3;
    }

    if (best !== null) hits.push({ ...entry, score: best });
  }

  hits.sort((a, b) => a.score - b.score || a.region.name.localeCompare(b.region.name));
  return hits.slice(0, MAX_RESULTS);
}
