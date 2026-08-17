# Visited Countries

An interactive world map of everywhere a group of people has been, with each
person's places drawn in their own colour. Places visited by more than one
person are shown as diagonal stripes of every visitor's colour.

It's a **static site** — no database, no backend, no build step to deploy. All
data lives in code, so the published map only ever changes when you commit.
Perfect for GitHub Pages.

- 🗺️ **953 regions, not just countries.** Mainland Spain, the Canary Islands and
  the Balearics are three separate things you can colour in — as are Hawaii,
  Corsica, the Azores, Zanzibar, Sardinia and the Galápagos.
- 🇺🇸 **States and provinces** for the USA, Canada, Australia, Brazil, Germany,
  France, Italy, Spain, the UK, the Netherlands, Belgium, Austria, Switzerland,
  Portugal, Greece, Sweden, Norway, Poland, Russia, China, India, Argentina,
  Mexico, South Africa, Indonesia, Japan, Turkey and Kazakhstan.
- 🔎 **Search** any of them by name, nickname or code — in English or Dutch.
- 📊 Per-continent progress bars, plus lists of where **everyone** has been and
  where only **one** of you has been.
- 🎨 Per-person colours; **diagonal stripes** where people overlap.
- 📱 Mobile-first, Apple-inspired design; responsive two-column layout on
  larger screens.
- 🆓 No paid APIs and no API keys. Leaflet and the map shapes are bundled
  locally; the only external request is the free CARTO basemap — and your
  coloured-in regions still render without it.

## ✏️ Adding people and places

Everything you'll normally touch is in **[`data/people.js`](data/people.js)**:

```js
export const people = [
  {
    name: 'Wesley',
    color: COLORS.blue,           // any CSS colour, e.g. '#0A84FF'
    countries: ['NL', 'ES', 'ES-CN']
  },
  // add another person here…
];
```

- **Add a person** → add another object to the array.
- **Add a place** → add its code to that person's list.

### What a code means

| You write | What gets coloured in |
| --- | --- |
| `'ES'` | **Mainland Spain only.** The Canaries, Balearics, Ceuta and Melilla stay grey. |
| `'ES*'` | The whole of Spain, islands and overseas territories included. |
| `'ES-CN'` | Just the Canary Islands (ISO 3166-2 code). |
| `'Tenerife'` | The same thing, by name or nickname — case and accents are ignored. |
| `'Canarische Eilanden'` | Also the same thing; common Dutch names work too. |

The rule is the same everywhere: a bare country code covers that country's
**mainland**, and anything that sits off on its own needs to be added
separately. So `'US'` is the contiguous states plus DC — Alaska (`US-AK`) and
Hawaii (`US-HI`) are yours to earn.

**Every valid code is listed in [`REGIONS.md`](REGIONS.md)**, or just tap any
region on the map: the popup shows the code, ready to paste. Codes that match
nothing are ignored and reported in the browser console together with the
closest matches, so open DevTools if a place stays grey — it's usually a typo.

Save, commit, push — the live site updates. That's the whole workflow, and it's
also the security model: anyone can look at the map, but only someone who can
push to this repository can change what it shows.

### Optional tweaks

[`data/config.js`](data/config.js) controls the title, the initial view, colours,
stripe width, hover and focus styling, and the basemap tiles. All values have
sensible defaults.

## 👀 Previewing locally

Because the app loads data with `fetch` and uses ES modules, you need to serve
it over HTTP (opening `index.html` directly with `file://` won't work):

```bash
python3 -m http.server 8000   # or: npm run serve
# then open http://localhost:8000
```

## 🚀 Deploying to GitHub Pages

The site is plain static files at the repository root, so no build is required:

1. Push to your repository.
2. In **Settings → Pages**, set the source to **Deploy from a branch** and pick
   your branch with the **`/ (root)`** folder.
3. Your site appears at `https://<user>.github.io/<repo>/`.

All paths in the app are relative, so it works correctly from that sub-path. The
`.nojekyll` file tells Pages to serve the files as-is.

## 🧩 How it works

```
index.html               # entry point, loads Leaflet + the app module
data/
  people.js              # ← the data you edit
  config.js              # ← optional settings
src/
  app.js                 # bootstraps everything
  regions.js             # the region reference + the code resolver
  data-model.js          # builds the visit index, the lists and the stats
  map.js                 # Leaflet map, region fills, hover, popups
  search.js              # the search box
  patterns.js            # SVG diagonal-stripe patterns for shared regions
  ui.js                  # header, stats, continent bars, legend, lists
  util.js                # small helpers (flags, name folding, dots)
assets/
  world-regions.geojson  # the 953 region shapes, keyed by region id
  regions.json           # names, countries, continents, aliases
  leaflet/               # vendored Leaflet (no CDN dependency)
tools/
  build-regions.mjs      # regenerates the two assets above
  region-rules.mjs       # ← the curated decisions about what counts as a region
styles/main.css          # Apple-inspired, mobile-first styling
REGIONS.md               # generated reference of every code
```

- **"Everyone's been"** = the *intersection* — regions every person has visited.
- **"Only one of us"** = regions visited by *exactly one* person.
- A region visited by 2+ people is filled with diagonal stripes of each
  visitor's colour; a single visitor gets a solid fill.
- The basemap is split into two layers, with your colours sandwiched between
  them, so place names stay readable on top of a filled-in region — the same
  stacking Google Maps uses.

## 🛠️ Regenerating the map data

You only need this if you want to change **what counts as a region** — add a
country to the state-by-state list, split off another island group, or rename
something.

```bash
npm install            # one-off: fetches mapshaper
npm run build:regions  # downloads Natural Earth, rewrites the assets + REGIONS.md
```

Edit [`tools/region-rules.mjs`](tools/region-rules.mjs) first: it holds the
split list, the merge rules, the names and the aliases. Everything else is
worked out automatically by [`tools/build-regions.mjs`](tools/build-regions.mjs):

1. Natural Earth's 4,596 admin-1 units are merged up to the level people
   actually name (the UK's 232 districts become four nations, Italy's 110
   provinces become 20 regions).
2. Units are clustered into landmasses — anything within 80 km of another unit
   belongs to the same one.
3. The landmass holding the country's capital is the **mainland**; that is what
   makes `ES` mean mainland Spain.
4. Split countries keep every unit as a region. Every other country becomes one
   region for its mainland, plus a region for each detached landmass big enough
   to be a destination of its own.

The script prints every detached region it produced so you can eyeball the
result, and warns loudly if a region ends up without a shape.

## 📦 Data & credits

- Region shapes: [Natural Earth](https://www.naturalearthdata.com/) 1:10m
  admin-0 and admin-1 (public domain), simplified with
  [mapshaper](https://mapshaper.org/).
- Which places count as separate territories follows the spirit of the
  [Travelers' Century Club](https://travelerscenturyclub.org/countries-and-territories/)
  list, which has treated the Canaries and the Balearics as distinct from
  mainland Spain since 1970.
- Codes are [ISO 3166-2](https://www.iso.org/iso-3166-country-codes.html)
  wherever one exists.
- Map library: [Leaflet](https://leafletjs.com/) (BSD-2-Clause), vendored in
  `assets/leaflet/`.
- Basemap tiles: [CARTO](https://carto.com/attributions) Voyager on
  [OpenStreetMap](https://www.openstreetmap.org/copyright) data (free, with
  attribution shown on the map).

Borders shown do not imply any political position.
