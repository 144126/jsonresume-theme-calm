const esc = (s) =>
	String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

const clamp = (s, budget) => {
	let out = '';
	for (const sentence of String(s ?? '').split(/(?<=\.)\s+/)) {
		if (out && (out + ' ' + sentence).length > budget) break;
		out += (out ? ' ' : '') + sentence;
	}
	return out;
};

const host = (u) =>
	String(u ?? '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');

const dot = (parts) => parts.filter(Boolean).join(' <span class="sep">·</span> ');

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const when = (d) => {
	const [y, m] = String(d ?? '').split('-');
	return m ? `${months[+m - 1]} ${y}` : y;
};

const range = (from, to) => {
	const a = when(from);
	const b = to ? when(to) : from ? 'present' : '';
	return !a || a === b ? b : !b ? a : `${a} – ${b}`;
};

const section = (title, body) => (body ? `<section><h2>${title}</h2>${body}</section>` : '');

const link = (url) => (url ? ` <a href="${esc(url)}">${esc(host(url))}</a>` : '');

const line = (name, rest) =>
	`<p class="line"><span class="lead">${esc(name)}</span>${rest ? ` <span class="rest">${rest}</span>` : ''}</p>`;

const note = (text, budget) => (text ? `<p class="note">${esc(clamp(text, budget))}</p>` : '');

const bullets = (items) =>
	items?.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : '';

const entry = (title, org, dates, url, body) => `<article>
	<h3>${esc(title)}${org ? ` <span class="org">${esc(org)}</span>` : ''}${link(url)}${
		dates ? `<span class="when">${dates}</span>` : ''
	}</h3>${body}</article>`;

function render(resume) {
	const b = resume.basics ?? {};
	const l = b.location ?? {};

	const contact = dot([
		b.email && `<a href="mailto:${esc(b.email)}">${esc(b.email)}</a>`,
		esc(b.phone),
		[l.city, l.region, l.countryCode].filter(Boolean).map(esc).join(', '),
		b.url && `<a href="${esc(b.url)}">${esc(host(b.url))}</a>`,
		...(b.profiles ?? []).map((p) =>
			p.url
				? `<a href="${esc(p.url)}">${esc(host(p.url))}</a>`
				: esc([p.network, p.username].filter(Boolean).join(' '))
		)
	]);

	const work = (resume.work ?? [])
		.map((w) =>
			entry(
				w.position || w.name,
				w.position ? w.name : '',
				range(w.startDate, w.endDate),
				w.url,
				note(w.summary, 240) + bullets(w.highlights)
			)
		)
		.join('');

	const projects = (resume.projects ?? [])
		.map((p) =>
			entry(
				p.name,
				'',
				range(p.startDate, p.endDate),
				p.website || p.url,
				`<p>${esc(clamp(p.description, 150))}</p>` + bullets(p.highlights)
			)
		)
		.join('');

	const publications = (resume.publications ?? [])
		.map((p) => line(p.name, dot([esc(p.publisher), when(p.releaseDate)])) + note(p.summary, 150))
		.join('');

	const awards = (resume.awards ?? [])
		.map((a) => line(a.title, dot([esc(a.awarder), when(a.date)])) + note(a.summary, 150))
		.join('');

	const skills = (resume.skills ?? [])
		.map((s) =>
			line(s.name, dot([s.level && esc(s.level.toLowerCase()), ...(s.keywords ?? []).map(esc)]))
		)
		.join('');

	const education = (resume.education ?? [])
		.map((e) =>
			line(
				[e.studyType, e.area].filter(Boolean).join(' '),
				dot([esc(e.institution), range(e.startDate, e.endDate), esc(e.score)])
			)
		)
		.join('');

	const certificates = (resume.certificates ?? [])
		.map((c) => line(c.name, dot([esc(c.issuer), when(c.date)])))
		.join('');

	const volunteer = (resume.volunteer ?? [])
		.map(
			(v) =>
				line(v.position, dot([esc(v.organization), range(v.startDate, v.endDate)])) +
				note(v.summary || v.description, 150) +
				bullets(v.highlights)
		)
		.join('');

	const languages = (resume.languages ?? [])
		.map((x) => line(x.language, esc(x.fluency)))
		.join('');

	const interests = (resume.interests ?? [])
		.map((i) => line(i.name, dot((i.keywords ?? []).map(esc))))
		.join('');

	const references = (resume.references ?? [])
		.map((r) => line(r.name, '') + note(r.reference, 160))
		.join('');

	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(b.name)}${b.label ? ` — ${esc(b.label)}` : ''}</title>
<style>
:root {
	--paper: #fdfcf9;
	--ink: #38434b;
	--soft: #5f6e74;
	--faint: #94a09f;
	--sage: #7b9a8e;
	--sage-deep: #5b7d70;
	--line: #e7e6de;
	--serif: 'Noto Serif', Cambria, Georgia, serif;
	--sans: 'Noto Sans', 'Segoe UI', system-ui, sans-serif;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
@page { size: A4; margin: 0; }
html { background: #eceae4; }
body {
	width: 210mm;
	min-height: 297mm;
	margin: 0 auto;
	padding: 13mm 14mm 10mm;
	background: var(--paper);
	color: var(--soft);
	font-family: var(--sans);
	font-size: 8.6pt;
	line-height: 1.5;
	-webkit-font-smoothing: antialiased;
}
a { color: var(--sage-deep); text-decoration: none; }
.sep { color: var(--faint); padding: 0 .12em; }

header { text-align: center; padding-bottom: 5.5mm; }
h1 {
	font-family: var(--serif);
	font-size: 2.45em;
	font-weight: 400;
	letter-spacing: .01em;
	color: var(--ink);
	line-height: 1.15;
}
.label { margin-top: 1.6mm; color: var(--sage-deep); letter-spacing: .015em; }
.contact { margin-top: 2.2mm; font-size: .94em; color: var(--soft); }

.summary {
	max-width: 168mm;
	margin: 0 auto;
	padding: 4mm 0 5.5mm;
	border-top: .3pt solid var(--line);
	border-bottom: .3pt solid var(--line);
	text-align: center;
	font-size: .98em;
	line-height: 1.62;
}

main {
	display: grid;
	grid-template-columns: 1.34fr 1fr;
	column-gap: 9mm;
	padding-top: 5.5mm;
}

section { margin-bottom: 5mm; }
section:last-child { margin-bottom: 0; }
h2 {
	font-size: .84em;
	font-weight: 600;
	letter-spacing: .18em;
	text-transform: lowercase;
	color: var(--sage);
	padding-bottom: 1.1mm;
	margin-bottom: 2.4mm;
	border-bottom: .3pt solid var(--line);
}

article { margin-bottom: 2.6mm; break-inside: avoid; }
h3 {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: .35em;
	font-size: .99em;
	font-weight: 600;
	color: var(--ink);
	line-height: 1.35;
}
h3 .org { font-weight: 400; color: var(--soft); }
h3 a { font-weight: 400; font-size: .87em; color: var(--sage); }
h3 .when { margin-left: auto; font-weight: 400; font-size: .87em; color: var(--faint); }
article p { line-height: 1.47; }

ul { list-style: none; margin-top: .4mm; }
li { padding-left: 2.7mm; position: relative; line-height: 1.47; }
li::before { content: '·'; position: absolute; left: .7mm; color: var(--sage); }

.line { margin-bottom: 1.9mm; line-height: 1.45; }
.lead { color: var(--ink); font-weight: 600; }
.rest { color: var(--soft); }
.note { color: var(--soft); margin: -1.3mm 0 1.9mm; line-height: 1.47; }

@media print { html { background: var(--paper); } }
</style>
</head>
<body>
<header>
	<h1>${esc(b.name)}</h1>
	${b.label ? `<p class="label">${esc(b.label).replace(/\s*\|\s*/g, ' <span class="sep">·</span> ')}</p>` : ''}
	${contact ? `<p class="contact">${contact}</p>` : ''}
</header>
${b.summary ? `<p class="summary">${esc(b.summary)}</p>` : ''}
<main>
	<div>
		${section('experience', work)}
		${section('selected work', projects)}
		${section('publications', publications)}
		${section('awards', awards)}
	</div>
	<div>
		${section('skills', skills)}
		${section('education', education)}
		${section('certificates', certificates)}
		${section('volunteering', volunteer)}
		${section('languages', languages)}
		${section('interests', interests)}
		${section('references', references)}
	</div>
</main>
<script>
(function () {
	var main = document.querySelector('main');
	var pad = parseFloat(getComputedStyle(document.body).paddingBottom);
	var page = (297 / 25.4) * 96 - 6;
	var fits = function () {
		return main.getBoundingClientRect().bottom + window.scrollY + pad <= page;
	};
	var best = 6.8;
	for (var size = 6.8; size <= 10.4; size += 0.1) {
		document.body.style.fontSize = size.toFixed(1) + 'pt';
		if (!fits()) break;
		best = size;
	}
	document.body.style.fontSize = best.toFixed(1) + 'pt';
})();
</script>
</body>
</html>`;
}

const pdfRenderOptions = {
	format: 'A4',
	printBackground: true,
	preferCSSPageSize: true
};

exports.render = render;
exports.pdfRenderOptions = pdfRenderOptions;
