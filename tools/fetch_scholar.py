"""Fetch the Google Scholar profile and write data/scholar.js (+ scholar.json).

Both the citation numbers and the co-authorship network on the page are built from
this one snapshot, so they always agree. The profile list abbreviates long author
lists ("..."), so each paper's Scholar page is also read for the full author names
(cached in data/scholar_authors.json, so later runs only fetch new papers).

Google Scholar has no API and blocks browser (CORS) requests, so the page cannot
read Scholar live. Run this script instead (locally, or from a scheduled GitHub
Action) and commit the output:

    python tools/fetch_scholar.py

Scholar sometimes answers automated requests with a CAPTCHA page; the script then
stops without touching the existing data, so the site keeps the last good snapshot.
"""
import datetime
import html
import json
import pathlib
import re
import sys
import random
import time
import urllib.error
import urllib.request

USER = "4Cj0tLEAAAAJ"
URL = f"https://scholar.google.com/citations?user={USER}&hl=en&cstart=0&pagesize=100&sortby=citedby"
OUT = pathlib.Path(__file__).resolve().parent.parent / "data"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/130.0 Safari/537.36")


def text(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s)).strip()


def parse(page):
    stats = [int(x) for x in re.findall(r'class="gsc_rsb_std">(\d+)<', page)]
    if len(stats) < 6:
        raise ValueError("stats table not found (CAPTCHA or layout change?)")
    years = [int(y) for y in re.findall(r'class="gsc_g_t"[^>]*>(\d{4})<', page)]
    # bars carry their count; years with zero citations have no bar, so match by position via style z-index
    bars = re.findall(r'<a[^>]*class="gsc_g_a"[^>]*style="[^"]*z-index:(\d+)[^"]*"[^>]*>\s*<span class="gsc_g_al">(\d+)</span>', page)
    per_year = {y: 0 for y in years}
    n = len(years)
    for z, c in bars:  # z-index counts down from the most recent year
        idx = n - int(z)
        if 0 <= idx < n:
            per_year[years[idx]] = int(c)
    pubs = []
    for row in re.findall(r'<tr class="gsc_a_tr">(.*?)</tr>', page, re.S):
        t = re.search(r'class="gsc_a_at"[^>]*>(.*?)</a>', row, re.S)
        link = re.search(r'href="(/citations\?view_op=view_citation[^"]+)"', row)
        grays = re.findall(r'<div class="gs_gray">(.*?)</div>', row, re.S)
        cit = re.search(r'class="gsc_a_ac gs_ibl"[^>]*>(\d*)<', row)
        yr = re.search(r'class="gsc_a_h gsc_a_hc gs_ibl">(\d*)<', row)
        pubs.append({
            "title": text(t.group(1)) if t else "",
            "authors": text(grays[0]) if grays else "",
            "venue": text(grays[1]) if len(grays) > 1 else "",
            "year": int(yr.group(1)) if yr and yr.group(1) else None,
            "citations": int(cit.group(1)) if cit and cit.group(1) else 0,
            "url": "https://scholar.google.com" + html.unescape(link.group(1)) if link else None,
        })
    return {
        "profile": f"https://scholar.google.com/citations?user={USER}&hl=en",
        "fetched": datetime.date.today().isoformat(),
        "citations": {"all": stats[0], "since": stats[1]},
        "h_index": {"all": stats[2], "since": stats[3]},
        "i10_index": {"all": stats[4], "since": stats[5]},
        "per_year": per_year,
        "publications": pubs,
    }


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en"})
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")


def full_authors(url):
    """Authors field of a publication's Scholar page, or None (CAPTCHA, layout change)."""
    page = get(url)
    m = re.search(r'<div class="gsc_oci_field">Authors</div><div class="gsc_oci_value">(.*?)</div>', page, re.S)
    return text(m.group(1)) if m else None


def main():
    try:
        data = parse(get(URL))
    except (ValueError, OSError) as e:
        print("Scholar fetch failed:", e, "- keeping previous data", file=sys.stderr)
        return 1
    OUT.mkdir(exist_ok=True)
    cache_p = OUT / "scholar_authors.json"
    cache = json.loads(cache_p.read_text(encoding="utf-8")) if cache_p.exists() else {}
    for p in data["publications"]:
        if not p["url"]:
            continue
        if p["url"] not in cache:
            time.sleep(random.uniform(2.5, 5))   # be gentle: Scholar blocks fast clients
            try:
                a = full_authors(p["url"])
            except urllib.error.HTTPError as e:
                if e.code == 429:   # rate-limited: stop now, the rest is fetched on a later run
                    print("Scholar rate limit (429); remaining author lists will be fetched next run", file=sys.stderr)
                    break
                a = None
            except OSError:
                a = None
            if not a:
                print("  could not read authors for:", p["title"][:60], file=sys.stderr)
            else:
                cache[p["url"]] = a
    for p in data["publications"]:
        p["authors_full"] = cache.get(p["url"])     # None until fetched; the page falls back gracefully
    cache_p.write_text(json.dumps(cache, ensure_ascii=False, indent=1), encoding="utf-8")
    js = json.dumps(data, ensure_ascii=False, indent=1)
    (OUT / "scholar.json").write_text(js, encoding="utf-8")
    (OUT / "scholar.js").write_text("window.SCHOLAR = " + js + ";\n", encoding="utf-8")
    print(f"{data['citations']['all']} citations, h={data['h_index']['all']}, "
          f"{len(data['publications'])} publications -> {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
