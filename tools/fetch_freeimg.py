#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Récupère une photo libre (Openverse, licences commerciales uniquement) et la
recadre en 1400x800 pour les pages Honest Switch.

Usage: python tools/fetch_freeimg.py <requete> <sortie.jpg> [--min 1200] [--start N]

- Ne retient que les licences autorisant l'usage commercial (cc0, pdm, by, by-sa).
- Télécharge, vérifie la largeur, recadre au centre en 1400x800, écrit le crédit
  sur la sortie standard (auteur, licence, lien) pour la légende.
- Échoue proprement (exit 1) si aucune image ne convient : aucune image inventée.
"""
import io
import json
import sys
import urllib.parse
import urllib.request

from PIL import Image

OK_LICENSES = {"cc0", "pdm", "by", "by-sa"}
UA = "honest-switch-image-fetch/1.0 (contact: nypsus.business@gmail.com)"


def search(query, page_size=20, source=None):
    params = {
        "q": query,
        "license_type": "commercial",
        "page_size": page_size,
    }
    if source:
        params["source"] = source
    qs = urllib.parse.urlencode(params)
    req = urllib.request.Request(
        "https://api.openverse.org/v1/images/?" + qs,
        headers={"User-Agent": UA},
    )
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.loads(r.read().decode("utf-8")).get("results", [])


def download(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    query, out = sys.argv[1], sys.argv[2]
    start = 0
    source = None
    minw = 1200
    if "--start" in sys.argv:
        start = int(sys.argv[sys.argv.index("--start") + 1])
    if "--source" in sys.argv:
        source = sys.argv[sys.argv.index("--source") + 1]
    if "--minw" in sys.argv:
        minw = int(sys.argv[sys.argv.index("--minw") + 1])

    results = search(query, source=source)
    tried = 0
    for item in results[start:]:
        lic = (item.get("license") or "").lower()
        if lic not in OK_LICENSES:
            continue
        url = item.get("url")
        if not url:
            continue
        tried += 1
        urls = [url]
        # Flickr sert un seul suffixe de taille : _b=1024 est trop petit pour un
        # cadrage 1400x800. On tente les variantes plus grandes avant l'original.
        if "staticflickr.com" in url:
            for small, big in (("_b.jpg", "_k.jpg"), ("_b.jpg", "_h.jpg"),
                               ("_b.jpg", "_c.jpg"), ("_z.jpg", "_b.jpg")):
                if url.endswith(small):
                    urls.insert(0, url[: -len(small)] + big)
        got = None
        for cand in urls:
            try:
                got = download(cand)
                break
            except Exception as exc:  # noqa: BLE001
                sys.stderr.write("dl fail %s: %s\n" % (cand, exc))
                continue
        if got is None:
            continue
        try:
            raw = got
            im = Image.open(io.BytesIO(raw))
            im.load()
            if im.width < minw or im.width / max(im.height, 1) < 1.15:
                continue
            im = im.convert("RGB")
            # recadrage centré 1400x800 (rapport 7:4)
            target_ratio = 1400 / 800
            w, h = im.size
            if w / h > target_ratio:
                nw = int(h * target_ratio)
                box = ((w - nw) // 2, 0, (w - nw) // 2 + nw, h)
            else:
                nh = int(w / target_ratio)
                box = (0, (h - nh) // 2, w, (h - nh) // 2 + nh)
            im = im.crop(box).resize((1400, 800), Image.LANCZOS)
            im.save(out, "JPEG", quality=82, optimize=True, progressive=True)
            print(json.dumps({
                "file": out,
                "title": item.get("title"),
                "creator": item.get("creator"),
                "license": item.get("license"),
                "license_version": item.get("license_version"),
                "license_url": item.get("license_url"),
                "source": item.get("foreign_landing_url"),
                "width_src": im.width,
            }, ensure_ascii=False))
            return 0
        except Exception as exc:  # noqa: BLE001
            sys.stderr.write("skip %s: %s\n" % (url, exc))
            continue
    sys.stderr.write("aucune image exploitable (%d essais)\n" % tried)
    return 1


if __name__ == "__main__":
    sys.exit(main())
