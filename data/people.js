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
//  The map is built from ~1,000 REGIONS, not just countries, so you can colour
//  in exactly where you have been:
//
//      'ES'        mainland Spain — the Canaries, Balearics, Ceuta and Melilla
//                  stay grey until you add them yourself
//      'ES*'       the whole of Spain, islands and all (note the star)
//      'ES-CN'     one region by its ISO 3166-2 code (all seven Canaries)
//      'Tenerife'  a region by name or nickname — case and accents are ignored
//
//  So a holiday in Tenerife colours in Tenerife and nothing else, a week on
//  Ibiza leaves Mallorca grey, and a road trip through Andalusia is 'ES-AN'.
//
//  Islands with a name of their own: the seven Canaries, the four Balearics and
//  49 Greek islands. The archipelago's own code still covers the whole group,
//  so 'ES-CN' is all of the Canaries and 'ES-IB' all of the Balearics.
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
      'ES', // mainland Spain; add 'Tenerife', 'Ibiza', 'Mallorca'… by name, or
      //      'ES-CN' / 'ES-IB' for a whole archipelago at once
      'PL',
      'CZ',
      'BG',
      'GR', // the Greek mainland and its 14 peripheries. The 49 named islands
      //      are separate now, so add the ones you have been to by name:
      //      'Crete', 'Santorini', 'Rhodes', 'Corfu', 'Mykonos', 'Kos'…
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
