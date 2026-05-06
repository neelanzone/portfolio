Archived during homepage dead-code removal on 2026-04-21.

Archived snapshots
- `archive/index-pre-deadcode-20260421.html`
- `archive/style-pre-deadcode-20260421.css`
- `archive/home-alt-pre-deadcode-20260421.css`
- `archive/home-alt-pre-deadcode-20260421.js`
- `archive/home-background-pre-deadcode-20260421.js`

Moved legacy files
- `archive/main-legacy-20260421.js`
- `archive/mobile-legacy-20260421.css`

Removed from live homepage bundle
- Legacy page loader, hero-content, title-card, work-section-heading, and contact/notebook/button CSS from `style.css`
- Dead density/sphere control CSS and JS from `home-alt.css` and `home-background.js`
- Unreachable `data-home-tone='default'` homepage overrides from `home-alt.css`
- Dead filing-open selector paths from `home-alt.css`
- No-op scene-only persistence wrappers and dormant filing-card logic from `home-alt.js`
- Stale `data-home-tone="color"` boot wiring from `index.html`

Notes
- `archive/homepage-2026-03-27.html` was updated to point at the archived legacy `main` and `mobile` assets.
- The live homepage mobile menu logic now targets `#mobile-menu-button`, which matches the rendered navbar markup.
