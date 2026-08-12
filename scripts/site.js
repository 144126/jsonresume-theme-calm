const fs = require('node:fs');
const assert = require('node:assert');

const tail = /exports\.render = render;\nexports\.pdfRenderOptions = pdfRenderOptions;\n$/;
const src = fs.readFileSync(`${__dirname}/../index.js`, 'utf8');

assert.match(src, tail, 'index.js exports changed — update scripts/site.js');

fs.writeFileSync(
	`${__dirname}/../site/theme.js`,
	src.replace(tail, 'export { render, pdfRenderOptions };\n')
);

console.log('site/theme.js written');
