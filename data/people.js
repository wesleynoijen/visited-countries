// =============================================================================
//  PEOPLE  —  this is the main file you edit.
// =============================================================================
//
//  Each person is an object:
//
//      {
//        name: 'Wesley',          // shown in the legend / popups
//        color: '#0A84FF',        // any CSS colour (hex recommended)
//        countries: ['NL', 'ES']  // everywhere they have been
//      }
//
//  WHAT YOU CAN WRITE IN `countries`
//  ---------------------------------
//  The map is built from ~950 REGIONS, not just countries, so you can colour in
//  exactly where you have been:
//
//      'ES'        mainland Spain — the Canaries, Balearics, Ceuta and Melilla
//                  stay grey until you add them yourself
//      'ES*'       the whole of Spain, islands and all (note the star)
//      'ES-CN'     one region by its ISO 3166-2 code (the Canary Islands)
//      'Tenerife'  a region by name or nickname — case and accents are ignored
//
//  So a holiday in Tenerife colours in the Canaries and nothing else, and a
//  road trip through Andalusia can be just 'ES-AN'.
//
//  Countries that are split into states or provinces: the USA, Canada,
//  Australia, Brazil, Germany, France, Italy, Spain, the UK, the Netherlands,
//  Belgium, Austria, Switzerland, Portugal, Greece, Sweden, Norway, Poland,
//  Russia, China, India, Argentina, Mexico, South Africa, Indonesia, Japan,
//  Turkey and Kazakhstan. Everywhere else is one region per country, plus its
//  detached islands (Galápagos, Zanzibar, Azores…).
//
//  EVERY VALID CODE is listed in REGIONS.md — search that file, or use the
//  search box on the map itself and tap a region to see its code.
//  Codes that match nothing are ignored and reported in the browser console
//  along with the closest matches, so open DevTools if something stays grey.
//
//  COLOURS
//  -------
//  Pick distinct colours so people are easy to tell apart. The constants below
//  are Apple's system palette — handy, but you can use any colour you like.
//
//  To ADD a person: add another object to the array.
//  To ADD a place:  add its code to that person's list.
//  Save the file and push — that's the only way the published map changes.
// =============================================================================

// Apple system colours — convenient, distinct presets (optional to use).
export const COLORS = {
  red: '#FF3B30',
  orange: '#FF9500',
  yellow: '#FFCC00',
  green: '#34C759',
  teal: '#5AC8FA',
  blue: '#0A84FF',
  indigo: '#5E5CE6',
  purple: '#AF52DE',
  pink: '#FF2D55',
  brown: '#A2845E',
};

export const people = [
  {
    name: 'Wesley',
    color: COLORS.blue,
    countries: [
      // A bare country code covers that country's mainland. Narrow any of
      // these down whenever you feel like it — 'ES' could become 'ES-CT' and
      // 'ES-AN' if Catalonia and Andalusia are the parts you actually saw.
      'NL', // mainland Netherlands
      'BE',
      'DE',
      'FR', // mainland France; add 'FR-COR' for Corsica
      'ES', // mainland Spain; add 'ES-CN' for the Canaries, 'ES-IB' for Mallorca & Ibiza
      'PL',
      'CZ',
      'BG',
      'GR', // Greece — its islands chain back to the mainland, so this covers
      //      them too; use 'GR-M' (Crete) or 'GR-L' (South Aegean) to be precise
      'TR',
      'AE',
    ],
  },
  {
    name: 'Madelon',
    color: COLORS.green,
    countries: ['NL'],
  },
];
