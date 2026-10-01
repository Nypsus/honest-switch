#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Télécharge un fichier Wikimedia Commons précis (via son titre) en 1920 px,
le recadre en 1400x800 et imprime le crédit exact (auteur, licence, page source).

Usage: python tools/commons_img.py "File:European robin Créteil 2.jpg" img/sortie.jpg
"""
import io
import json
import sys
import urllib.parse
import urllib.request

from PIL import Image

UA = "honest-switch-image-fetch/1.0 (contact: nypsus.business@gmail.com)"


def info(title, width=1920):
    p = {
        "action": "query", "format": "json", "titles": title,
        "prop": "imageinfo", "iiprop": "url|size|extmetadata", "iiurlwidth": str(width),
    }
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(p)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    d = json.loads(urllib.request.urlopen(req, timeout=40).read().decode())
    pg = list(d["query"]["pages"].values())[0]
    return (pg.get("imageinfo") or [{}])[0]


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    ii = info(sys.argv[1])
    src = ii.get("thumburl") or ii.get("url")
    meta = ii.get("extmetadata", {}) or {}
    raw = urllib.request.urlopen(
        urllib.request.Request(src, headers={"User-Agent": UA}), timeout=90).read()
    im = Image.open(io.BytesIO(raw)).convert("RGB")
    tr = 1400 / 800
    w, h = im.size
    if w / h > tr:
        nw = int(h * tr)
        box = ((w - nw) // 2, 0, (w - nw) // 2 + nw, h)
    else:
        nh = int(w / tr)
        box = (0, (h - nh) // 2, w, (h - nh) // 2 + nh)
    im.crop(box).resize((1400, 800), Image.LANCZOS).save(
        sys.argv[2], "JPEG", quality=82, optimize=True, progressive=True)
    print(json.dumps({
        "file": sys.argv[2],
        "commons": sys.argv[1],
        "creator": (meta.get("Artist", {}) or {}).get("value", "")[:120],
        "license": (meta.get("LicenseShortName", {}) or {}).get("value"),
        "page": ii.get("descriptionurl"),
    }, ensure_ascii=False))


if __name__ == "__main__":
    sys.exit(main())
