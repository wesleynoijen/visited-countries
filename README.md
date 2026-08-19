# Visited Countries

An interactive world map of everywhere a group of people has been, with each
person's places drawn in their own colour. Places visited by more than one
person are shown as diagonal stripes of every visitor's colour.

It's a **static site** — no database, no backend, no build step to deploy. All
data lives in code, so the published map only ever changes when you commit.
Perfect for GitHub Pages.

- 🗺️ **1,014 regions, not just countries.** Mainland Spain, Tenerife and Ibiza
  are three separate things you can colour in — as are Hawaii, Corsica, the
  Azores, Zanzibar, Sardinia and the Galápagos.
- 🏝️ **Holiday islands by name.** All 49 Greek islands worth naming — Santorini,
  Mykonos, Rhodes, Corfu, Zakynthos, Kos — plus the seven Canaries and the four
  Balearics, each its own region. A week on Ibiza colours in Ibiza and nothing
  else.
- 🇺🇸 **States and provinces** for the USA, Canada, Australia, Brazil, Germany,
  France, Italy, Spain, the UK, the Netherlands, Belgium, Austria, Switzerland,
  Portugal, Greece, Sweden, Norway, Poland, Russia, China, India, Argentina,
  Mexico, South Africa, Indonesia, Japan, Turkey and Kazakhstan.
- 🔎 **Search** any of them by name, nickname or code — in English or Dutch.
- 📊 Per-continent progress bars, plus a list of where **everyone** has been
  and one of everywhere still missing **somebody**. All three count countries,
  not regions, so a trip through the Netherlands is one row and not twelve
  provinces.
- 🎨 Per-person colours; **diagonal stripes** where people overlap.
- 📱 Mobile-first, Apple-inspired design; responsive two-column layout on
  larger screens.
- 🌓 Light and dark. Follows your system setting, with a toggle in the header
  that remembers what you picked — the basemap switches with it.
- 🆓 No paid APIs and no API keys. Leaflet and the map shapes are bundled
  locally; the only external request is the free CARTO basemap — and your
  coloured-in regions still render without it.

## ✏️ Tutorial: add your first trip

Say you just spent a week in **Tenerife**. Here is the whole process, start to
finish. It takes about a minute once you've done it once.

### Step 1 — Find out what the place is called

There are three ways. The first is the easiest, and it works from your phone.

**A. Look it up on your own map.** Open your map, type `Tenerife` in the search
box at the top and press Enter. The map flies to Tenerife and opens a popup. At
the bottom of that popup is the code:

```
🇪🇸 Tenerife
Spain
Nobody has been here yet.
─────────────────────
code  ES-TENERIFE
```

`ES-TENERIFE` is what you need. You can also just tap any region on the map directly —
every one of them shows its code, visited or not.

**B. Search [`REGIONS.md`](REGIONS.md).** All 1,014 codes are listed there, grouped
by country. Press `Ctrl+F` / `Cmd+F` and search for the place or the country. Each
row tells you the code, the name, whether it counts as mainland, and the other
names it answers to.

**C. Skip the code.** If you know the name, you can write that instead — see the
next step.

### Step 2 — Add it to `data/people.js`

This is the only file you normally touch. Open it and find your own entry:

```js
export const people = [
  {
    name: 'Wesley',
    color: COLORS.blue,
    countries: [
      'NL',
      'ES',
    ],
  },
];
```

Add the new place to the list. All three of these lines do exactly the same
thing, so use whichever you'll remember:

```js
      'ES-TENERIFE',   // the code
      'Tenerife',      // the name
      'tenerife',      // capitals and accents are ignored
```

The result:

```js
    countries: [
      'NL',
      'ES',
      'Tenerife',   // ← new
    ],
```

Order doesn't matter and duplicates are harmless. If you island-hopped the whole
archipelago, `'ES-CN'` colours all seven Canaries at once.

### Step 3 — Commit and push

```bash
git add data/people.js
git commit -m "Add Tenerife"
git push
```

### Step 4 — Look at it

GitHub Pages rebuilds in a minute or two — you can watch it under the **Actions**
tab. Then open your map and **hard refresh** (`Cmd+Shift+R` on Mac, `Ctrl+F5` on
Windows), otherwise your browser may show you the cached old version.

Tenerife is now in your colour, mainland Spain and the other six Canaries are
unchanged, and Spain has appeared in the lists on the right.

That's the entire workflow. It's also the security model: anyone can look at the
map, but only someone who can push to this repository can change what it shows.

## 📖 What a code means

The most important rule: **a bare country code covers that country's mainland
only.** Anything that sits off on its own is a separate place you have to earn.

| You write | What gets coloured in |
| --- | --- |
| `'ES'` | **Mainland Spain only.** The Canaries, Balearics, Ceuta and Melilla stay grey. |
| `'ES*'` | The whole of Spain, islands and overseas territories included. |
| `'ES-CN'` | All seven Canary Islands (ISO 3166-2 code). |
| `'Canarische Eilanden'` | The same thing; common Dutch names work too. |
| `'Tenerife'` | **Only Tenerife** — the other six stay grey. |
| `'ES-TENERIFE'` | The same thing, by code. |

So `'US'` is the contiguous states plus DC — Alaska (`US-AK`) and Hawaii
(`US-HI`) are separate. `'PT'` is mainland Portugal, not the Azores (`PT-20`) or
Madeira (`PT-30`). `'GR'` is Greece's 14 peripheries, so Santorini and Rhodes are
yours to add by name.

A handful of codes cover a **group**: the ones with named islands carved out of
them. `'ES-CN'` is all of the Canaries, `'ES-IB'` all of the Balearics, `'GR-L'`
the whole South Aegean including Santorini and Mykonos. Writing the island's own
name always means that island alone.

### Recipes

| What you want | What you write |
| --- | --- |
| A country that isn't split up — Bulgaria, Thailand, the UAE | `'BG'`, `'TH'`, `'AE'` |
| Only the part of a country you actually saw | `'ES-AN'` (Andalusia), `'IT-82'` (Sicily), `'US-NY'` (New York) |
| A whole country including its islands | `'ES*'`, `'US*'`, `'PT*'` |
| A whole island group | `'ES-CN'` (all the Canaries), `'ES-IB'` (all the Balearics), `'PT-20'`, `'FR-COR'`, `'EC-W'` (Galápagos) |
| One island of a group | `'Tenerife'`, `'Ibiza'`, `'Mallorca'`, `'Lanzarote'` — or their codes, `'ES-TENERIFE'` and friends |
| A single Greek island | `'Santorini'`, `'Rhodes'`, `'Corfu'`, `'Mykonos'` — or their codes, `'GR-SANTORINI'` and friends |
| A city you visited | the region it's in: `'FR-IDF'` for Paris, `'TR-34'` for Istanbul — or simply write `'Paris'` or `'Istanbul'`, which resolve to those regions |

### Adding another person

Add another object to the array. Give everyone a distinct colour — the presets in
`COLORS` at the top of the file are Apple's system palette, but any CSS colour
works:

```js
export const people = [
  { name: 'Wesley',  color: COLORS.blue,  countries: ['NL', 'ES'] },
  { name: 'Madelon', color: COLORS.green, countries: ['NL'] },
  { name: 'Sam',     color: '#FF9500',    countries: ['NL', 'IT-82'] },
];
```

Anywhere two or more people overlap is drawn as diagonal stripes in each of
their colours, so the Netherlands above ends up striped blue/green/orange.

### When something looks wrong

| What you see | What it means |
| --- | --- |
| A place stayed grey | The code didn't match anything. Open the browser console (`F12` → Console) — every skipped entry is listed with the closest matches, so a typo is obvious: <br>`• Wesley: "Tenrife"  — did you mean: Tenerife (ES-TENERIFE)?` |
| Too much got coloured in | You used a bare country code for a country that's split into regions. `'TR'` colours all 81 Turkish provinces; use `'TR-34'` for Istanbul alone. |
| An island stayed grey | That's by design — bare country codes are mainland only. Add the island's own code, or use the `*` form. |
| Nothing changed at all | Either Pages hasn't finished rebuilding (check the **Actions** tab) or your browser cached the old files (hard refresh). |

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
  theme.js               # light/dark, the toggle and what it remembers
  patterns.js            # SVG diagonal-stripe patterns for shared regions
  ui.js                  # header, stats, continent bars, legend, lists
  util.js                # small helpers (flags, name folding, dots)
assets/
  world-regions.geojson  # the 1,014 region shapes, keyed by region id
  regions.json           # names, countries, continents, aliases
  leaflet/               # vendored Leaflet (no CDN dependency)
tools/
  build-regions.mjs      # regenerates the two assets above
  region-rules.mjs       # ← the curated decisions about what counts as a region
styles/main.css          # Apple-inspired, mobile-first styling
REGIONS.md               # generated reference of every code
```

### The map

- A region visited by 2+ people is filled with diagonal stripes of each
  visitor's colour; a single visitor gets a solid fill.
- The basemap is split into two layers, with your colours sandwiched between
  them, so place names stay readable on top of a filled-in region — the same
  stacking Google Maps uses.

### The two lists

The map works per **region**; the two lists work per **country**. That
difference is deliberate — a week on Ibiza should colour in Ibiza alone, but in
a list it should read as "Spain", not as one row per Spanish region.

- **"Visited by all"** = countries every person has set foot in. One region is
  enough: if you went to mainland Spain and someone else only to Ibiza, you have
  both been to Spain.
- **"Visited by some"** = the rest — every visited country still missing
  somebody. With two travellers that means the ones only one of you has seen;
  with three it also holds the two-out-of-three countries. Each row shows a dot
  per traveller and says "2 of 3", so you can see at a glance who is missing.
- The two lists are complements, so their counts add up to the **Visited
  countries** tile at the top — which is why the tiles carry the same names as
  the lists.
- When only a part or two of a country was visited, the row names them
  ("Spain / Balearic Islands"). Hover any row for the full list of regions, and
  click it to fly to exactly those regions on the map.

## 🛠️ Regenerating the map data

You only need this if you want to change **what counts as a region** — add a
country to the state-by-state list, split off another island group, or rename
something.

```bash
npm install            # one-off: fetches mapshaper
npm run build:regions  # downloads Natural Earth, rewrites the assets + REGIONS.md
```

Edit [`tools/region-rules.mjs`](tools/region-rules.mjs) first: it holds the
split list, the merge rules, the island list, the names and the aliases. Everything else is
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

There is one hand-made step on top of that. Natural Earth stops at Greece's 14
peripheries, so Santorini and Rhodes have no code of their own. `ISLAND_REGIONS`
names 49 Greek islands and the build carves each one out of its periphery,
locating it by a point on the island and warning if that point ever stops
landing inside a shape. Islands with no entry stay with their periphery, so
`GR-L` still covers the South Aegean islands nobody asked for by name.

The script prints every detached region it produced so you can eyeball the
result, and warns loudly if a region ends up without a shape.

### Why the shapes are simplified three times

One simplification setting cannot serve both Russia and Santorini. Simplifiers
spend their vertex budget across the whole dataset, so a setting that keeps
continents at a reasonable download size deletes small islands outright —
`keep-shapes` only guarantees that a region keeps *one* of its parts, not all of
them. Coordinate rounding behaves the same way: 0.004° is 440 m on the ground,
which is wider than Vatican City.

So the build makes three passes and stitches them back together by part size:

| Pass | Setting | Supplies |
| --- | --- | --- |
| Coarse | 4% of vertices, rounded to 0.004° | parts over 5,000 km² — continents and the largest islands |
| Fine | fixed 900 m tolerance | parts from 10 to 5,000 km² — ordinary islands |
| Raw | no simplification, rounded to 0.0002° | anything smaller — islets and microstates |

Each region is then rebuilt from whichever pass suits each of its parts. Which
pass a part belongs to is decided by its **true** area, measured before any
simplification — never by how big it measures inside a simplified pass. Coarsening
shrinks a coastline by up to 15%, so classifying per pass left a gap around the
threshold that swallowed whole islands: Fuerteventura, Zanzibar and Maui each
measured under the cutoff when coarse and over it when fine, so no pass claimed
them. The build now counts land parts in and out and complains if the numbers
differ.

That is why the South Aegean keeps all 35 of its islands and the Vatican still
exists, at 2.2 MB total (about 590 KB over the wire).

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
