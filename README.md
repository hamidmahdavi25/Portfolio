# Hamid Mahdavi — Portfolio

Personal portfolio of a Senior Structural Designer, live at **[hamidmahdavi.com](https://hamidmahdavi.com/)**.

Dependency-free static site on GitHub Pages — no frameworks, no build step. HTML, CSS, vanilla JS, and JSON.

## How it works

- All content lives in `data/*.json`, rendered client-side by vanilla JS — edit content without touching code.
- Self-hosted fonts (`fonts/`), no external CDN.
- Images: each photo ships as JPEG + WebP + small WebP; cards load the small variant, the lightbox the large one via `srcset`.
- Dark/light themes via CSS variables, saved to `localStorage`, applied before first paint.

## Editing content

| File | Controls |
|---|---|
| `data/hero.json` | Name, role, intro, CTA buttons |
| `data/experience.json` | Experience timeline |
| `data/education.json` | Education cards |
| `data/projects.json` | Main project cards |
| `data/more-projects.json` | Compact projects list |
| `data/skills.json` | Skill tags |
| `data/contact.json` | Contact section, footer |

## Adding a project

1. Add an entry to `data/projects.json` with a new id (e.g. `p9`) and set `"images"` to the photo count.
2. For each photo, add three files to `images/projects/`: `p9i1.jpg` (fallback), `p9i1.webp` (lightbox), `p9i1-sm.webp` (card cover).
3. New category? Add a matching filter button in `index.html`.

## Run locally

Content loads via `fetch()`, so it needs a server (not `file://`):

```sh
python -m http.server 8000
```
