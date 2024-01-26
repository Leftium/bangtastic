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

	let bangsJson = bangs;

	if (!includeProtocol) {
		bangsJson = bangs.map((bang) => ({
			...bang,
			u: bang.u.replace(/^https?:\/\//, '')
		}));
	}

	if (splitTriggers) {
		bangsJson = bangs.map((bang) => ({
			...bang,
			t: bang.t.split(' ')
		}));
	}

	const bangsList = bangsJson.map(({ t, u, s }) => [s, t, u]);
	const bangsListUnzipped = _.unzip(bangsList);

	if (format === 'text') {
		return text(bangsJson.map(({ t, u, s }) => `${s}\n${t}\n${u}\n`).join('\n'));
	}
	if (format === 'text-unzipped') {
		return text(bangsListUnzipped.map((items) => items.join('\n')).join('\n\n'));
	}

	if (format === 'oml') {
		return text(Oml.stringify(bangsJson, {}));
	}

	if (format === 'oml-list') {
		return text(Oml.stringify(bangsList, { reduceSimpleArray: splitTriggers }));
	}

	if (format === 'oml-list-unzipped') {
		return text(Oml.stringify(bangsListUnzipped, { reduceSimpleArray: false }));
	}

	if (format === 'json-list') {
		return text(JSON.stringify(bangsList, null, '\t'));
	}

	if (format === 'json-list-unzipped') {
		return text(JSON.stringify(bangsListUnzipped, null, '\t'));
	}

	return text(JSON.stringify(bangsJson, null, '\t'));
};
