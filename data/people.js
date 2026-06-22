// =============================================================================
//  PEOPLE  —  this is the main file you edit.
// =============================================================================
//
//  Each person is an object:
//
//      {
//        name: 'Wesley',          // shown in the legend / popups
//        color: '#0A84FF',        // any CSS colour (hex recommended)
//        countries: ['NL', 'FR']  // ISO codes of countries they have visited
//      }
//
//  COUNTRY CODES
//  -------------
//  Use ISO 3166-1 alpha-2 codes (2 letters, e.g. 'NL', 'US', 'JP') — these are
//  the easiest to remember. Alpha-3 codes ('NLD', 'USA') also work.
//  Codes are case-insensitive. A full searchable list of every valid code and
//  name lives in  assets/countries.json.
//  Unknown codes are ignored and reported as a warning in the browser console.
//
//  COLOURS
//  -------
//  Pick distinct colours so people are easy to tell apart. The constants below
//  are Apple's system palette — handy, but you can use any colour you like.
//
//  To ADD a person: add another object to the array.
//  To ADD a country: add its code to that person's `countries` array.
//  Save the file and push — that's the only way data changes (no DB, no UI).
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
    countries: ['NL', 'BE', 'BG', 'AE', 'DE', 'FR', 'ES', 'PL', 'ES', 'ES', 'CZ', 'TR', 'GR'],
  },
  {
    name: 'Madelon',
    color: COLORS.green,
    countries: ['NL'],
  },
];
