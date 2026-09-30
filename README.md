# Honest Switch

Independent comparison page: **verified alternatives to tools that keep raising prices**
(Harvest, QuickBooks Online, Invoice Radar — with real prices, honest catches, and sources).

Part of the Kairon venture (HYPERION universe, civilization `monetisation`) — first MVP,
opportunity `op-86bfa46484`.

## Structure

- `index.html` — the whole site (single page, no JS, no trackers, no cookies).
- `styles.css` — all styling (system fonts + Georgia for display, no CDN).
- `robots.txt`, `sitemap.xml` — SEO basics.

## Updating prices (the important part)

1. Re-check each vendor on its **official pricing page** (links are in the page's Sources section).
2. Update the table figures **and** the "checked" date (`30 Sep 2026`) in:
   - the hero kicker,
   - each table caption,
   - the honesty section and footer.
3. Never invent a price: if you cannot verify it on the vendor's own page, remove the figure
   and link to the page instead.
4. Commit + push; GitHub Pages redeploys in about a minute.

## Affiliate policy

No affiliate links at launch (stated on-page). If/when partner programs are joined:

- label each affiliate link (`rel="sponsored"` + visible marker),
- update the honesty box and the FAQ JSON-LD answer with the start date,
- commissions must never change which tools are listed.

## Deploy

GitHub Pages, branch `main`, path `/`. Live at https://nypsus.github.io/honest-switch/

Contact: nypsus.business@gmail.com
