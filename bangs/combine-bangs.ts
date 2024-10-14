import _ from 'lodash';
import { unescape } from 'node:querystring';

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

// Extracts domain from site: in search params.
function siteDomain(u: string) {
	const url = new URL(u);

	if (url.hostname == siteProviderPlaceHolder) {
		const matchSites = url.search.match(/site:([^+&\]]*)/) || url.search.match(/inurl:([^+&\]]*)/);

		if (matchSites) {
			return matchSites[1]
				.split(',')
				.map((siteOperator) => stripProtocol(siteOperator).replace(/\/.*/, '').replace('www.', ''))
				.join(' ');
		}
	}
	if (url.hostname == bangProviderPlaceHolder) {
		return 'duckduckgo.com';
	}
	return url.hostname.replace('www.', '');
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
		r: triggerToDuckBang?.[bang.t]?.r ?? -1
	}))
	.filter(({ r }) => r > 1)
	.orderBy(['r'], ['desc'])
	.groupBy('n')
	.map((sources, n) => {
		const maxRank = _.max(_.map(sources, 'r'));

		function getRanks(prop: 'label' | keyof (typeof sources)[0]) {
			return _.chain(sources)
				.reduce((result, bang) => {
					const mapKey = prop !== 'label' ? bang[prop] : [bang['c'], bang['sc']];

					if (!_.isEqual(mapKey, [undefined, undefined])) {
						if (!result.has(mapKey)) {
							result.set(mapKey, []);
						}
						result.get(mapKey).push(bang.r);
					}
					return result;
				}, new Map())
				.value();
		}

		const summaryRanks = getRanks('s');
		const urlRanks = getRanks('u');
		const triggerRanks = getRanks('t');
		const labelRanks = getRanks('label');

		// Get shortest url, preferring https.
		const u = _.chain(sources)
			.map('u')
			.sortBy([(u) => !u.startsWith('https'), 'length'])
			.head()
			.value()
			.replaceAll('{{{s}}}', queryPlaceholder);

		const d =
			siteDomain('http://' + n) || _.chain(sources).map('d').sortBy(['length']).head().value();
		return {
			n,
			u,
			r: maxRank,
			d,
			summaryRanks: Object.fromEntries(summaryRanks),
			urlRanks: Object.fromEntries(urlRanks),
			triggerRanks: Object.fromEntries(triggerRanks),
			labelRanks: Object.fromEntries(labelRanks),
			sources
		};
	});

console.log(JSON.stringify(bangs, null, '\t'));
