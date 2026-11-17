# Claudio D. G. Linhares: homepage

Static personal homepage, served with GitHub Pages at https://claudiodgl.github.io/home/

- `index.html`: page structure
- `css/`: `base.css` (theme tokens, type, header, buttons), `sections.css` (per-section styles)
- `js/`: `theme.js` (light/dark, nav), `network.js` (interactive co-author network, d3), `scholar-view.js` (Scholar stats, chart, top-10)
- `data/pubs.js`: publication list (source for the co-author network)
- `data/scholar.js` / `scholar.json`: Google Scholar snapshot
- `img/`: portrait, demo screenshots, logos, grant image

## Updating Google Scholar numbers

Google Scholar has no API and blocks browser requests, so the page reads a snapshot:

```
python tools/fetch_scholar.py
```

Then commit `data/scholar.js` and `data/scholar.json`.

## Local preview

```
python -m http.server 8030
```

then open http://localhost:8030
