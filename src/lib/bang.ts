import _ from 'lodash';

import bangData from '$lib/bang-data/bang.json';

import normalizeUrl from 'normalize-url';

const uniqueUrls: Record<string, any> = {};
const uniqueUrlsNormalized: Record<string, any> = {};

function normalize(url: string) {
	if (url[0] === '/') {
		url = 'duckduckgo.com' + url;
	}
	url = url.toLocaleLowerCase().replace('{{{s}}}', 'QUERY');
	return normalizeUrl(url, {
		stripProtocol: true
	});
}

const augmentedBangs = _.chain(bangData)
	.map((bang) => {
		const normalizedUrl = normalize(bang.u);
		(uniqueUrlsNormalized[normalizedUrl] = uniqueUrlsNormalized[normalizedUrl] || []).push(bang.t);

		(uniqueUrls[bang.u] = uniqueUrls[bang.u] || []).push(bang.t);

		return bang;
	})
	.map((bang) => {
		const normalizedUrl = normalize(bang.u);
		return {
			uLength: bang.u.length,
			tLength: bang.t.length,
			uCountNormalized: uniqueUrlsNormalized[normalizedUrl].length,
			uCount: uniqueUrls[bang.u].length,
			uNormalized: normalizedUrl,
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
		.replace('{{{s}}}', '{s}');

	const uNormalized = normalize(u);

	const uLength = u.length;

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
		u: uNormalized,
		uLength,
		s,
		r,
		c,
		sc
	};
	return bangs;
});

export const bangs = _.chain(bangsNormalized)
	.map((bangs) => bangs[0])
	.orderBy(['r', 'uLength'], ['desc', 'desc'])
	.map(({ t, u, s, uLength, r }) => ({ s, r, t, u, uLength }))
	.value();
