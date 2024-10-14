import _ from 'lodash';
import { unescape } from 'node:querystring';
import { WsvLine } from '@stenway/wsv';

// Just for the bang rankings.
import duckBangs from '$bangdata/duckduckgo/bang.json';

import kagiBangs from '$bangdata/kagi/bangs.cleaned.json';

import normalizeUrl from 'normalize-url';
import { TidyURL } from 'tidy-url';
TidyURL.config.setMany({
	// Prevent debug logging. This option is reversed.
	silent: false
});

const queryPlaceholder = '{q}';
const bangProviderPlaceHolder = '{b}'; // Example: `duckduckgo.com`
const siteProviderPlaceHolder = '{s}'; // Example: `google.com`

type QuoteChar = `'` | `"`;
const SINGLEQUOTE_CHAR = `'`;
const DOUBLEQUOTE_CHAR = `"`;

function setWsvStringEscapQuoteChar(targetQuoteChar: QuoteChar, wsvLine: string) {
	const otherQuoteChar = targetQuoteChar === SINGLEQUOTE_CHAR ? DOUBLEQUOTE_CHAR : SINGLEQUOTE_CHAR;
	let result = '';
	let inQuotes = false;

	const length = wsvLine.length;
	for (let i = 0; i < length; i++) {
		const char = wsvLine[i];
		const nextCharIsSame = char === wsvLine[i + 1];

		if (!inQuotes && char === otherQuoteChar) {
			inQuotes = true;
			result += targetQuoteChar;
		} else if (inQuotes && char === otherQuoteChar) {
			if (nextCharIsSame) {
				i++;
				result += otherQuoteChar;
			} else {
				inQuotes = false;
				result += targetQuoteChar;
			}
		} else if (inQuotes && char === targetQuoteChar) {
			result += targetQuoteChar + targetQuoteChar;
		} else {
			result += char;
		}
	}

	if (inQuotes) {
		throw `Unclosed string in: ${wsvLine}`;
	}

	return result;
}

// Function to convert WSV to SingleWSV
function wsvSingle(wsvString: string) {
	return setWsvStringEscapQuoteChar(SINGLEQUOTE_CHAR, wsvString);
}

// Function to convert SingleWSV to WSV
function wsvDouble(wsvString: string) {
	return setWsvStringEscapQuoteChar(DOUBLEQUOTE_CHAR, wsvString);
}

function stripProtocol(url: string) {
	return url.replace(/^https?:\/\//, '');
}

function normalize(
	url: string,
	{ keepProtocol, keepCase }: { keepProtocol?: boolean; keepCase?: boolean } = {
		keepProtocol: true,
		keepCase: true
	}
) {
	if (url[0] === '/') {
		// User can switch between DuckDuckGo, Kagi, Google, etc.
		url = bangProviderPlaceHolder + url;
	}

	const temporarySafePlaceholder = 'SAFE_PLACEHOLDER';
	url = url.replaceAll(queryPlaceholder, temporarySafePlaceholder);
	const urlObject = new URL(normalizeUrl(url));
	if (/[^-](site:[^+])|(inurl:http)/.test(urlObject.search)) {
		urlObject.hostname = siteProviderPlaceHolder;
	}

	let href = urlObject.href;
	href = href.replaceAll(temporarySafePlaceholder, queryPlaceholder);
	href = href.replaceAll(encodeURIComponent(queryPlaceholder), queryPlaceholder);
	href = href.replaceAll('/?', '?');

	// TidyURL error on this domain:
	if (!href.includes('https://music.youtube.com')) {
		href = TidyURL.clean(href).url;
	}

	if (!keepProtocol) {
		href = stripProtocol(href);
	}

	if (!keepCase) {
		href = href.toLocaleLowerCase();
	}

	href = unescape(href);

	return href;
}

// TODO: Refactor.
// Extracts domain from site: in search params.
function siteDomain(url: string) {
	if (url[0] === '/') {
		// User can switch between DuckDuckGo, Kagi, Google, etc.
		url = 'http://EXAMPLE.com' + url;
	}

	const temporarySafePlaceholder = 'SAFE_PLACEHOLDER';
	url = url.replaceAll(queryPlaceholder, temporarySafePlaceholder);
	const urlObject = new URL(url);

	// 1. Create a case-insensitive regular expression based on URL.hostname.
	const hostnameRE = new RegExp(urlObject.hostname, 'i');

	// 2. Get the original mixed-cased domain using hostnameRE.
	const hostnameOriginalCase = url.match(hostnameRE)?.[0] || '';

	if (urlObject.hostname == siteProviderPlaceHolder) {
		const matchSites =
			urlObject.search.match(/site:([^+&\]]*)/) || urlObject.search.match(/inurl:([^+&\]]*)/);

		if (matchSites) {
			return matchSites[1]
				.split(',')
				.map((siteOperator) => stripProtocol(siteOperator).replace(/\/.*/, '').replace('www.', ''))
				.join(' ');
		}
	}

	// 3. Replace the lowercase domain with the mixed case domain, gain using hostnameRE.
	return urlObject.hostname
		.replace(hostnameRE, hostnameOriginalCase)
		.replace('www.', '')
		.replace('EXAMPLE.com', '/');
}

// Make map of triggers to rankings
const triggerToDuckBang = _.chain(duckBangs)
	.reduce(
		(result, bang) => {
			result[bang.t] = bang;
			return result;
		},
		{} as Record<string, (typeof duckBangs)[0]>
	)
	.value();

///console.log(JSON.stringify(triggerToDuckBang, null, '\t'));

const bangs = _.chain(kagiBangs)
	.map((bang) => ({
		...bang,
		n: normalize(bang.u.replaceAll('{{{s}}}', queryPlaceholder), {
			keepProtocol: false,
			keepCase: false
		}),
		r: triggerToDuckBang?.[bang.t]?.r ?? 0
	}))
	///.filter(({ r }) => r < 1)
	.orderBy(['r'], ['desc'])
	.groupBy('n')
	//.filter((sources) => sources.length > 4)
	//.filter((sources) => ['aph'].includes(sources[0].t))
	.map((sources) => {
		const maxRank = _.max(_.map(sources, 'r'));

		function getRanks(prop: 'label' | keyof (typeof sources)[0]) {
			const result = _.chain(sources)
				.reduce((result, bang) => {
					const mapKey =
						prop !== 'label'
							? (bang[prop] as string)
							: wsvSingle(WsvLine.serialize([bang['c'] || null, bang['sc'] || null]));
					const mapKeyLowerCase = mapKey.toLocaleLowerCase();

					if (!_.isEqual(mapKey, '- -')) {
						if (!result.has(mapKeyLowerCase)) {
							result.set(mapKeyLowerCase, []);
						}
						result.get(mapKeyLowerCase).push([bang.r, mapKey]);
					}
					return result;
				}, new Map())
				.value();
			return result;
		}

		// Get summary, prefer from rated bangs, longer titles.
		const s = _.chain(sources)
			.orderBy([({ r }) => r > 0, ({ s }) => s.length], ['desc', 'desc'])
			.head()
			.get('s')
			.value();

		const summaryRanks = getRanks('s');
		// const urlRanks = getRanks('u');
		// const triggerRanks = getRanks('t');
		const labelRanks = getRanks('label');

		// const summaries = [...summaryRanks.keys()];
		const summaries = [...summaryRanks.values()].map((value) => {
			return value[0]?.[1];
		});

		_.each(summaries, (summary) => {
			if (summary !== s) {
				const key = wsvSingle(WsvLine.serialize(['Alt-Summary', summary]));
				const keyLowerCase = key.toLocaleLowerCase();
				labelRanks.set(keyLowerCase, [[-1, key]]);
			}
		});

		const labels = [...labelRanks.values()].map((value) => {
			return value[0]?.[1];
		});

		// Get shortest url, preferring https.
		const u = _.chain(sources)
			.map('u')
			.sortBy([(u) => !u.startsWith('https'), 'length'])
			.head()
			.value()
			.replaceAll('{{{s}}}', queryPlaceholder);

		// Get shortest trigger; higher r breaks ties.
		const tShort = _.chain(sources)
			.orderBy([({ t }) => t.length, 'r'], ['asc', 'desc'])
			.head()
			.get('t')
			.value();

		// Get longest trigger; higher r breaks ties.
		const tlong = _.chain(sources)
			.orderBy([({ t }) => t.length, 'r'], ['desc', 'desc'])
			.head()
			.get('t')
			.value();

		// Make list of triggers with shortest and longest first.
		const t = _.uniq(_.concat(tShort, tlong, _.map(sources, 't'))).map((trigger) => `!${trigger}`);

		const d =
			siteDomain(sources[0].u) || _.chain(sources).map('d').sortBy(['length']).head().value();

		return {
			// n: sources[0].n,
			s,
			t,
			u: [u],
			d,
			labels,

			r: maxRank,
			summaries,
			summaryRanks: Object.fromEntries(summaryRanks),
			// urlRanks: Object.fromEntries(urlRanks),
			// triggerRanks: Object.fromEntries(triggerRanks),
			labelRanks: Object.fromEntries(labelRanks),
			sources
		};
	})
	//.filter((item) => Object.keys(item.labelRanks).length > 3);
	.value();

console.log(JSON.stringify(bangs, null, '\t'));
