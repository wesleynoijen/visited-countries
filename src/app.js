// =============================================================================
//  Entry point. Loads data, builds the model, then renders the map and the UI.
//  Asset URLs are resolved relative to THIS module so the app works from any
//  base path (e.g. https://user.github.io/visited-countries/).
// =============================================================================

import { config } from '../data/config.js';
import { people } from '../data/people.js';
import { loadRegions } from './regions.js';
import { buildModel } from './data-model.js';
import { createMap } from './map.js';
import { createSearch } from './search.js';
import { renderUI } from './ui.js';

const REGIONS_URL = new URL('../assets/regions.json', import.meta.url);

async function main() {
  try {
    const [regions, geojson] = await Promise.all([
      loadRegions(REGIONS_URL),
      fetchJson(new URL(config.mapDataUrl, import.meta.url), 'map data'),
    ]);

    const model = buildModel(people, regions);
    reportWarnings(model.warnings);

    const mapApi = createMap('map', { geojson, model, regions });
    renderUI({ model, regions, onFocus: (target) => mapApi.focus(target) });
    createSearch({ regions, model, onPick: (id) => mapApi.focus(regions.spread(id)) });

    document.body.classList.add('is-ready');
  } catch (err) {
    showError(err);
    throw err;
  }
}

async function fetchJson(url, label) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${label} (HTTP ${res.status})`);
  return res.json();
}

/**
 * Codes that resolved to nothing are the most common mistake when editing
 * data/people.js by hand, so say exactly what was skipped and what was close.
 */
function reportWarnings(warnings) {
  if (!warnings.length) return;
  console.warn(
    `[visited-countries] ${warnings.length} entry/entries in data/people.js did not match a region.\n` +
      'Every valid code is listed in REGIONS.md.'
  );
  for (const w of warnings) {
    const hint = w.suggestions?.length ? `  — did you mean: ${w.suggestions.join(', ')}?` : '';
    console.warn(`  • ${w.person}: "${w.code}"${hint}`);
  }
}

function showError(err) {
  const box = document.getElementById('error');
  if (!box) return;
  box.hidden = false;
  box.textContent =
    `Something went wrong while loading the app: ${err.message}. ` +
    'If you are opening the file directly, run a local server instead (see README).';
}

main();
