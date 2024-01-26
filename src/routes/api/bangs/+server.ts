import { Oml } from '@stenway/oml';

import { bangs } from '$lib/bang';
import { text, json } from '@sveltejs/kit';

export const GET = async ({ url }) => {
	function urlParam(name: string, shortName: string, defaultValue: string) {
		return ['1', 'true'].includes(
			url.searchParams.get('protocol') || url.searchParams.get('p') || defaultValue
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

	const bangsList = bangsJson.map(({ t, u, s }) => [t, u, s]);

	if (format === 'text') {
		return text(bangsJson.map(({ t, u, s }) => `${t}\n${u}\n${s}\n`).join('\n'));
	}

	if (format === 'oml') {
		return text(Oml.stringify(bangsJson, {}));
	}

	if (format === 'oml-list') {
		return text(Oml.stringify(bangsList, { reduceSimpleArray: true }));
	}

	if (format === 'json-list') {
		return json(bangsList);
	}

	return json(bangsJson);
};
