// =============================================================================
//  CONFIG  —  optional tweaks to appearance & behaviour. Sensible defaults.
// =============================================================================

export const config = {
  // Header text.
  title: 'Visited Countries',
  subtitle: "Everywhere we've been",

  // Where the region shapes are loaded from. By default this is the bundled,
  // self-contained map (a relative path is resolved against /src). Rebuild it
  // with `npm run build:regions`. Any GeoJSON works as long as each feature
  // carries its region id on `properties.id` and that id also appears in
  // assets/regions.json.
  mapDataUrl: '../assets/world-regions.geojson',

  // Initial map view and zoom limits.
  map: {
    fitToVisited: true, // on load, frame the map around everywhere that's been visited
    center: [25, 5], // fallback view used when fitToVisited is off or nothing is visited
    zoom: 2.2,
    minZoom: 1.4,
    maxZoom: 9, // the region shapes stay crisp up to about here
    fitMaxZoom: 5, // don't zoom in past this when framing visited regions on load
    focusMaxZoom: 7, // zoom level used when you pick a region from a list or search
  },

  // Region-overlay appearance.
  style: {
    fillOpacity: 0.78, // opacity of a visited region's colour
    unvisitedFillOpacity: 0, // 0 = let the basemap show through unvisited land
    weight: 0.7, // border thickness for visited regions
    strokeColor: 'rgba(120,120,128,0.55)', // theme-neutral hairline border
    stripeWidth: 9, // px width of each colour band for shared regions
    hoverWeight: 1.6, // border thickness while the pointer is over a region
    hoverColor: 'rgba(10,132,255,0.9)',
    hoverFillOpacity: 0.22, // faint tint so unvisited land answers the pointer too
    focusWeight: 2.6, // outline drawn around a region you jumped to
    focusColor: '#0A84FF',
    focusFlashMs: 3200, // how long that outline stays up
  },

  // Free, no-API-key basemaps from CARTO (built on OpenStreetMap data).
  // Base and labels are separate layers on purpose: the colours go in between,
  // so place names stay readable on top of a filled-in region — the same
  // stacking Google Maps uses. {r} loads retina tiles on high-density screens.
  tiles: {
    subdomains: 'abcd',
    maxZoom: 20,
    light: {
      base: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
      labels: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
    },
    dark: {
      base: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
      labels: 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
    },
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};
