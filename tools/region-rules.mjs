// =============================================================================
//  REGION RULES  —  the curated decisions behind the region map.
//
//  Everything in this file is a human judgement call. The geometry work in
//  build-regions.mjs is fully automatic, so you can change what counts as a
//  region here without touching any geo-processing.
// =============================================================================

/**
 * Countries whose first-level divisions are each their own region, so you can
 * colour in a single state/province instead of the whole country.
 * Keyed by ISO alpha-3 (Natural Earth's `adm0_a3`).
 */
export const SPLIT_COUNTRIES = new Set([
  // The classic four
  'USA', 'CAN', 'AUS', 'BRA',
  // Larger European countries
  'DEU', 'FRA', 'ITA', 'ESP', 'GBR', 'NLD', 'BEL', 'AUT', 'CHE', 'PRT', 'GRC',
  'SWE', 'NOR', 'POL',
  // Other large countries
  'RUS', 'CHN', 'IND', 'ARG', 'MEX', 'ZAF', 'IDN', 'JPN', 'TUR', 'KAZ',
]);

/**
 * Natural Earth's admin-1 layer is finer than the level people actually name
 * for a few countries (the UK is 232 districts, Italy 110 provinces). For these
 * we merge admin-1 units up to the recognisable level using another NE field.
 */
export const AGGREGATE_BY = {
  ESP: 'region', //  52 provinces  -> 19 autonomous communities
  ITA: 'region', // 110 provinces  -> 20 regions
  FRA: 'region', // 101 departments -> 18 régions (incl. overseas)
  GBR: 'geonunit', // 232 districts -> England / Scotland / Wales / N. Ireland
};

/**
 * ISO 3166-2 code and English display name for each merged region above.
 * Natural Earth gives the group names in the local language, so both are
 * curated here. Keyed by `<adm0_a3>|<the NE group value>`.
 */
export const AGGREGATE_META = {
  // --- Spain: autonomous communities ------------------------------------------
  'ESP|Andalucía': ['ES-AN', 'Andalusia'],
  'ESP|Aragón': ['ES-AR', 'Aragon'],
  'ESP|Asturias': ['ES-AS', 'Asturias'],
  'ESP|Canary Is.': ['ES-CN', 'Canary Islands'],
  'ESP|Cantabria': ['ES-CB', 'Cantabria'],
  'ESP|Castilla-La Mancha': ['ES-CM', 'Castilla-La Mancha'],
  'ESP|Castilla y León': ['ES-CL', 'Castile and León'],
  'ESP|Cataluña': ['ES-CT', 'Catalonia'],
  'ESP|Ceuta': ['ES-CE', 'Ceuta'],
  'ESP|Extremadura': ['ES-EX', 'Extremadura'],
  'ESP|Foral de Navarra': ['ES-NC', 'Navarre'],
  'ESP|Galicia': ['ES-GA', 'Galicia'],
  'ESP|Islas Baleares': ['ES-IB', 'Balearic Islands'],
  'ESP|La Rioja': ['ES-RI', 'La Rioja'],
  'ESP|Madrid': ['ES-MD', 'Madrid'],
  'ESP|Melilla': ['ES-ML', 'Melilla'],
  'ESP|Murcia': ['ES-MC', 'Murcia'],
  'ESP|País Vasco': ['ES-PV', 'Basque Country'],
  'ESP|Valenciana': ['ES-VC', 'Valencia'],

  // --- Italy: regions ----------------------------------------------------------
  'ITA|Abruzzo': ['IT-65', 'Abruzzo'],
  'ITA|Apulia': ['IT-75', 'Apulia'],
  'ITA|Basilicata': ['IT-77', 'Basilicata'],
  'ITA|Calabria': ['IT-78', 'Calabria'],
  'ITA|Campania': ['IT-72', 'Campania'],
  'ITA|Emilia-Romagna': ['IT-45', 'Emilia-Romagna'],
  'ITA|Friuli-Venezia Giulia': ['IT-36', 'Friuli-Venezia Giulia'],
  'ITA|Lazio': ['IT-62', 'Lazio'],
  'ITA|Liguria': ['IT-42', 'Liguria'],
  'ITA|Lombardia': ['IT-25', 'Lombardy'],
  'ITA|Marche': ['IT-57', 'Marche'],
  'ITA|Molise': ['IT-67', 'Molise'],
  'ITA|Piemonte': ['IT-21', 'Piedmont'],
  'ITA|Sardegna': ['IT-88', 'Sardinia'],
  'ITA|Sicily': ['IT-82', 'Sicily'],
  'ITA|Toscana': ['IT-52', 'Tuscany'],
  'ITA|Trentino-Alto Adige': ['IT-32', 'Trentino-South Tyrol'],
  'ITA|Umbria': ['IT-55', 'Umbria'],
  "ITA|Valle d'Aosta": ['IT-23', 'Aosta Valley'],
  'ITA|Veneto': ['IT-34', 'Veneto'],

  // --- France: régions (mainland + overseas) -----------------------------------
  'FRA|Auvergne-Rhône-Alpes': ['FR-ARA', 'Auvergne-Rhône-Alpes'],
  'FRA|Bourgogne-Franche-Comté': ['FR-BFC', 'Bourgogne-Franche-Comté'],
  'FRA|Bretagne': ['FR-BRE', 'Brittany'],
  'FRA|Centre-Val de Loire': ['FR-CVL', 'Centre-Val de Loire'],
  'FRA|Corse': ['FR-COR', 'Corsica'],
  'FRA|Grand Est': ['FR-GES', 'Grand Est'],
  'FRA|Guadeloupe': ['FR-GP', 'Guadeloupe'],
  'FRA|Guyane française': ['FR-GF', 'French Guiana'],
  'FRA|Hauts-de-France': ['FR-HDF', 'Hauts-de-France'],
  'FRA|Martinique': ['FR-MQ', 'Martinique'],
  'FRA|Mayotte': ['FR-YT', 'Mayotte'],
  'FRA|Normandie': ['FR-NOR', 'Normandy'],
  'FRA|Nouvelle-Aquitaine': ['FR-NAQ', 'Nouvelle-Aquitaine'],
  'FRA|Occitanie': ['FR-OCC', 'Occitanie'],
  'FRA|Pays de la Loire': ['FR-PDL', 'Pays de la Loire'],
  "FRA|Provence-Alpes-Côte-d'Azur": ['FR-PAC', "Provence-Alpes-Côte d'Azur"],
  'FRA|Réunion': ['FR-RE', 'Réunion'],
  'FRA|Île-de-France': ['FR-IDF', 'Île-de-France'],

  // --- United Kingdom: the four nations ----------------------------------------
  'GBR|England': ['GB-ENG', 'England'],
  'GBR|Scotland': ['GB-SCT', 'Scotland'],
  'GBR|Wales': ['GB-WLS', 'Wales'],
  'GBR|Northern Ireland': ['GB-NIR', 'Northern Ireland'],
};

/**
 * Nicer names for detached landmasses the builder discovers on its own. Without
 * an entry here a detached region is named after its largest admin-1 unit,
 * which is sometimes a province name rather than the name of the island group.
 * Keyed by the region id the builder produces.
 */
export const DETACHED_NAMES = {
  'EC-W': 'Galápagos Islands',
  'MY-13': 'Malaysian Borneo', // Sabah + Sarawak + Labuan share one landmass
  'GQ-CS': 'Río Muni',
  'YE-SU': 'Socotra',
  'CO-SAP': 'San Andrés y Providencia',
  'IN-AN': 'Andaman and Nicobar Islands',
  'IN-LD': 'Lakshadweep',
};

/**
 * Landmasses that must be their own region even though they sit closer to the
 * mainland than CLUSTER_DISTANCE_KM — they are separate destinations in every
 * traveller's head, and in the Travelers' Century Club list too. Each entry
 * merges the listed admin-1 units (by ISO 3166-2 code) into one isolated region.
 */
export const FORCE_REGIONS = {
  TZA: [
    {
      id: 'TZ-ZN',
      name: 'Zanzibar',
      // Unguja and Pemba: NE splits the archipelago across five units.
      units: ['TZ-07', 'TZ-06', 'TZ-10', 'TZ-11', 'TZ-15'],
    },
  ],
};

/**
 * Extra codes people are likely to type for a region, on top of its id and its
 * name. Names already match case- and accent-insensitively, so this is only for
 * genuinely different names, island names and legacy ISO alpha-2 codes.
 */
export const ALIASES = {
  'ES-CN': ['Canarias', 'Tenerife', 'Gran Canaria', 'Lanzarote', 'Fuerteventura', 'La Palma'],
  'ES-IB': ['Baleares', 'Mallorca', 'Majorca', 'Menorca', 'Ibiza', 'Formentera'],
  'ES-CT': ['Cataluña', 'Catalunya', 'Barcelona'],
  'ES-AN': ['Andalucía', 'Andalucia', 'Malaga', 'Sevilla'],
  'ES-PV': ['Euskadi', 'Pais Vasco', 'Bilbao'],
  'ES-VC': ['Comunidad Valenciana', 'Benidorm'],
  'ES-MD': ['Comunidad de Madrid'],
  'IT-82': ['Sicilia'],
  'IT-88': ['Sardegna'],
  'IT-25': ['Lombardia', 'Milan'],
  'IT-21': ['Piemonte'],
  'IT-52': ['Toscana', 'Florence'],
  'IT-75': ['Puglia'],
  'IT-62': ['Rome', 'Roma'],
  'FR-COR': ['Corse'],
  'FR-GP': ['GP', 'GLP'],
  'FR-GF': ['GF', 'GUF'],
  'FR-MQ': ['MQ', 'MTQ'],
  'FR-RE': ['RE', 'REU'],
  'FR-YT': ['YT', 'MYT'],
  'FR-IDF': ['Paris'],
  'PT-20': ['Azores', 'Açores'],
  'PT-30': ['Madeira', 'Funchal'],
  'PT-11': ['Lisbon', 'Lisboa'],
  'GB-SCT': ['Alba'],
  'GB-ENG': ['London'],
  'US-HI': ['Hawaii'],
  'US-AK': ['Alaska'],
  'US-NY': ['New York'],
  'GR-M': ['Crete', 'Kriti', 'Heraklion'],
  'NL-NH': ['Amsterdam'],
  'NL-ZH': ['Rotterdam', 'The Hague'],
  'TR-34': ['Istanbul'],
  'JP-13': ['Tokyo'],
  'ID-BA': ['Bali'],
  'TH': ['Bangkok', 'Phuket'],
  'AE': ['Dubai', 'Abu Dhabi'],
};

/**
 * Dutch names for the places whose Dutch spelling differs enough that the
 * English one will not match. Merged into ALIASES below, so `'Sicilië'`,
 * `'Canarische Eilanden'` and `'Kreta'` all work in data/people.js and in the
 * search box.
 */
const DUTCH_NAMES = {
  'ES-CN': ['Canarische Eilanden'],
  'ES-IB': ['Balearen'],
  'ES-AN': ['Andalusië'],
  'ES-CT': ['Catalonië'],
  'ES-PV': ['Baskenland'],
  'ES-GA': ['Galicië'],
  'IT-82': ['Sicilië'],
  'IT-88': ['Sardinië'],
  'IT-52': ['Toscane'],
  'IT-62': ['Rome', 'Latium'],
  'IT-75': ['Apulië'],
  'IT-25': ['Lombardije'],
  'FR-NOR': ['Normandië'],
  'FR-BRE': ['Bretagne'],
  'FR-COR': ['Corsica'],
  'GR-M': ['Kreta'],
  'GR-L': ['Zuid-Egeïsche Eilanden', 'Rhodos', 'Santorini', 'Mykonos', 'Kos'],
  'GR-A1': ['Athene'],
  'PT-20': ['Azoren'],
  'GB-ENG': ['Engeland'],
  'GB-SCT': ['Schotland'],
  'GB-NIR': ['Noord-Ierland'],
  'US-HI': ['Hawaï'],
  'US-CA': ['Californië'],
  'TR-34': ['Istanboel'],
  'JP-13': ['Tokio'],
  'EC-W': ['Galapagoseilanden'],
  'MY-13': ['Maleisisch Borneo'],
};

for (const [id, names] of Object.entries(DUTCH_NAMES)) {
  ALIASES[id] = [...(ALIASES[id] || []), ...names];
}

/**
 * Countries that are never broken up by landmass, whatever the geometry says —
 * their islands sit a short hop offshore and nobody treats them as a separate
 * destination. (Only affects countries outside SPLIT_COUNTRIES.)
 */
export const NEVER_SPLIT = new Set([
  'DNK', 'EST', 'HRV', 'KOR', 'VNM', 'THA', 'MMR', 'IRL',
  // Equatorial Guinea's capital sits on Bioko, which would make the island the
  // "mainland" and the continental part the detached bit. Not worth the confusion.
  'GNQ',
]);

/**
 * Countries that are archipelagos through and through: splitting them by
 * landmass would produce dozens of meaningless fragments, so they stay whole.
 * (Only affects countries outside SPLIT_COUNTRIES.)
 */
export const ARCHIPELAGO_COUNTRIES = new Set([
  'PHL', 'MDV', 'BHS', 'FJI', 'SLB', 'VUT', 'FSM', 'MHL', 'KIR', 'TON', 'WSM',
  'CPV', 'COM', 'STP', 'SYC', 'MLT', 'BHR', 'PLW', 'TUV', 'NRU', 'ATG', 'VCT',
  'GRD', 'KNA', 'LCA', 'DMA', 'BRB', 'TTO', 'CUB', 'ISL', 'CYP', 'SGP', 'TLS',
  'PNG', 'NZL', 'LKA', 'JAM', 'HTI', 'DOM', 'BRN', 'ATA',
  // Island territories: every part is an island, so "mainland" means nothing.
  'PYF', 'NCL', 'ATF', 'MNP', 'SHN', 'COK', 'PCN', 'WLF', 'ASM', 'VIR', 'VGB',
  'TCA', 'CYM', 'BMU', 'ABW', 'CUW', 'SXM', 'MAF', 'BLM', 'AIA', 'MSR', 'SPM',
  'FLK', 'SGS', 'IOT', 'CXR', 'CCK', 'NFK', 'HMD', 'UMI', 'FRO', 'ALA', 'GUM',
]);

/**
 * Regions that always count as away-from-the-mainland, whatever the distance
 * says. Ceuta is a 14 km ferry ride from Spain but it is on the African
 * continent, so `ES` should not silently include it.
 */
export const FORCE_DETACHED = new Set(['ES-CE']);

/** Minimum land area (km²) for a detached landmass to become its own region. */
export const MIN_DETACHED_AREA_KM2 = 120;

/**
 * A country has to be reasonably large before splitting it by landmass earns
 * its keep. Below this, the country stays one region — nobody colours in half
 * of Saint Pierre and Miquelon.
 */
export const MIN_COUNTRY_AREA_KM2 = 5000;

/** Distance (km) below which two landmasses count as the same landmass. */
export const CLUSTER_DISTANCE_KM = 80;

// =============================================================================
//  GREEK ISLANDS
//
//  Natural Earth stops at Greece's 14 peripheries, so Rhodes and Santorini are
//  buried inside "South Aegean" with no code of their own. The islands people
//  actually book holidays to deserve better, so each one below is carved out of
//  its periphery into its own region.
//
//  `at` is a point on the island, taken from the built geometry itself, and the
//  build warns if it ever stops landing inside a shape — that is the check that
//  keeps a name attached to the right rock.
//
//  Everything not listed here stays with its periphery: `GR-L` still covers the
//  South Aegean islands that have no entry of their own.
// =============================================================================

export const ISLAND_REGIONS = {
  GRC: [
    // --- Dodecanese -----------------------------------------------------------
    { id: 'GR-RHODES', name: 'Rhodes', parent: 'GR-L', at: [27.967, 36.171], aliases: ['Rhodos', 'Rodos', 'Ródos'] },
    { id: 'GR-KOS', name: 'Kos', parent: 'GR-L', at: [27.092, 36.789] },
    { id: 'GR-KARPATHOS', name: 'Karpathos', parent: 'GR-L', at: [27.162, 35.6] },
    { id: 'GR-KALYMNOS', name: 'Kalymnos', parent: 'GR-L', at: [26.965, 36.998] },
    { id: 'GR-LEROS', name: 'Leros', parent: 'GR-L', at: [26.833, 37.151] },
    { id: 'GR-PATMOS', name: 'Patmos', parent: 'GR-L', at: [26.556, 37.327] },
    { id: 'GR-SYMI', name: 'Symi', parent: 'GR-L', at: [27.83, 36.588], aliases: ['Simi'] },
    { id: 'GR-TILOS', name: 'Tilos', parent: 'GR-L', at: [27.365, 36.43] },
    { id: 'GR-NISYROS', name: 'Nisyros', parent: 'GR-L', at: [27.167, 36.587] },
    { id: 'GR-ASTYPALAIA', name: 'Astypalaia', parent: 'GR-L', at: [26.358, 36.576] },

    // --- Cyclades -------------------------------------------------------------
    { id: 'GR-SANTORINI', name: 'Santorini', parent: 'GR-L', at: [25.431, 36.412], aliases: ['Thira', 'Thera', 'Fira'] },
    { id: 'GR-MYKONOS', name: 'Mykonos', parent: 'GR-L', at: [25.372, 37.462] },
    { id: 'GR-NAXOS', name: 'Naxos', parent: 'GR-L', at: [25.472, 37.06] },
    { id: 'GR-PAROS', name: 'Paros', parent: 'GR-L', at: [25.214, 37.071] },
    { id: 'GR-ANTIPAROS', name: 'Antiparos', parent: 'GR-L', at: [25.058, 37.001] },
    { id: 'GR-IOS', name: 'Ios', parent: 'GR-L', at: [25.334, 36.718] },
    { id: 'GR-MILOS', name: 'Milos', parent: 'GR-L', at: [24.429, 36.717] },
    { id: 'GR-SIFNOS', name: 'Sifnos', parent: 'GR-L', at: [24.696, 36.991] },
    { id: 'GR-SERIFOS', name: 'Serifos', parent: 'GR-L', at: [24.49, 37.164] },
    { id: 'GR-FOLEGANDROS', name: 'Folegandros', parent: 'GR-L', at: [24.908, 36.628] },
    { id: 'GR-SYROS', name: 'Syros', parent: 'GR-L', at: [24.919, 37.44], aliases: ['Ermoupoli'] },
    { id: 'GR-TINOS', name: 'Tinos', parent: 'GR-L', at: [25.115, 37.622] },
    { id: 'GR-ANDROS', name: 'Andros', parent: 'GR-L', at: [24.855, 37.86] },
    { id: 'GR-AMORGOS', name: 'Amorgos', parent: 'GR-L', at: [25.883, 36.838] },
    { id: 'GR-KEA', name: 'Kea', parent: 'GR-L', at: [24.329, 37.616], aliases: ['Tzia'] },
    { id: 'GR-KYTHNOS', name: 'Kythnos', parent: 'GR-L', at: [24.427, 37.404] },

    // --- Ionian ---------------------------------------------------------------
    { id: 'GR-CORFU', name: 'Corfu', parent: 'GR-F', at: [19.882, 39.594], aliases: ['Kerkyra', 'Korfoe'] },
    { id: 'GR-KEFALONIA', name: 'Kefalonia', parent: 'GR-F', at: [20.553, 38.229], aliases: ['Cephalonia', 'Kefallinia'] },
    { id: 'GR-ZAKYNTHOS', name: 'Zakynthos', parent: 'GR-F', at: [20.801, 37.781], aliases: ['Zante'] },
    { id: 'GR-LEFKADA', name: 'Lefkada', parent: 'GR-F', at: [20.647, 38.7], aliases: ['Lefkas'] },
    { id: 'GR-ITHACA', name: 'Ithaca', parent: 'GR-F', at: [20.685, 38.411], aliases: ['Ithaki'] },
    { id: 'GR-PAXOS', name: 'Paxos', parent: 'GR-F', at: [20.166, 39.206], aliases: ['Paxi'] },

    // --- North Aegean ---------------------------------------------------------
    { id: 'GR-LESBOS', name: 'Lesbos', parent: 'GR-K', at: [26.226, 39.161], aliases: ['Lesvos', 'Mytilene'] },
    { id: 'GR-CHIOS', name: 'Chios', parent: 'GR-K', at: [26.023, 38.386] },
    { id: 'GR-SAMOS', name: 'Samos', parent: 'GR-K', at: [26.81, 37.729] },
    { id: 'GR-IKARIA', name: 'Ikaria', parent: 'GR-K', at: [26.162, 37.6] },
    { id: 'GR-LIMNOS', name: 'Limnos', parent: 'GR-K', at: [25.253, 39.91], aliases: ['Lemnos'] },

    // --- Sporades and Skyros --------------------------------------------------
    { id: 'GR-SKIATHOS', name: 'Skiathos', parent: 'GR-E', at: [23.459, 39.174] },
    { id: 'GR-SKOPELOS', name: 'Skopelos', parent: 'GR-E', at: [23.687, 39.138] },
    { id: 'GR-ALONNISOS', name: 'Alonnisos', parent: 'GR-E', at: [23.909, 39.206] },
    { id: 'GR-SKYROS', name: 'Skyros', parent: 'GR-H', at: [24.553, 38.859] },

    // --- Evia and the Saronic islands ----------------------------------------
    { id: 'GR-EVIA', name: 'Evia', parent: 'GR-H', at: [24.011, 38.435], aliases: ['Euboea', 'Evvoia'] },
    { id: 'GR-AEGINA', name: 'Aegina', parent: 'GR-A1', at: [23.49, 37.726], aliases: ['Egina'] },
    { id: 'GR-HYDRA', name: 'Hydra', parent: 'GR-A1', at: [23.495, 37.344], aliases: ['Ydra'] },
    { id: 'GR-SPETSES', name: 'Spetses', parent: 'GR-A1', at: [23.139, 37.262] },
    { id: 'GR-POROS', name: 'Poros', parent: 'GR-A1', at: [23.491, 37.528] },
    { id: 'GR-KYTHIRA', name: 'Kythira', parent: 'GR-A1', at: [22.986, 36.253], aliases: ['Cythera'] },

    // --- Thracian Sea ---------------------------------------------------------
    { id: 'GR-THASOS', name: 'Thasos', parent: 'GR-A', at: [24.683, 40.686], aliases: ['Thassos'] },
    { id: 'GR-SAMOTHRACE', name: 'Samothrace', parent: 'GR-A', at: [25.585, 40.456], aliases: ['Samothraki'] },
  ],
};

// Island nicknames join the main alias table.
for (const islands of Object.values(ISLAND_REGIONS)) {
  for (const island of islands) {
    if (island.aliases) ALIASES[island.id] = [...(ALIASES[island.id] || []), ...island.aliases];
  }
}
