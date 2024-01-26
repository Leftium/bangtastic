import { Oml } from '@stenway/oml';

import { bangs } from '$lib/bang';
import { text } from '@sveltejs/kit';
import _ from 'lodash';

export const GET = async ({ url }) => {
	function urlParam(name: string, shortName: string, defaultValue: string) {
		return ['1', 'true'].includes(
			url.searchParams.get(name) || url.searchParams.get(shortName) || defaultValue
		);
	}

	const format = url.searchParams.get('format') || url.searchParams.get('f');
	const includeProtocol = urlParam('protocol', 'p', 'true');
	const splitTriggers = urlParam('split-triggers', 's', 'false');
	const indent = urlParam('indent', 'i', 'false');

	let bangsJson = bangs.map(({ s, t, domains, uNormalized }) => ({
		s,
		t,
		d:
			uNormalized.startsWith(domains) || ['internal', '{}'].includes(domains) ? undefined : domains,
		u: uNormalized
	}));

	if (!includeProtocol) {
		bangsJson = bangsJson.map((bang) => ({
			...bang,
			u: bang.u.replace(/^https?:\/\//, '')
		}));
	}

	if (splitTriggers) {
		bangsJson = bangsJson.map((bang) => ({
			...bang,
			t: bang.t.split(' ')
		}));
	}

	const bangsList = bangsJson.map(({ t, u, s, d }) => [s, t, d, u]);
	const bangsListUnzipped = _.unzip(bangsList);

	if (format === 'text') {
		return text(bangsList.map((bang) => bang.join('\n')).join('\n\n'));
	}
	if (format === 'text-unzipped') {
		return text(bangsListUnzipped.map((items) => items.join('\n')).join('\n\n'));
	}

	if (format === 'oml') {
		return text(Oml.stringify(bangsJson, indent ? {} : null));
	}

	if (format === 'oml-list') {
		return text(Oml.stringify(bangsList, indent ? { reduceSimpleArray: splitTriggers } : null));
	}

	if (format === 'oml-list-unzipped') {
		return text(Oml.stringify(bangsListUnzipped, indent ? { reduceSimpleArray: false } : null));
	}

	if (format === 'json-list') {
		return text(indent ? JSON.stringify(bangsList, null, '\t') : JSON.stringify(bangsList));
	}

	if (format === 'json-list-unzipped') {
		return text(
			indent ? JSON.stringify(bangsListUnzipped, null, '\t') : JSON.stringify(bangsListUnzipped)
		);
	}

	return text(indent ? JSON.stringify(bangsJson, null, '\t') : JSON.stringify(bangsJson));
};
