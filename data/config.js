// =============================================================================
//  CONFIG  —  optional tweaks to appearance & behaviour. Sensible defaults.
// =============================================================================

export const config = {
  // Header text.
  title: 'Visited Countries',
  subtitle: "Everywhere we've been",

  // Where the country outline shapes are loaded from. By default this is the
  // bundled, self-contained map (a relative path is resolved against /src). You
  // can also point it at a hosted GeoJSON (a full https URL). Any GeoJSON works
  // as long as each feature is keyed by ISO alpha-3 (on `id` or `properties.a3`);
  // country names and flags always come from assets/countries.json.
  mapDataUrl: '../assets/world-countries.geojson',

  // Initial map view and zoom limits.
  map: {
    fitToVisited: true, // on load, frame the map around everywhere that's been visited
    center: [20, 0], // fallback view used when fitToVisited is false or nobody has visited anywhere
    zoom: 2,
    minZoom: 1,
    maxZoom: 7,
    fitMaxZoom: 5, // don't zoom in past this when framing visited countries on load
    focusMaxZoom: 5, // zoom level used when you tap a country in a list
  },

  // Country-overlay appearance.
  style: {
    fillOpacity: 0.8, // opacity of a visited country's colour
    unvisitedFillOpacity: 0, // 0 = let the basemap show through unvisited land
    weight: 0.7, // border thickness for visited countries
    strokeColor: 'rgba(120,120,128,0.5)', // theme-neutral hairline border
    stripeWidth: 9, // px width of each colour band for shared countries
  },

  // Denominator for the "X of N countries" statistic.
  // 195 = 193 UN members + 2 observer states.
  worldCountryCount: 195,

  // Free, no-API-key basemaps from CARTO (built on OpenStreetMap data).
  // {r} loads retina tiles on high-density screens.
  tiles: {
    light: {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      subdomains: 'abcd',
      maxZoom: 20,
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      subdomains: 'abcd',
      maxZoom: 20,
    },
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};
