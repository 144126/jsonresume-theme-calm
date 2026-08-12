# jsonresume-theme-calm

A calm [JSON Resume](https://jsonresume.org) theme. Soft sage palette on warm paper, hairline rules, no boxes or bars — and it fits **everything on a single A4 page**.

**[calm.apexlinks.org](https://calm.apexlinks.org)** — type a GitHub username, see that person's résumé in this theme. Deep links work too: [calm.apexlinks.org/?u=144126](https://calm.apexlinks.org/?u=144126).

![preview](https://raw.githubusercontent.com/144126/jsonresume-theme-calm/main/preview.png)

## use

```sh
npm i -g resumed jsonresume-theme-calm

resumed render resume.json --theme jsonresume-theme-calm --output resume.html
resumed export resume.json --theme jsonresume-theme-calm --output resume.pdf   # needs puppeteer
```

No puppeteer? Print the HTML with any Chrome you already have:

```sh
chrome --headless --no-pdf-header-footer --print-to-pdf=resume.pdf resume.html
```

Works with `resume-cli` too (`resume export --theme calm`), and from code:

```js
const { render } = require('jsonresume-theme-calm');
const html = render(require('./resume.json'));
```

## one page, always

The page sizes itself to your content: on load it picks the largest body size between **6.8pt and 10.4pt** that still fits A4, so a short resume fills the page and a long one stays on it. Nothing is scrollable, nothing spills to page two.

Two levers if a very long resume hits the 6.8pt floor:

- project descriptions are trimmed to whole sentences within a ~150 character budget (`clamp(p.description, 150)` in `index.js`)
- work summaries get ~240

## what it renders

Every standard section: `basics` (with location and all profiles), `work`, `projects`, `publications`, `awards` in the main column; `skills`, `education`, `certificates`, `volunteer`, `languages`, `interests`, `references` in the sidebar. Sections you leave out simply don't appear.

Dates follow what you give: `2011` stays a year, `2011-06` becomes `Jun 2011`, a missing `endDate` reads `present`.

## colours

Palette lives in CSS custom properties at the top of the `<style>` block — `--paper`, `--ink`, `--soft`, `--faint`, `--sage`, `--sage-deep`, `--line`. Fork and edit those seven values to re-tune the whole page.

Type is Noto Serif for the name, Noto Sans for everything else, with system fallbacks.

## the site

`site/` is the page behind [calm.apexlinks.org](https://calm.apexlinks.org) — one static HTML file, no server. It reads the visitor's chosen gist straight from the GitHub API in their browser, so the rate limit is theirs and nothing is stored anywhere.

```sh
npm run build:site   # regenerates site/theme.js from index.js
npm run deploy       # + wrangler deploy
```

## license

MIT © Gold Edward Edem Hogan
