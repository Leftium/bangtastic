import fs from 'node:fs';
import _ from 'lodash';

import { TidyURL } from 'tidy-url';
import { unescape } from 'node:querystring';

// Make sure we got a filename on the command line.
if (process.argv.length < 3) {
	console.warn('Usage: node ' + process.argv[1] + ' FILENAME');
	process.exit(1);
}

const filename = process.argv[2];

const queryPlaceholder = '{{{s}}}';
const bangProviderPlaceHolder = 'http://{b}'; // Example: `duckduckgo.com`
const temporarySafePlaceholder = 'SAFE_PLACEHOLDER';

try {
	const data = fs.readFileSync(filename, 'utf8');
	const json = JSON.parse(data);

	const results = _.chain(json)
		.map((bang) => {
			let url = bang.u;
			if (url[0] === '/') {
				// User can switch between DuckDuckGo, Kagi, Google, etc.
				url = bangProviderPlaceHolder + url;
			}
			url = url.replaceAll(queryPlaceholder, temporarySafePlaceholder);

			const urlObject = new URL(url);

			// Strip extra Google custom search engine params.
			if (urlObject.searchParams.get('cof')?.toLowerCase().includes('forid')) {
				[...urlObject.searchParams.entries()]
					.filter(([, value]) => !value.includes(temporarySafePlaceholder))
					.forEach(([key, value]) => {
						urlObject.searchParams.delete(key, value);
					});
			}

			let href = urlObject.href;

			// TidyURL error on this domain:
			if (!href.includes('youtube.com')) {
				/// console.warn(href);
				bang.u = unescape(TidyURL.clean(href).url)
					.replaceAll(temporarySafePlaceholder, queryPlaceholder)
					.replaceAll(bangProviderPlaceHolder, '');
			}

			return bang;
		})
		.value();

	console.log(JSON.stringify(results, null, 2));
} catch (err) {
	console.error(err);
}
