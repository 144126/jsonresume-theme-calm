const esc = (s) =>
	String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

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

const section = (i, title, body) =>
	body ? `<section data-i="${i}" data-k="${title}"><h2>${title}</h2>${body}</section>` : '';

const link = (url) => (url ? ` <a href="${esc(url)}">${esc(host(url))}</a>` : '');

const line = (name, rest) =>
	`<p class="line"><span class="lead">${esc(name)}</span>${rest ? ` <span class="rest">${rest}</span>` : ''}</p>`;

const note = (text) => (text ? `<p class="note">${esc(text)}</p>` : '');

const bullets = (items) =>
	items?.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : '';

const item = (html) => (html ? `<div class="item">${html}</div>` : '');

const entry = (title, org, dates, url, body) => `<article>
	<h3>${esc(title)}${org ? ` <span class="org">${esc(org)}</span>` : ''}${link(url)}${
		dates ? `<span class="when">${dates}</span>` : ''
	}</h3>${body}</article>`;

function render(resume) {
	const b = resume.basics ?? {};
	const l = b.location ?? {};
	const one = (resume.meta ?? {}).layout === 'one';

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
				note(w.summary) + bullets(w.highlights)
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
				(p.description ? `<p>${esc(p.description)}</p>` : '') + bullets(p.highlights)
			)
		)
		.join('');

	const publications = (resume.publications ?? [])
		.map((p) => item(line(p.name, dot([esc(p.publisher), when(p.releaseDate)])) + note(p.summary)))
		.join('');

	const awards = (resume.awards ?? [])
		.map((a) => item(line(a.title, dot([esc(a.awarder), when(a.date)])) + note(a.summary)))
		.join('');

	const skills = (resume.skills ?? [])
		.map((s) =>
			item(line(s.name, dot([s.level && esc(s.level.toLowerCase()), ...(s.keywords ?? []).map(esc)])))
		)
		.join('');

	const education = (resume.education ?? [])
		.map((e) =>
			item(
				line(
					[e.studyType, e.area].filter(Boolean).join(' '),
					dot([esc(e.institution), range(e.startDate, e.endDate), esc(e.score)])
				)
			)
		)
		.join('');

	const certificates = (resume.certificates ?? [])
		.map((c) => item(line(c.name, dot([esc(c.issuer), when(c.date)]))))
		.join('');

	const volunteer = (resume.volunteer ?? [])
		.map((v) =>
			item(
				line(v.position, dot([esc(v.organization), range(v.startDate, v.endDate)])) +
					note(v.summary || v.description) +
					bullets(v.highlights)
			)
		)
		.join('');

	const languages = (resume.languages ?? [])
		.map((x) => item(line(x.language, esc(x.fluency))))
		.join('');

	const interests = (resume.interests ?? [])
		.map((i) => item(line(i.name, dot((i.keywords ?? []).map(esc)))))
		.join('');

	const references = (resume.references ?? [])
		.map((r) => item(line(r.name, '') + note(r.reference)))
		.join('');

	let n = 0;
	const sec = (title, body) => section(n++, title, body);

	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(b.name)}${b.label ? ` — ${esc(b.label)}` : ''}</title>
<style>
:root {
	--paper: #fdfcf9;
	--ink: #000;
	--soft: #000;
	--faint: #000;
	--sage: #000;
	--sage-deep: #000;
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
	padding: 11mm 14mm 8mm;
	background: var(--paper);
	color: var(--soft);
	font-family: var(--sans);
	font-size: 9.4pt;
	line-height: 1.5;
	-webkit-font-smoothing: antialiased;
}
body.paged {
	min-height: 0;
	padding: 0;
	background: transparent;
}
.sheet {
	width: 210mm;
	height: 297mm;
	overflow: hidden;
	margin: 0 0 8mm;
	padding: 11mm 14mm 8mm;
	background: var(--paper);
}
a { color: var(--sage-deep); text-decoration: none; }
.sep { color: var(--faint); padding: 0 .12em; }

header { text-align: center; padding-bottom: 4mm; break-inside: avoid; }
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
	padding: 3.2mm 0 4mm;
	border-top: .3pt solid var(--line);
	border-bottom: .3pt solid var(--line);
	text-align: center;
	font-size: .98em;
	line-height: 1.62;
	break-inside: avoid;
}

main {
	display: grid;
	grid-template-columns: 1.34fr 1fr;
	column-gap: 9mm;
	padding-top: 4mm;
	align-items: start;
}
main.one { display: block; }
main.one section { margin-bottom: 7mm; }
main.one article { margin-bottom: 3.6mm; }
main.one .item { margin-bottom: 2.6mm; }

section { margin-bottom: 4mm; }
section:last-child { margin-bottom: 0; }
h2 {
	font-size: .84em;
	font-weight: 600;
	letter-spacing: .06em;
	text-transform: capitalize;
	color: var(--ink);
	padding-bottom: 1.1mm;
	margin-bottom: 2.4mm;
	border-bottom: .3pt solid var(--line);
	break-after: avoid;
	page-break-after: avoid;
}

article, .item { margin-bottom: 2mm; break-inside: avoid; page-break-inside: avoid; }
h3 {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: .35em;
	font-size: .99em;
	font-weight: 600;
	color: var(--ink);
	line-height: 1.35;
	break-after: avoid;
	page-break-after: avoid;
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
.note { color: var(--soft); margin: 0.8mm 0 1.9mm; line-height: 1.47; }

@media print {
	html { background: var(--paper); }
	body { width: 210mm; margin: 0; min-height: 0; }
	body.paged { background: transparent; }
	.sheet { margin: 0; break-after: page; page-break-after: always; }
	.sheet:last-child { break-after: auto; page-break-after: auto; }
}
</style>
</head>
<body>
<header>
	<h1>${esc(b.name)}</h1>
	${b.label ? `<p class="label">${esc(b.label).replace(/\s*\|\s*/g, ' <span class="sep">·</span> ')}</p>` : ''}
	${contact ? `<p class="contact">${contact}</p>` : ''}
</header>
${b.summary ? `<p class="summary">${esc(b.summary)}</p>` : ''}
<main class="one">
	${sec('experience', work)}
	${sec('selected work', projects)}
	${sec('publications', publications)}
	${sec('awards', awards)}
	${sec('skills', skills)}
	${sec('education', education)}
	${sec('certificates', certificates)}
	${sec('volunteering', volunteer)}
	${sec('languages', languages)}
	${sec('interests', interests)}
	${sec('references', references)}
</main>
<script>
(function () {
	var body = document.body;
	var main = document.querySelector('main');
	var two = ${one ? 'false' : 'true'};
	var leftKeys = {
		experience: 1,
		publications: 1,
		awards: 1,
		skills: 1,
		education: 1,
		certificates: 1
	};

	var findSec = function (root, title) {
		var list = root.querySelectorAll('section');
		for (var i = 0; i < list.length; i++) {
			if (list[i].getAttribute('data-k') === title) return list[i];
		}
		return null;
	};

	var ensureSec = function (col, title) {
		var sec = findSec(col, title);
		if (sec) return sec;
		sec = document.createElement('section');
		sec.setAttribute('data-k', title);
		var h2 = document.createElement('h2');
		h2.appendChild(document.createTextNode(title));
		sec.appendChild(h2);
		col.appendChild(sec);
		return sec;
	};

	var limitOf = function (page) {
		var pad = parseFloat(getComputedStyle(page).paddingBottom) || 0;
		var room = 8 * (96 / 25.4);
		return page.getBoundingClientRect().bottom - pad - room;
	};

	var overflows = function (page, el) {
		return el.getBoundingClientRect().bottom > limitOf(page) + 1;
	};

	var header = document.querySelector('header');
	var summary = document.querySelector('.summary');
	var left = [];
	var right = [];
	[].slice.call(main.querySelectorAll('section')).forEach(function (sec) {
		var title = sec.getAttribute('data-k');
		var kids = [].slice.call(sec.children).filter(function (n) {
			return n.tagName !== 'H2';
		});
		kids.forEach(function (el, idx) {
			(two && leftKeys[title] ? left : right).push({ title: title, el: el, idx: idx });
		});
	});

	body.className = 'paged';
	body.innerHTML = '';

	var page;
	var destL;
	var destR;

	var addPage = function () {
		page = document.createElement('div');
		page.className = 'sheet';
		var dest = document.createElement('main');
		if (header) {
			page.appendChild(header);
			header = null;
			if (summary) {
				page.appendChild(summary);
				summary = null;
			}
		}
		if (two) {
			destL = document.createElement('div');
			destR = document.createElement('div');
			dest.appendChild(destL);
			dest.appendChild(destR);
		} else {
			dest.className = 'one';
			destL = destR = dest;
		}
		page.appendChild(dest);
		body.appendChild(page);
	};

	var put = function (a, col) {
		var fresh = !findSec(col, a.title);
		var empty = !col.firstChild;
		var sec = ensureSec(col, a.title);
		sec.appendChild(a.el);
		if (!overflows(page, a.el)) return true;
		sec.removeChild(a.el);
		if (fresh) col.removeChild(sec);
		else if (sec.children.length === 1) col.removeChild(sec);
		if (!empty) return false;
		sec = ensureSec(col, a.title);
		sec.appendChild(a.el);
		return true;
	};

	var fill = function (list, col) {
		while (list.length && put(list[0], col)) list.shift();
	};

	var balance = function () {
		if (!two || (destL.firstChild && destR.firstChild)) return;
		var full = destL.firstChild ? destL : destR;
		var empty = destL.firstChild ? destR : destL;
		var secs = [].slice.call(full.children);
		if (secs.length < 2) return;
		secs.slice(Math.ceil(secs.length / 2)).forEach(function (s) {
			empty.appendChild(s);
		});
	};

	addPage();
	for (;;) {
		if (two && !left.length) {
			fill(right, destL);
			fill(right, destR);
		} else if (two && !right.length) {
			fill(left, destL);
			fill(left, destR);
		} else {
			fill(left, destL);
			fill(right, destR);
		}
		balance();
		if (!left.length && !right.length) break;
		addPage();
	}
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
