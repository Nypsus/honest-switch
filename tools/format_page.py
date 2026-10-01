#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Normalise une page produit Honest Switch au format verrouillé (01/10/2026).

Usage: python tools/format_page.py <slug> [<slug> ...] [--all] [--root .]

Actions:
 1. Supprime toute règle CSS de secours qui neutralise les animations
    (transition:none sur .dyn) et garantit le bloc .dyn standard.
 2. Colle la figure photo principale JUSTE APRÈS le paragraphe d'accroche
    (<p class="lede">...</p>), avant les .chips.
 3. Ajoute la classe dyn aux <section> qui ne l'ont pas (apparition en fondu).
 4. Vérifie l'observateur d'apparition et la classe html.js (sinon avertit).

Exit code 0 = conforme ; 1 = au moins un avertissement.
"""
import io
import os
import re
import sys

DYN_BLOCK = (
    '<style>'
    '.dyn{transition:opacity .7s cubic-bezier(.2,.7,.3,1),transform .7s cubic-bezier(.2,.7,.3,1)}'
    'html.js .dyn{opacity:0;transform:translateY(22px)}'
    'html.js .dyn.in{opacity:1;transform:none}'
    '</style>'
)

KILL_PATTERNS = [
    r'\.dyn,html\.js \.dyn,html\.js \.dyn\.in\{[^}]*transition:none[^}]*\}',
    r'html\.js \.dyn\{[^}]*transition:none[^}]*\}',
    r'\.dyn\{[^}]*transition:none[^}]*\}',
]


def normalize(path):
    t = io.open(path, encoding='utf-8', newline='').read()
    orig = t
    report = []

    # 1. règles de secours qui tuent les animations
    n_kill = 0
    for pat in KILL_PATTERNS:
        t, k = re.subn(pat, '', t)
        n_kill += k
    if n_kill:
        report.append('regles anti-animation supprimees: %d' % n_kill)
    if 'dyn' in t and 'cubic-bezier(.2,.7,.3,1)' not in t:
        t = t.replace('</head>', '    ' + DYN_BLOCK + '\n</head>', 1)
        report.append('bloc .dyn insere')

    # 2. figure photo principale juste après l'accroche
    mfig = re.search(r'\n?\s*<figure class="photo(?: dyn)?">.*?</figure>\n?', t, re.S)
    mlede = re.search(r'<p class="lede">.*?</p>', t, re.S)
    if mfig and mlede and (mfig.start() - mlede.end()) > 60:
        fig = mfig.group(0).strip('\n')
        fig = re.sub(r'^\s*', '', fig).rstrip()
        t = t.replace(mfig.group(0), '\n', 1)
        m2 = re.search(r'(<p class="lede">.*?</p>)', t, re.S)
        if m2 is not None:
            t = t[:m2.end(1)] + '\n\n    ' + fig + t[m2.end(1):]
            report.append('figure deplacee apres l\'accroche')

    # 3. classe dyn sur les sections
    n_dyn = 0

    def add_dyn(m):
        nonlocal n_dyn
        cls = m.group(1)
        if 'dyn' in cls.split():
            return m.group(0)
        n_dyn += 1
        return m.group(0).replace('class="' + cls + '"', 'class="' + cls + ' dyn"')

    t = re.sub(r'<section[^>]*class="([^"]*)"', add_dyn, t)
    if n_dyn:
        report.append('dyn ajoute aux sections: %d' % n_dyn)

    # 4. contrôles
    if 'IntersectionObserver' not in t:
        report.append('ATTENTION: observateur d\'apparition manquant')
    if "classList.add('js')" not in t and 'classList.add("js")' not in t:
        report.append('ATTENTION: classe html.js manquante')

    if t != orig:
        io.open(path, 'w', encoding='utf-8', newline='').write(t)
    return report


def main():
    args = sys.argv[1:]
    root = '.'
    slugs = []
    i = 0
    while i < len(args):
        if args[i] == '--all':
            slugs = [d for d in os.listdir(root)
                     if os.path.isdir(os.path.join(root, d))
                     and os.path.exists(os.path.join(root, d, 'index.html'))]
        elif args[i] == '--root':
            i += 1
            root = args[i]
        else:
            slugs.append(args[i])
        i += 1
    if not slugs:
        print(__doc__)
        sys.exit(2)
    bad = 0
    for s in sorted(slugs):
        p = os.path.join(root, s, 'index.html')
        if not os.path.exists(p):
            print(s, ': introuvable')
            bad += 1
            continue
        rep = normalize(p)
        print(s, ':', ('; '.join(rep) if rep else 'deja conforme'))
        if any(r.startswith('ATTENTION') for r in rep):
            bad += 1
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
