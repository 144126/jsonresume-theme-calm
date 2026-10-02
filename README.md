# jsonresume-theme-calm

A calm [JSON Resume](https://github.com/jsonresume/jsonresume.org/tree/master/packages/schema) theme. Soft sage palette on warm paper, hairline rules, no boxes or bars — and it is **page-break aware**, so a job or a heading never splits halfway down a page.

**[calm.apexlinks.org](https://calm.apexlinks.org)** — type a GitHub username, see that person's résumé in this theme. Every résumé also has its own address: [calm.apexlinks.org/144126](https://calm.apexlinks.org/144126) is that page with nothing on it but the résumé, ready to send or print.

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

## page breaks

Other themes often cut a section in half: the heading on page 1, the first job on page 2, or a role split across the fold. Calm does not shrink type to force one page. If a job, project, or item cannot sit comfortably on the page that is left, the whole piece starts on the next page.

A short resume still uses two columns on one A4 sheet. A long one keeps that same two-column split across as many pages as it needs.

## what it renders

Every standard section: `basics` (with location and all profiles), `work`, `projects`, `publications`, `awards` in the main column; `skills`, `education`, `certificates`, `volunteer`, `languages`, `interests`, `references` in the sidebar. Sections you leave out simply don't appear.

Dates follow what you give: `2011` stays a year, `2011-06` becomes `Jun 2011`, a missing `endDate` reads `present`.

## colours

Palette lives in CSS custom properties at the top of the `<style>` block — `--paper`, `--ink`, `--soft`, `--faint`, `--sage`, `--sage-deep`, `--line`. Fork and edit those seven values to re-tune the whole page.

Type is Noto Serif for the name, Noto Sans for everything else, with system fallbacks.

## the site

`site/` is the page behind [calm.apexlinks.org](https://calm.apexlinks.org). Visitors still read a public `resume.json` gist in the browser. Log in with GitHub to edit your own gist (including a secret one) from the chat on the right — voice input uses groq whisper, chunked the same way as long recordings.

```sh
npm run build:site   # regenerates site/theme.js from index.js
npm run deploy       # + wrangler deploy
```

Owner edit needs a GitHub OAuth app (callback `/callback`, scope `gist`) and these worker secrets: `GITHUB_CLIENT_SECRET`, `GROQ_API_KEY`, `OPENCODE_API_KEY`. `GITHUB_CLIENT_ID` is a wrangler var. Local: `.dev.vars`, then `wrangler dev`.


## license

MIT © Gold Edward Edem Hogan
