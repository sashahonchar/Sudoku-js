const fetch = require('node-fetch');
const fs = require('fs').promises;

var htmlEntities = {
	nbsp: ' ',
	cent: '¢',
	pound: '£',
	yen: '¥',
	euro: '€',
	copy: '©',
	reg: '®',
	lt: '<',
	gt: '>',
	quot: '"',
	amp: '&',
	apos: '\''
};

function unescapeHTML(str) {
	return str.replace(/\&([^;]+);/g, function (entity, entityCode) {
		var match;
		if (entityCode in htmlEntities) {
			return htmlEntities[entityCode];
			/*eslint no-cond-assign: 0*/
		} else if (match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
			return String.fromCharCode(parseInt(match[1], 16));
			/*eslint no-cond-assign: 0*/
		} else if (match = entityCode.match(/^#(\d+)$/)) {
			return String.fromCharCode(~~match[1]);
		} else {
			return entity;
		}
	});
};

const exportPen = penId => fetch(`https://codepen.io/killroy/pen/${penId}`, {mode: 'no-cors'})
	.then(res => res.text())
	.then(pen => ['html', 'css', 'js']
		.map(key => ({[key]: unescapeHTML(pen.match(new RegExp(`id="${key}" class="code-box"[\\s\\S]*?<code>[\\s\\n\\r]*([\\s\\S]*?)[\\s\\n\\r]*<\/code>`))[1])}))
		.reduce((acc, cur) => Object.assign(acc, cur, {}))
	);


var penId = 'oNbEjjJ';

exportPen(penId)
	.then(res => Promise.all(Object.keys(res).map(key => fs.writeFile(`${penId}.${key}`, res[key]))))
	.catch(err => console.error(err));