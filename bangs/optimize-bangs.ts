import fs from 'node:fs';
import _ from 'lodash';

import normalizeUrl from 'normalize-url';
// import { unescape } from 'node:querystring';

// Make sure we got a filename on the command line.
if (process.argv.length < 3) {
	console.warn('Usage: node ' + process.argv[1] + ' FILENAME');
	process.exit(1);
}

const filename = process.argv[2];

const queryPlaceholder = '{{{s}}}';
const bangProviderPlaceHolder = 'http://{b}'; // Example: `duckduckgo.com`
const temporarySafePlaceholder = 'safe_placeholder';

const catCounts: Record<string, number> = {};

try {
	const data = fs.readFileSync(filename, 'utf8');
	const json = JSON.parse(data);

	let results = _.chain(json)
		.map((bang) => {
			let url = bang.u;
			if (url[0] === '/') {
				// User can switch between DuckDuckGo, Kagi, Google, etc.
				url = bangProviderPlaceHolder + url;
			}
			url = url.replaceAll(queryPlaceholder, temporarySafePlaceholder);

			const urlObject = new URL(normalizeUrl(url));

			bang.u = urlObject.href
				.replaceAll(temporarySafePlaceholder, queryPlaceholder)
				.replaceAll(bangProviderPlaceHolder, '')
				.replaceAll(/^https:\/\//g, '')
				.replaceAll(queryPlaceholder, '{Q}');

			// Side effect:
			if (bang.c) {
				if (!catCounts[bang.c]) {
					catCounts[bang.c] = 0;
				}
				catCounts[bang.c]++;
			}

			if (bang.sc) {
				if (!catCounts[bang.sc]) {
					catCounts[bang.sc] = 0;
				}
				catCounts[bang.sc]++;
			}

			return bang;
		})
		.value();

	const cats = _.sortBy(Object.entries(catCounts), (a) => -a[1]).reduce((result, value, index) => {
		result[value[0]] = index;
		return result;
	}, {});

	console.warn(cats);

	results = results.map((bang) => {
		if (bang.c) {
			bang.c = cats[bang.c];
		}

		if (bang.sc) {
			bang.sc = cats[bang.sc];
		}
		return bang;
	});
	/*
		.reduce(
			(result, value, key) => {
				result[0].push(value.s);
				result[1].push(value.d);
				result[2].push(value.t);
				result[3].push(value.u);
				result[4].push(value.c);
				result[5].push(value.sc);
				return result;
			},
			[[], [], [], [], [], []]
		);
        */

	results.unshift(Object.keys(cats));

	console.log(JSON.stringify(results, null, 2));
} catch (err) {
	console.error(err);
}
