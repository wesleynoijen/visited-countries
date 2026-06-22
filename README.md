# Visited Countries

A small, mobile-first web app that shows the countries a group of people have
visited on an interactive world map, with each person's countries drawn in their
own colour. Countries visited by more than one person are shown as diagonal
stripes of every visitor's colour.

It's a **static site** — no database, no backend, no build step. All data lives
in code, so the only way to change anything is to edit a file and push. Perfect
for GitHub Pages.

- 🗺️ Interactive [Leaflet](https://leafletjs.com/) map on a clean CARTO basemap
  (light/dark follows your device).
- 🎨 Per-person colours; **diagonal stripes** where people overlap.
- 📋 Two lists: countries **everyone** has visited, and countries **only one**
  person has visited.
- 📱 Mobile-first, Apple-inspired design; responsive two-column layout on
  larger screens.
- 🆓 No paid APIs. Leaflet and the world map are bundled locally (no CDN). The
  only external request is the free CARTO basemap — and the coloured countries
  still render even without it.

## ✏️ Adding people and countries

Everything you'll normally touch is in **[`data/people.js`](data/people.js)**:

```js
export const people = [
  {
    name: 'Wesley',
    color: COLORS.blue,          // any CSS colour, e.g. '#0A84FF'
    countries: ['NL', 'FR', 'JP'] // ISO codes of visited countries
  },
  // add another person here…
];
```

- **Add a person** → add another object to the array.
- **Add a country** → add its code to that person's `countries` list.
- **Country codes** are ISO 3166-1 **alpha-2** (`NL`, `US`, `JP`) — easiest to
  remember. Alpha-3 (`NLD`, `USA`) also works, and codes are case-insensitive.
- A searchable list of every valid code and name is in
  [`assets/countries.json`](assets/countries.json).
- Unknown codes are ignored and logged as a warning in the browser console, so
  open DevTools if a country doesn't show up — it's usually a typo.

Save, commit, push — the live site updates. That's the whole workflow.

### Optional tweaks

[`data/config.js`](data/config.js) controls the title, initial map view, colours
of borders, stripe width, the “X of N countries” figure, the basemap tiles, and
the `mapDataUrl` the country shapes are loaded from. All values have sensible
defaults.

## 👀 Previewing locally

Because the app loads data with `fetch` and uses ES modules, you need to serve
it over HTTP (opening `index.html` directly with `file://` won't work). Any
static server does:

```bash
python3 -m http.server 8000
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
index.html            # entry point, loads Leaflet + the app module
data/
  people.js           # ← the data you edit
  config.js           # ← optional settings
src/
  app.js              # bootstraps everything
  countries.js        # loads the ISO reference, resolves codes
  data-model.js       # builds the visit index + the two lists
  map.js              # Leaflet map, country fills, popups
  patterns.js         # SVG diagonal-stripe patterns for shared countries
  ui.js               # header, stats, legend and lists
  util.js             # small helpers (flags, dots, etc.)
assets/
  world-countries.geojson  # bundled world map (keyed by ISO alpha-3)
  countries.json           # bundled ISO code/name/region reference
  leaflet/                 # vendored Leaflet (no CDN dependency)
styles/main.css       # Apple-inspired, mobile-first styling
```

- **“Everyone's been”** = the *intersection* — countries every person has visited.
- **“Only one of us”** = countries visited by *exactly one* person.
- A country visited by 2+ people is filled with diagonal stripes of each
  visitor's colour; a single visitor gets a solid fill.

## 📦 Data & credits

- Map shapes: [Natural Earth](https://www.naturalearthdata.com/) (public domain),
  simplified with [mapshaper](https://mapshaper.org/); bundled and configurable
  via `mapDataUrl`.
- ISO country reference:
  [lukes/ISO-3166-Countries-with-Regional-Codes](https://github.com/lukes/ISO-3166-Countries-with-Regional-Codes).
- Map library: [Leaflet](https://leafletjs.com/) (BSD-2-Clause), vendored in
  `assets/leaflet/`.
- Basemap tiles: [CARTO](https://carto.com/attributions) on
  [OpenStreetMap](https://www.openstreetmap.org/copyright) data (free, with
  attribution shown on the map).

### Replacing or upgrading the map

The bundled map covers ~235 countries. To swap in a different or more detailed
map, point `mapDataUrl` in [`data/config.js`](data/config.js) at another file or
a hosted GeoJSON URL. Any GeoJSON works as long as each feature carries its ISO
**alpha-3** code on `feature.id` or `feature.properties.a3`; names and flags
always come from `assets/countries.json`. The bundled file was built from
[Natural Earth](https://www.naturalearthdata.com/) 1:50m and simplified with
[mapshaper](https://mapshaper.org/):

```bash
npx mapshaper ne_50m_admin_0_countries.geojson \
  -each 'this.properties = { a3: this.properties.ISO_A3_EH }' \
  -simplify visvalingam weighted percentage=6% keep-shapes \
  -o format=geojson precision=0.02 assets/world-countries.geojson
```

Borders shown do not imply any political position.
