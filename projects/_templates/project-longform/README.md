# Project Longform Template

This template is the reusable longform project-page shell for portfolio case studies.

## Goal

Future project pages should generate from the same structure by changing content only:

- top fold copy and media
- sidebar note and footer copy
- expansion-panel content
- artifact rail tabs and cards
- visualization-stage content
- snackbar stack links/calls to action

## Files

- `project-longform.mjs`: page renderer
- `project-longform.css`: shell, hero, overlay-sidebar, and footer-note styling
- `presets.mjs`: reusable artifact presets that content can reference

## Content Shape

The renderer reads `project.templateContent.longform` if present, otherwise `project.templateContent`.

Expected high-level keys:

- `sidebar.noteTitle`
- `sidebar.note`
- `sidebar.noteOpen`
- `sidebar.navigationItems`
- `footer.copy`
- `hero.anchorId`
- `hero.title`
- `hero.tags`
- `hero.tabs`
- `hero.quotes`
- `hero.leftVisual` (optional)
- `hero.rightVisual` (optional)
- `hero.featureMedia`
- `blocks`
- `extraStyles`
- `extraScripts`

Supported block types right now:

- `expansion-panels`
- `artifact-rail`
- `asset-map-stage`
- `snackbar-stack`

## Artifact Rail

Each rail group can provide either:

- `cards`: an explicit array of artifacts
- `preset`: a named preset from `presets.mjs`

Current preset:

- `ludo-characters-iteration-01`
