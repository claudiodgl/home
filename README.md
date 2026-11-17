# Claudio D. G. Linhares: homepage

Static personal homepage, served with GitHub Pages at https://claudiodgl.github.io/home/

- `index.html`: page structure
- `css/`: `base.css` (theme tokens, type, header, buttons), `sections.css` (per-section styles)
- `js/`: `theme.js` (light/dark, nav), `network.js` (ego co-authorship network with linked side panel, d3), `scholar-view.js` (snapshot date), `motion.js` (3D keyword icons, portrait orbit, hover-to-play demos, grayscale-until-focused photos)
- `data/scholar.js` / `scholar.json`: Google Scholar snapshot; the paper list for the network
- `data/scholar_authors.json`: cached full author lists per Scholar paper
- `data/pubs.js`: publication list from the old site; fills in full author names when Scholar shortens them
- `img/`: portrait, demo GIFs + posters, talk thumbnails, logos, grant and TEP images
- `tools/gif/`: Chrome (DevTools protocol) scripts to record the demo GIFs (`record.mjs`, `make_gifs.py`) and to screenshot sections (`sections.mjs`)

## Updating Google Scholar numbers

Google Scholar has no API and blocks browser requests, so the page reads a snapshot:

```
python tools/fetch_scholar.py
```

Then commit `data/scholar.js`, `data/scholar.json` and `data/scholar_authors.json`.
A GitHub Action (`.github/workflows/scholar.yml`) tries the same every Monday; if Scholar blocks it, the last snapshot stays.

## Local preview

```
python -m http.server 8030
```

then open http://localhost:8030
