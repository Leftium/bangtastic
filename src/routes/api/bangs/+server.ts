import { bangs } from '$lib/bang';
import { text, json } from '@sveltejs/kit';

export const GET = async ({ url }) => {
	const format = url.searchParams.get('format') || url.searchParams.get('f');
	const includeProtocol = ['1', 'true'].includes(
		url.searchParams.get('protocol') || url.searchParams.get('p') || 'true'
	);

	let bangsOutput = bangs;

	if (!includeProtocol) {
		bangsOutput = bangs.map((bang) => ({
			...bang,
			u: bang.u.replace(/^https?:\/\//, '')
		}));
	}

	if (format === 'text') {
		return text(bangsOutput.map(({ t, u, s }) => `${t}\n${u}\n${s}\n`).join('\n'));
	}

	return json(bangsOutput);
};
