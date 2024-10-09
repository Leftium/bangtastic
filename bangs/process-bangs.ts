import _ from 'lodash';

import bangData from '$bangdata/duckduckgo/bang.json';

import normalizeUrl from 'normalize-url';
import { TidyURL } from 'tidy-url';

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

	// Strip extra Google custom search engine params.
	if (urlObject.searchParams.get('cof')?.toLowerCase().includes('forid')) {
		[...urlObject.searchParams.entries()]
			.filter(([, value]) => !value.includes(temporarySafePlaceholder))
			.forEach(([key, value]) => {
				urlObject.searchParams.delete(key, value);
			});
		// urlObject.searchParams.set('jkm', 'jkm');
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

const bangs = _.chain(bangData)
	//.filter(({ r }) => r > 0)
	.orderBy(['r'], ['desc'])
	.map((bang) => ({
		...bang,
		n: normalize(bang.u.replaceAll('{{{s}}}', queryPlaceholder), {
			keepProtocol: false,
			keepCase: false
		})
	}))
	.groupBy('n')
	.map((sources, n) => {
		const r = _.max(_.map(sources, 'r'));

		// Get summary, prefer higher r.
		const s = _.chain(sources)
			.orderBy([({ r }) => r > 0, ({ s }) => s.length], ['desc', 'desc'])
			.head()
			.get('s')
			.value();

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
		const t = _.uniq(_.concat(tShort, tlong, _.map(sources, 't')))
			.join(' ')
			.replace(/^|\s+/g, ' !');

		// Get highest ranked category; length breaks ties.
		const c = _.chain(sources)
			.orderBy(['r', ({ c }) => c?.length], ['desc', 'desc'])
			.find('c')
			.get('c')
			.value();

		// Get highest ranked sub-category; length breaks ties.
		const sc = _.chain(sources)
			.orderBy(['r', ({ sc }) => sc?.length], ['desc', 'desc'])
			.find('sc')
			.get('sc')
			.value();

		// Get shortest url, preferring https.
		const u = _.chain(sources)
			.map('u')
			.sortBy([(u) => !u.startsWith('https'), 'length'])
			.head()
			.value()
			.replaceAll('{{{s}}}', queryPlaceholder);

		const d =
			siteDomain('http://' + n) || _.chain(sources).map('d').sortBy(['length']).head().value();
		return { n, u, r, d, sources, s, t, c, sc };
	})
	//.filter(({ r }) => r > 10_000)
	.orderBy([({ sources }) => sources.length], ['desc'])
	.value();

console.log(JSON.stringify(bangs, null, '\t'));
