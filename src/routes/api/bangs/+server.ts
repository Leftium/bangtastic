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

	const format = url.searchParams.get('format') || url.searchParams.get('f') || 'json';
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

	const bangsList = bangsJson.map((bang) => Object.values(bang));
	const bangsListUnzipped = _.unzip(bangsList);

	const contentType = format.startsWith('json') ? 'application/json' : 'text/plain';
	const filename = format.startsWith('json') ? `${format}.json` : `${format}.txt`;

	const options = {
		headers: {
			'content-type': contentType,
			'Content-Disposition': `inline; filename="${filename}"`
		}
	};

	if (format === 'text') {
		return text(bangsList.map((bang) => bang.join('\n')).join('\n\n'), options);
	}
	if (format === 'text-unzipped') {
		return text(bangsListUnzipped.map((items) => items.join('\n')).join('\n\n'), options);
	}

	if (format === 'oml') {
		return text(Oml.stringify(bangsJson, indent ? {} : null), options);
	}

	if (format === 'oml-list') {
		return text(
			Oml.stringify(bangsList, indent ? { reduceSimpleArray: splitTriggers } : null),
			options
		);
	}

	if (format === 'oml-list-unzipped') {
		return text(
			Oml.stringify(bangsListUnzipped, indent ? { reduceSimpleArray: false } : null),
			options
		);
	}

	if (format === 'json-list') {
		return text(
			indent ? JSON.stringify(bangsList, null, '\t') : JSON.stringify(bangsList),
			options
		);
	}

	if (format === 'json-list-unzipped') {
		return text(
			indent ? JSON.stringify(bangsListUnzipped, null, '\t') : JSON.stringify(bangsListUnzipped),
			options
		);
	}

	return text(indent ? JSON.stringify(bangsJson, null, '\t') : JSON.stringify(bangsJson), options);
};
