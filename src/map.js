// =============================================================================
//  Leaflet map: a clean basemap with visited countries painted on top.
//  Single visitor  -> solid colour.
//  Multiple visitors -> diagonal stripes of each visitor's colour.
// =============================================================================

import { config } from '../data/config.js';
import { flagEmoji, el, colorDot } from './util.js';
import { createStripeManager } from './patterns.js';

const L = window.L;

/**
 * @param {string} containerId id of the map element
 * @param {{geojson: object, countries: object, model: object}} deps
 * @returns {{map: object, focus: (a3: string) => void}}
 */
export function createMap(containerId, { geojson, model, countries }) {
  const cfg = config;

  const map = L.map(containerId, {
    center: cfg.map.center,
    zoom: cfg.map.zoom,
    minZoom: cfg.map.minZoom,
    maxZoom: cfg.map.maxZoom,
    worldCopyJump: true,
  });

  // ---- Basemap that follows the OS light/dark setting -----------------------
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const makeTiles = (mode) =>
    L.tileLayer(cfg.tiles[mode].url, {
      subdomains: cfg.tiles[mode].subdomains,
      maxZoom: cfg.tiles[mode].maxZoom,
      attribution: cfg.tiles.attribution,
    });
  let tiles = makeTiles(darkQuery.matches ? 'dark' : 'light').addTo(map);
  darkQuery.addEventListener('change', (e) => {
    map.removeLayer(tiles);
    tiles = makeTiles(e.matches ? 'dark' : 'light').addTo(map);
  });

  // ---- Country overlay ------------------------------------------------------
  const renderer = L.svg();
  const layersByA3 = new Map();

  const styleFor = (feature) => {
    const visitors = model.visitIndex.get(feature.properties.a3);
    if (!visitors || visitors.length === 0) {
      const o = cfg.style.unvisitedFillOpacity;
      return o > 0
        ? { stroke: false, fill: true, fillColor: '#8e8e93', fillOpacity: o }
        : { stroke: false, fill: false };
    }
    return {
      weight: cfg.style.weight,
      color: cfg.style.strokeColor,
      fill: true,
      fillColor: visitors[0].color, // solid for 1 visitor; replaced for 2+
      fillOpacity: cfg.style.fillOpacity,
    };
  };

  const layer = L.geoJSON(geojson, {
    renderer,
    style: styleFor,
    onEachFeature: (feature, lyr) => {
      const visitors = model.visitIndex.get(feature.properties.a3);
      if (!visitors || visitors.length === 0) {
        lyr.options.interactive = false; // unvisited land is just basemap
        return;
      }
      layersByA3.set(feature.properties.a3, lyr);
      lyr.bindPopup(() => popupNode(feature, visitors, countries), {
        closeButton: false,
        className: 'country-popup',
      });
    },
  }).addTo(map);

  // Paint diagonal stripes onto countries with 2+ visitors.
  const svg = renderer._container || map.getPane('overlayPane').querySelector('svg');
  const stripes = createStripeManager(svg, { stripeWidth: cfg.style.stripeWidth });
  layer.eachLayer((lyr) => {
    const visitors = model.visitIndex.get(lyr.feature.properties.a3);
    if (visitors && visitors.length > 1 && lyr._path) {
      lyr._path.setAttribute('fill', stripes.fillFor(visitors.map((v) => v.color)));
    }
  });

  // Frame the map around everywhere that's been visited (falls back to the
  // configured center/zoom when disabled or when nothing has been visited).
  if (cfg.map.fitToVisited && layersByA3.size > 0) {
    const bounds = L.latLngBounds([]);
    layersByA3.forEach((lyr) => bounds.extend(lyr.getBounds()));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: cfg.map.fitMaxZoom });
    }
  }

  // Keep Leaflet's sizing in sync with CSS-driven layout changes.
  const refresh = () => map.invalidateSize();
  window.addEventListener('resize', refresh);
  setTimeout(refresh, 0);

  function focus(a3) {
    const lyr = layersByA3.get(a3);
    if (!lyr) return;
    map.flyToBounds(lyr.getBounds(), { maxZoom: cfg.map.focusMaxZoom, padding: [28, 28] });
    lyr.openPopup();
  }

  return { map, focus };
}

/** Build the popup contents for a country (safe DOM, no HTML strings). */
function popupNode(feature, visitors, countries) {
  const wrap = el('div', { className: 'popup' });
  const rec = countries.get(feature.properties.a3);
  const title = `${flagEmoji(rec?.a2)} ${rec?.name ?? feature.properties.a3}`.trim();
  wrap.appendChild(el('div', { className: 'popup-title', text: title }));

  const people = el('div', { className: 'popup-people' });
  for (const v of visitors) {
    const chip = el('span', { className: 'popup-person' });
    chip.appendChild(colorDot(v.color));
    chip.appendChild(el('span', { text: v.name }));
    people.appendChild(chip);
  }
  wrap.appendChild(people);
  return wrap;
}
