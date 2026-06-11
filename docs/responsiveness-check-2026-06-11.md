# Responsiveness Check — onyxpropcare.com (homepage)

**Date:** 2026-06-11
**URL tested:** https://onyxpropcare.com/ (live)
**Method:** Playwright (system Chrome), true per-viewport emulation, height 900px
**Mode:** Standard Check — 8 breakpoints (320 → 2560)

## Summary

**The homepage is responsive and holds up cleanly across the full device spectrum.** Navigation, the search card, category tabs, chips, and stats all reflow correctly with no content cut off and no user-facing horizontal scroll. One **Low / cosmetic** item: decorative blur-blob backgrounds extend past the viewport on phones, but they're clipped (`body{overflow-x:hidden}`) and **not user-scrollable** (`maxScrollX = 0`).

Verdict: **Pass.** No Critical/High/Medium issues.

## Breakpoint results

| Width | Device | innerWidth | scrollWidth | Horizontal scroll? | Layout |
|------:|--------|-----------:|------------:|--------------------|--------|
| 320 | Small phone | 320 | 460 | **No** (clipped) | Logo + hamburger; image hero; search card; tabs wrap; stats 2×2 — clean |
| 375 | Standard phone | 375 | 488 | **No** (clipped) | Same as 320; stats show real values (12,500+/8,400+/₹3,200 Cr) |
| 768 | Tablet portrait | 768 | 768 | No | Hamburger nav; tabs in one row; stacked Search button; clean |
| 1024 | Tablet land / laptop | 1024 | 1024 | No | **Full nav appears**; inline search row |
| 1280 | Laptop | 1280 | 1280 | No | Full 99acres-style image hero; "Now showing" caption; clean |
| 1440 | Desktop | 1440 | 1440 | No | Clean |
| 1920 | Full HD | 1920 | 1920 | No | Clean |
| 2560 | Ultra-wide | 2560 | 2560 | No | Content left-aligned (max-w-6xl), image fills; balanced |

## Transition detection

| Transition | From | To | Switches at |
|-----------|------|-----|-------------|
| Nav: hamburger → full menu | 768px | 1024px | **1024px** (Tailwind `lg`) — clean, no broken intermediate state |
| Search: stacked button → inline row | 768px | 1024px | **1024px** (`lg`) |
| Category tabs: wrapped → single row | 375px | 768px | ~640px (`sm`) |
| Stats: 2-column → single row | 375px | 768px | reflow via flex-wrap |

All transitions land on clean Tailwind breakpoints; no "half-broken" widths observed.

## Layout checks (8-point matrix)

| # | Check | Result |
|---|-------|--------|
| 1 | Horizontal overflow | ⚠️ **Low** — decorative blobs exceed width at 320/375 but are clipped, not scrollable |
| 2 | Text overflow | ✅ Pass — headline/subtext wrap cleanly; no truncation; legible sizes |
| 3 | Navigation transition | ✅ Pass — hamburger < 1024, full nav ≥ 1024, clean |
| 4 | Content stacking | ✅ Pass — multi-column reflows to single column in logical order |
| 5 | Image/media scaling | ✅ Pass — hero image `object-cover`, no distortion/overflow |
| 6 | Touch targets | ✅ Pass — search button, tabs, chips, dropdown all comfortably tappable on mobile |
| 7 | Whitespace balance | ✅ Pass — mobile breathes; ultra-wide keeps content in `max-w-6xl` (not lost) |
| 8 | CTA visibility | ✅ Pass — search card + Search button above the fold at every width |

## Findings & recommendations

### Low — cosmetic horizontal overflow on phones (optional cleanup)
Decorative blur-blob backgrounds (`w-[700px]`, `w-[400px] -right-40`, `w-[600px]`, `w-[500px] -left-40`) in the CTA / data-insights / why-onyx sections extend ~140px past a 320px viewport. They're clipped by `body{overflow-x:hidden}` so there's **no horizontal scrollbar and no content loss** — purely a `scrollWidth` artifact.
**Optional fix:** add `overflow-x-hidden` (or `overflow-hidden`) to those section wrappers so `scrollWidth` matches the viewport and any edge-case browser can't surface a stray scrollbar.

### Informational — mobile page is long
Total page height is ~11,034px at 320px vs ~6,074px at desktop (everything stacks to one column). Expected for a content homepage, not a break — but if mobile scroll-depth/engagement is low, consider trimming or lazy-loading below-the-fold marketing sections.

### Informational (content, not layout) — wide-screen hero imagery
At wide widths the live featured-listing photo can be off-brand for a land marketplace (e.g., a residential interior shot rather than farmland/plots). Not a responsiveness issue — addressed by the planned **curated hero images** (`CURATED_HERO_IMAGES`).

## Not tested
Other routes (`/properties`, property detail, dashboard, auth) — this was a single-page standard check of the homepage. Run a multi-URL pass to cover those.
