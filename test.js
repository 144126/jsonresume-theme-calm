const assert = require('node:assert');
const { render } = require('./index.js');

const html = render({
	basics: {
		name: 'Ada <Lovelace>',
		label: 'Analyst | Mathematician',
		email: 'ada@example.com',
		location: { city: 'London', countryCode: 'UK' },
		profiles: [{ network: 'GitHub', url: 'https://github.com/ada' }],
		summary: 'First programmer.'
	},
	work: [
		{
			name: 'Analytical Engine',
			position: 'Analyst',
			startDate: '1842-09',
			endDate: '1843-08',
			summary: 'Wrote note G. Described a general purpose machine.',
			highlights: ['First published algorithm']
		}
	],
	education: [{ institution: 'Home', studyType: 'BSc', area: 'Maths', endDate: '1835' }],
	skills: [{ name: 'Maths', level: 'Expert', keywords: ['Algorithms'] }],
	projects: [{ name: 'Note G', description: 'Bernoulli numbers.', website: 'https://example.com/g' }],
	volunteer: [{ organization: 'Society', position: 'Member', startDate: '1840', endDate: '1840' }]
});

assert.match(html, /Ada &lt;Lovelace&gt;/, 'escapes html in values');
assert.doesNotMatch(html, /<Lovelace>/, 'never emits raw markup from data');
assert.match(html, /Sep 1842 – Aug 1843/, 'formats month ranges');
assert.match(html, /<span class="rest">Home <span class="sep">·<\/span> 1835/, 'end-date-only stays a single year');
assert.match(html, /Society <span class="sep">·<\/span> 1840<\/span>/, 'collapses identical start and end dates');
assert.match(html, /github\.com\/ada/, 'links profiles by host');
assert.match(html, /<h2>experience<\/h2>/, 'renders sections present in the resume');
assert.doesNotMatch(html, /<h2>awards<\/h2>/, 'omits sections absent from the resume');
assert.match(html, /@page \{ size: A4/, 'declares A4 page geometry');

console.log('ok');
