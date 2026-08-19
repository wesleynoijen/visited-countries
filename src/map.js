// =============================================================================
//  The map: a clean basemap with visited regions painted on top.
//
//  Single visitor    -> solid colour.
//  Multiple visitors -> diagonal stripes in each visitor's colour.
//
//  A few details that make it feel less like a static picture:
//    * place labels are drawn ON TOP of the colours, the way Google Maps does
//      it, so a filled-in country stays readable;
//    * zoom is fractional, so pinching and scrolling glide instead of jumping;
//    * every region reacts to hover and can be clicked, visited or not — the
//      popup shows the code you need for data/people.js.
// =============================================================================

import { config } from '../data/config.js';
import { flagEmoji, el, colorDot } from './util.js';
import { createStripeManager } from './patterns.js';

const L = window.L;

/**
 * @param {string} containerId id of the map element
 * @param {{geojson: object, regions: object, model: object, theme: object}} deps
 * @returns {{map: object, focus: (target: string|string[]) => void}}
 */
export function createMap(containerId, { geojson, model, regions, theme }) {
  const cfg = config;

  const map = L.map(containerId, {
    center: cfg.map.center,
    zoom: cfg.map.zoom,
    minZoom: cfg.map.minZoom,
    maxZoom: cfg.map.maxZoom,
    // Fractional zoom: the wheel and trackpad glide instead of stepping.
    zoomSnap: 0,
    zoomDelta: 0.5,
    wheelPxPerZoomLevel: 120,
    zoomControl: false,
    worldCopyJump: true,
    // Keep the poles out of view but leave room to pan across the date line.
    maxBounds: [
      [-85, -540],
      [85, 540],
    ],
    maxBoundsViscosity: 0.6,
  });

  L.control.zoom({ position: 'bottomright' }).addTo(map);
  L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);
  fullscreenControl().addTo(map);

  // A pane for the label tiles, sitting above the country colours.
  const labelPane = map.createPane('labels');
  labelPane.style.zIndex = 450;
  labelPane.style.pointerEvents = 'none';

  // ---- Basemap, following whichever theme the page is in ---------------------
  let layers = [];
  theme.subscribe((mode) => {
    layers.forEach((layer) => map.removeLayer(layer));
    layers = addBasemap(map, cfg, mode);
  });

  // ---- Region overlay --------------------------------------------------------
  const renderer = L.svg({ padding: 0.4 });
  const layersById = new Map();

  const layer = L.geoJSON(geojson, {
    renderer,
    style: (feature) => styleFor(feature.properties.id, model, cfg),
    onEachFeature: (feature, lyr) => {
      const id = feature.properties.id;
      layersById.set(id, lyr);

      lyr.bindPopup(() => popupNode(id, model, regions), {
        closeButton: false,
        className: 'region-popup',
        maxWidth: 260,
      });

      lyr.on('mouseover', () => hover(lyr, id, true));
      lyr.on('mouseout', () => hover(lyr, id, false));
    },
  }).addTo(map);

  // Paint diagonal stripes onto regions with two or more visitors.
  const svg = renderer._container || map.getPane('overlayPane').querySelector('svg');
  const stripes = createStripeManager(svg, { stripeWidth: cfg.style.stripeWidth });
  layer.eachLayer((lyr) => {
    const visitors = model.visitIndex.get(lyr.feature.properties.id);
    if (visitors && visitors.length > 1 && lyr._path) {
      lyr._path.setAttribute('fill', stripes.fillFor(visitors.map((v) => v.color)));
    }
  });

  function hover(lyr, id, on) {
    const visitors = model.visitIndex.get(id);
    if (on) {
      lyr.setStyle({
        weight: cfg.style.hoverWeight,
        color: cfg.style.hoverColor,
        fillOpacity: visitors ? cfg.style.fillOpacity : cfg.style.hoverFillOpacity,
      });
      lyr.bringToFront();
    } else {
      lyr.setStyle(styleFor(id, model, cfg));
      restoreStripe(lyr, id);
    }
  }

  function restoreStripe(lyr, id) {
    const visitors = model.visitIndex.get(id);
    if (visitors && visitors.length > 1 && lyr._path) {
      lyr._path.setAttribute('fill', stripes.fillFor(visitors.map((v) => v.color)));
    }
  }

  // Frame the map around everywhere that has been visited.
  if (cfg.map.fitToVisited && model.visitIndex.size > 0) {
    const bounds = L.latLngBounds([]);
    for (const id of model.visitIndex.keys()) {
      const lyr = layersById.get(id);
      if (lyr) bounds.extend(lyr.getBounds());
    }
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: cfg.map.fitMaxZoom });
    }
  }

  // Keep Leaflet's sizing in sync with CSS-driven layout changes.
  const refresh = () => map.invalidateSize();
  window.addEventListener('resize', refresh);
  if (window.ResizeObserver) {
    new ResizeObserver(refresh).observe(document.getElementById(containerId));
  }
  setTimeout(refresh, 0);

  let flashTimer = null;
  let flashed = [];

  /**
   * Fly to a region, outline it and open its popup. The outline matters most
   * for places nobody has visited: without it you would arrive at the Canaries
   * and see nothing but ocean and a popup.
   *
   * Accepts a list of ids too. The country lists in the sidebar use that to
   * frame everything you coloured in there at once — click "Spain" after a
   * week on Ibiza and you land on Ibiza, not on Madrid.
   *
   * @param {string|string[]} target one region id, or several
   */
  function focus(target) {
    const ids = (Array.isArray(target) ? target : [target]).filter((id) => layersById.has(id));
    if (!ids.length) return;

    clearFlash();
    const bounds = L.latLngBounds([]);
    for (const id of ids) {
      const lyr = layersById.get(id);
      lyr.setStyle({
        stroke: true,
        weight: cfg.style.focusWeight,
        color: cfg.style.focusColor,
        fillOpacity: model.visitIndex.has(id) ? cfg.style.fillOpacity : cfg.style.hoverFillOpacity,
      });
      lyr.bringToFront();
      bounds.extend(lyr.getBounds());
      flashed.push({ lyr, id });
    }
    flashTimer = setTimeout(clearFlash, cfg.style.focusFlashMs);

    map.flyToBounds(bounds, {
      maxZoom: cfg.map.focusMaxZoom,
      padding: [32, 32],
      duration: 0.8,
    });

    // A popup only makes sense for a single region — picking one of twelve
    // provinces to speak for the whole country would be arbitrary.
    if (ids.length === 1) {
      const lyr = layersById.get(ids[0]);
      // moveend covers the usual case; the timeout covers picking the region
      // you are already looking at, where the map never actually moves.
      map.once('moveend', () => lyr.openPopup());
      setTimeout(() => lyr.openPopup(), 900);
    }
  }

  function clearFlash() {
    clearTimeout(flashTimer);
    for (const { lyr, id } of flashed) {
      lyr.setStyle(styleFor(id, model, cfg));
      restoreStripe(lyr, id);
    }
    flashed = [];
  }

  return { map, focus };
}

/** Base tiles below the colours, label tiles above them. */
function addBasemap(map, cfg, mode) {
  const source = cfg.tiles[mode];
  const shared = {
    subdomains: cfg.tiles.subdomains,
    maxZoom: cfg.tiles.maxZoom,
    crossOrigin: true,
  };

  const base = L.tileLayer(source.base, {
    ...shared,
    attribution: cfg.tiles.attribution,
  }).addTo(map);

  const labels = L.tileLayer(source.labels, { ...shared, pane: 'labels' }).addTo(map);

  return [base, labels];
}

function styleFor(id, model, cfg) {
  const visitors = model.visitIndex.get(id);
  if (!visitors || visitors.length === 0) {
    // Unvisited land stays transparent, but still reacts to clicks so you can
    // look up the code for anywhere you are about to add.
    return {
      stroke: false,
      fill: true,
      fillColor: '#8e8e93',
      fillOpacity: cfg.style.unvisitedFillOpacity,
    };
  }
  return {
    weight: cfg.style.weight,
    color: cfg.style.strokeColor,
    fill: true,
    fillColor: visitors[0].color, // solid for one visitor; striped for more
    fillOpacity: cfg.style.fillOpacity,
  };
}

/** Popup contents for a region (built as DOM, never as an HTML string). */
function popupNode(id, model, regions) {
  const region = regions.get(id);
  const visitors = model.visitIndex.get(id);
  const wrap = el('div', { className: 'popup' });

  const title = `${flagEmoji(region?.country)} ${region?.name ?? id}`.trim();
  wrap.appendChild(el('div', { className: 'popup-title', text: title }));

  // Only say "part of X" when the region is not the whole country already.
  if (region && region.name !== region.countryName) {
    wrap.appendChild(el('div', { className: 'popup-sub', text: region.countryName }));
  }

  // Clicking a stray Canary islet shows "Canary Islands", which would be
  // puzzling without saying that the big ones have their own entry.
  if (region?.members?.length) {
    wrap.appendChild(
      el('div', {
        className: 'popup-sub',
        text: `${region.members.length} of its islands are separate regions`,
      })
    );
  }

  if (visitors && visitors.length) {
    const people = el('div', { className: 'popup-people' });
    for (const v of visitors) {
      const chip = el('span', { className: 'popup-person' });
      chip.appendChild(colorDot(v.color));
      chip.appendChild(el('span', { text: v.name }));
      people.appendChild(chip);
    }
    wrap.appendChild(people);
  } else {
    wrap.appendChild(el('p', { className: 'popup-empty', text: 'Nobody has been here yet.' }));
  }

  const code = el('div', { className: 'popup-code' });
  code.appendChild(el('span', { text: 'code' }));
  code.appendChild(el('code', { text: id }));
  wrap.appendChild(code);

  return wrap;
}

/** A fullscreen toggle, using the browser API — no plugin needed. */
function fullscreenControl() {
  const Control = L.Control.extend({
    options: { position: 'bottomright' },
    onAdd(map) {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control fullscreen-control');
      const button = L.DomUtil.create('a', '', container);
      button.href = '#';
      button.title = 'Toggle fullscreen';
      button.setAttribute('role', 'button');
      button.setAttribute('aria-label', 'Toggle fullscreen');
      button.textContent = '⤢';

      L.DomEvent.on(button, 'click', (e) => {
        L.DomEvent.stop(e);
        const target = map.getContainer().closest('.map-card') || map.getContainer();
        if (document.fullscreenElement) document.exitFullscreen();
        else target.requestFullscreen?.();
      });

      document.addEventListener('fullscreenchange', () => {
        button.textContent = document.fullscreenElement ? '⤡' : '⤢';
        setTimeout(() => map.invalidateSize(), 100);
      });

      return container;
    },
  });
  return new Control();
}
