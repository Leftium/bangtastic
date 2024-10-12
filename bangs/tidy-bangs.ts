import fs from 'node:fs';
import _ from 'lodash';

import { TidyURL } from 'tidy-url';
import { unescape } from 'node:querystring';

const options = {
	trim: process.argv.includes('--trim'),
	unescapeUrl: process.argv.includes('--unescape-url'),
	stripGoogle: process.argv.includes('--strip-google'),
	tidyUrl: process.argv.includes('--tidy-url'),
	filename: process.argv.at(-1) || ''
};

console.warn({ options });

// Make sure we got a filename on the command line.
if (process.argv.length < 3 || /^--/.test(options.filename)) {
	console.warn('Usage: node ' + process.argv[1] + ' FILENAME');
	process.exit(1);
}

const queryPlaceholder = '{{{s}}}';
const bangProviderPlaceHolder = 'http://{b}'; // Example: `duckduckgo.com`
const temporarySafePlaceholder = 'safe_placeholder';

try {
	const data = fs.readFileSync(options.filename, 'utf8');
	const json = JSON.parse(data);

	const results = _.chain(json)
		.map((bang) => {
			const keysUpdated: Record<string, { old: string; new: string }> = {};
			const messageLog: string[] = [];
			let url = bang.u;

			const urlOrig = String(url);

			if (url[0] === '/') {
				// User can switch between DuckDuckGo, Kagi, Google, etc.
				url = bangProviderPlaceHolder + url;
			}
			url = url.replaceAll(queryPlaceholder, temporarySafePlaceholder);

			// Preserve upper case in domain:
			const hostnameRE = new RegExp(new URL(url).hostname, 'i');
			const hostnameOrig = (
				urlOrig
					.replace('/', bangProviderPlaceHolder)
					.replace(queryPlaceholder, temporarySafePlaceholder)
					.match(hostnameRE) as RegExpMatchArray
			)[0]
				.replace(bangProviderPlaceHolder, '/')
				.replace(temporarySafePlaceholder, queryPlaceholder);

			if (options.stripGoogle) {
				const urlObject = new URL(url);
				// Note: URL() normalizes the domain to lower case.

				// Strip extra Google custom search engine params.
				if (urlObject.searchParams.get('cof')?.toLowerCase().includes('forid')) {
					[...urlObject.searchParams.entries()]
						.filter(([, value]) => !value.includes(temporarySafePlaceholder))
						.forEach(([key, value]) => {
							messageLog.push(`removed: ${key}=${value}`);
							urlObject.searchParams.delete(key, value);
						});
				}

				url = urlObject.href;
			}

			if (options.tidyUrl) {
				// TidyURL error on this domain:
				if (!url.includes('youtube.com')) {
					/// console.warn(url);
					url = TidyURL.clean(url).url;
				}
			}

			url = url
				.replaceAll(temporarySafePlaceholder, queryPlaceholder)
				.replaceAll(bangProviderPlaceHolder, '');

			if (options.unescapeUrl) {
				let oldUrl = '';
				let newUrl = url;

				while (oldUrl !== newUrl) {
					[oldUrl, newUrl] = [newUrl, unescape(newUrl)];
					if (oldUrl != newUrl) {
						messageLog.push(`unescape: ${oldUrl}`);
					}
				}

				if (url != newUrl) {
					url = newUrl;
				}
			}

			// Restore domain before lower case normalization.
			url = url.replace(hostnameRE, hostnameOrig);

			bang.u = url;

			if (options.trim) {
				_.forOwn(bang, (value, key) => {
					if (typeof value === 'string') {
						const trimmed = value.trim();
						if (value != trimmed) {
							bang[key] = trimmed;

							if (key != 'u') {
								keysUpdated[key] = {
									old: value,
									new: trimmed
								};
							}
						}
					}
				});
			}

			// Log URLs if url changed:
			if (bang.u != urlOrig) {
				keysUpdated.u = {
					old: urlOrig,
					new: bang.u
				};
			}

			// Log what was updated to STDERR.
			if (Object.keys(keysUpdated).length) {
				console.warn(`\ntrigger: !${bang.t}`);
				if (messageLog.length) {
					_.forEach(messageLog, (s) => console.warn(s));
				}
				_.forEach(keysUpdated, (value, key) => console.warn(`update ${key}:`, value));
				///console.warn(`domain:`, hostnameOrig);
			}

			return bang;
		})
		.value();

	console.log(JSON.stringify(results, null, 2));
} catch (err) {
	console.error(err);
}
