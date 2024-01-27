import _ from 'lodash';

import bangData from '$lib/bang-data/bang.json';

import normalizeUrl from 'normalize-url';
import { TidyURL } from 'tidy-url';

const queryPlaceholder = '{}';
const temporarySafePlaceholder = 'safe_temporary_placeholder';

const uniqueUrls: Record<string, any> = {};
const uniqueUrlsNormalized: Record<string, any> = {};

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
		url = 'internal' + url;
	}

	url = url.replaceAll(queryPlaceholder, temporarySafePlaceholder);
	const urlObject = new URL(normalizeUrl(url));
	if (/[^-](site:[^+])|(inurl:http)/.test(urlObject.search)) {
		urlObject.hostname = 'site';
	}

	// Strip extra Google custom search engine params.
	if (urlObject.searchParams.get('cof')?.toLowerCase().includes('forid')) {
		[...urlObject.searchParams.entries()]
			.filter(([key, value]) => !value.includes(temporarySafePlaceholder))
			.forEach(([key, value]) => {
				urlObject.searchParams.delete(key, value);
			});
		// urlObject.searchParams.set('jkm', 'jkm');
	}

	let href = urlObject.href;
	href = href.replaceAll(temporarySafePlaceholder, queryPlaceholder);
	href = href.replaceAll(encodeURIComponent(queryPlaceholder), queryPlaceholder);
	href = href.replaceAll('/?', '?');

	href = TidyURL.clean(href).url;

	if (!keepProtocol) {
		href = stripProtocol(href);
	}

	if (keepCase) {
		href = href.toLocaleLowerCase();
	}

	return href;
}

const augmentedBangs = _.chain(bangData)
	.map((bang) => {
		const urlKey = normalize(bang.u, {
			keepProtocol: false,
			keepCase: false
		});
		(uniqueUrlsNormalized[urlKey] = uniqueUrlsNormalized[urlKey] || []).push(bang.t);
		(uniqueUrls[bang.u] = uniqueUrls[bang.u] || []).push(bang.t);
		return bang;
	})
	.map((bang) => {
		const urlKey = normalize(bang.u, {
			keepProtocol: false,
			keepCase: false
		});
		return {
			uLength: bang.u.length,
			tLength: bang.t.length,
			uCountNormalized: uniqueUrlsNormalized[urlKey].length,
			uCount: uniqueUrls[bang.u].length,
			uNormalized: urlKey,
			...bang
		};
	})
	.orderBy(['uCountNormalized', 'r', 'tLength'], ['desc', 'desc', 'desc'])
	.value();

// https://stackoverflow.com/a/74581333/117030
const bangsNormalized = Object.values(
	augmentedBangs.reduce(
		(x, y) => {
			(x[y.uNormalized] = x[y.uNormalized] || [
				{ tMin: y.tLength, tMax: y.tLength, uLength: 0, t: '', u: '', s: '' }
			]).push(y);

			const merged = x[y.uNormalized][0];
			if (merged) {
				merged.tMax = Math.max(merged.tMax, y.tLength);
				merged.tMin = Math.min(merged.tMin, y.tLength);
			}

			return x;
		},
		{} as Record<string, any>
	)
).map((bangs) => {
	// triggers: shortest, longest, highest score, rest
	const shortest = _.find(bangs, ['tLength', bangs[0].tMin]).t;
	const longest = _.find(bangs, ['tLength', bangs[0].tMax]).t;

	const t = _.uniq(_.concat(shortest, longest, _.map(bangs, 't')))
		.join(' ')
		.trim()
		.replace(/\s+/g, ' ');

	bangs[0].t = t;

	const u = _.chain(bangs)
		.map('u')
		.sortBy([(u) => u.length, (u) => /^https/.test(u)])
		.value()[1]
		.replaceAll('{{{s}}}', queryPlaceholder);

	const uNormalized = normalize(u);
	const uLength = uNormalized.length;

	const url = new URL(uNormalized);

	// Extracts domain from site: in search params.
	function siteDomain(u: string) {
		const url = new URL(u);

		if (url.hostname == 'site') {
			const matchSites =
				url.search.match(/site:([^+&\]]*)/) || url.search.match(/inurl:([^+&\]]*)/);

			if (matchSites) {
				return matchSites[1]
					.split(',')
					.map((site) => stripProtocol(site).replace(/\/.*/, '').replace('www.', ''))
					.join(' ');
			}
		}
		return null;
	}

	const domains = siteDomain(uNormalized) || stripProtocol(url.hostname).replace('www.', '');

	const s = _.chain(bangs)
		.map('s')
		.sortBy([(u) => -u.length])
		.value()[0];

	const { r, c, sc } = _.chain(bangs)
		.map(({ r, c, sc }) => ({ r, c, sc }))
		.orderBy(['r'], ['desc'])
		.value()[1];

	bangs[0] = {
		...bangs[0],
		t,
		u,
		domains,
		uNormalized,
		uLength,
		s,
		r,
		c,
		sc
	};
	return bangs;
});

function compactDomain(u: string) {
	return u.replace(/^(internal)|(site)\?/, '');
}

export const bangs = _.chain(bangsNormalized)
	.map((bangs) => bangs[0])
	.orderBy(['uLength'], ['desc', 'desc'])
	//.filter((bang) => bang.domains == 'internal')
	.map(({ t, domains, u, uNormalized, s, uLength, r }) => ({
		s,
		r,
		t,
		domains,
		u: stripProtocol(u),
		uNormalized: compactDomain(stripProtocol(uNormalized)),
		uLength
	}))
	.value();
