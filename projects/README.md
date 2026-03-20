# Project Page System

This folder is the reusable project-page system for the portfolio. The homepage files at the repo root stay untouched:

- `index.html`
- `main.js`
- `style.css`

## Structure

- `projects/_data/site.json`: shared site-wide metadata, footer links, and carousel entries
- `projects/_data/projects/*.json`: one JSON file per project
- `projects/_build/load-project-data.mjs`: loads and validates JSON data before build
- `projects/_templates/render-project-page.mjs`: HTML renderer for shared sections
- `projects/_build/sync-reference-assets.mjs`: extracts shared CSS and JS from `design-project-template-desktop.html`
- `projects/_build/build-projects.mjs`: generates static HTML pages
- `projects/_shared/project-reference.css`: generated desktop-reference styles
- `projects/_shared/project-page.js`: generated shared desktop-reference behaviors
- `projects/_shared/project-system.css`: hand-authored theme overrides and optional section styles
- `projects/<slug>/index.html`: generated SEO-friendly project pages

## Workflow

1. Edit `design-project-template-desktop.html` when you want to change the shared desktop reference styling or behavior.
2. Edit `projects/_shared/project-system.css` when you want to add new theme tokens or optional section styling like galleries.
3. Edit `projects/_data/site.json` for shared metadata.
4. Edit the relevant file in `projects/_data/projects/` for project-specific content.
5. Run:

```bash
node projects/_build/build-projects.mjs
```

That command:

1. Syncs the shared CSS and JS from `design-project-template-desktop.html`
2. Validates the JSON data files
3. Rebuilds every static project page in `projects/<slug>/index.html`

## Adding a Project

Create a new JSON file in `projects/_data/projects/`, for example `new-project.json`:

```json
{
  "slug": "new-project",
  "title": "New Project",
  "theme": "art",
  "colorMode": "light",
  "seo": {
    "title": "New Project | Neel",
    "description": "Short summary for search and social."
  },
  "sections": [
    { "type": "hero" },
    { "type": "overview" },
    { "type": "gallery" },
    { "type": "outcomes" }
  ]
}
```

## Why This Is Safer

Project content is now stored as plain JSON instead of a hand-edited JS object. That means:

- project content edits do not risk breaking module syntax
- each project lives in its own file
- the build validates data shape before rendering pages
- malformed data fails with a useful error instead of quietly corrupting the output

## Optional Sections

Sections are opt-in per project. If one project needs a gallery and another does not, only include it on the project that needs it.

Supported section types in the current renderer:

- `hero`
- `overview`
- `context`
- `users`
- `process`
- `outcomes`
- `gallery`

If you need a new reusable section, add a renderer in `projects/_templates/render-project-page.mjs` and any supporting styles in `projects/_shared/project-system.css`.
