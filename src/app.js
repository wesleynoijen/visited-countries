// =============================================================================
//  Entry point. Loads data, builds the model, then renders the map and UI.
//  Asset URLs are resolved relative to THIS module so the app works from any
//  base path (e.g. https://user.github.io/visited-countries/).
// =============================================================================

import { config } from '../data/config.js';
import { people } from '../data/people.js';
import { loadCountries } from './countries.js';
import { buildModel } from './data-model.js';
import { createMap } from './map.js';
import { renderUI } from './ui.js';

const COUNTRIES_URL = new URL('../assets/countries.json', import.meta.url);

async function main() {
  try {
    const [countries, geojson] = await Promise.all([
      loadCountries(COUNTRIES_URL),
      fetchJson(new URL(config.mapDataUrl, import.meta.url), 'map data'),
    ]);

    // Normalise: many world datasets keep the ISO alpha-3 code on `feature.id`.
    for (const f of geojson.features || []) {
      f.properties = f.properties || {};
      if (!f.properties.a3 && f.id) f.properties.a3 = String(f.id).toUpperCase();
    }

    const model = buildModel(people, countries);
    reportWarnings(model.warnings);

    const mapApi = createMap('map', { geojson, model, countries });
    renderUI({ model, onFocus: (a3) => mapApi.focus(a3) });
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

function reportWarnings(warnings) {
  if (!warnings.length) return;
  console.warn(
    `[visited-countries] ${warnings.length} unknown country code(s) were ignored.\n` +
      'Check the codes in data/people.js against assets/countries.json:'
  );
  for (const w of warnings) console.warn(`  • ${w.person}: "${w.code}"`);
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
