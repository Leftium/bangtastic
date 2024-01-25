<script lang="ts">
	import '@picocss/pico';

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

	const bangs = _.chain(bangData)
		.map((bang) => {
			const normalizedUrl = normalize(bang.u);
			(uniqueUrlsNormalized[normalizedUrl] = uniqueUrlsNormalized[normalizedUrl] || []).push(
				bang.t
			);

			(uniqueUrls[bang.u] = uniqueUrls[bang.u] || []).push(bang.t);

			return bang;
		})
		.map((bang) => {
			const normalizedUrl = normalize(bang.u);
			return {
				tLength: bang.t.length,
				uCountNormalized: uniqueUrlsNormalized[normalizedUrl].length,
				uCount: uniqueUrls[bang.u].length,
				uNormalized: normalizedUrl,
				...bang
			};
		})
		.filter((bang) => bang.uCountNormalized > 1)
		.orderBy(['uCountNormalized', 'r', 'tLength'], ['desc', 'desc', 'desc'])
		.value();

	// https://stackoverflow.com/a/74581333/117030
	const bangsNormalized = Object.values(
		bangs.reduce(
			(x, y) => {
				(x[y.uNormalized] = x[y.uNormalized] || [{ t: '', tMin: y.tLength, tMax: y.tLength }]).push(
					y
				);

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
		// shortest, longest, highest score, rest
		const shortest = _.find(bangs, ['tLength', bangs[0].tMin]).t;
		const longest = _.find(bangs, ['tLength', bangs[0].tMax]).t;

		const t = _.uniq(_.concat(shortest, longest, _.map(bangs, 't'))).join(' ');

		bangs[0].t = t;
		return bangs;
	});

	function onkeydown(this: HTMLInputElement, event: Event) {
		const e = event as KeyboardEvent;

		// Convert space to `!` if first character or follows another space:
		if (e.key === ' ') {
			if (this.value === '' || this.value.at(-1) === ' ') {
				this.value += '!';
				e.preventDefault();
			}
		}

		// Handle double tap space to ". " on iOS:
		if (e.key === '. ') {
			this.value += ' !';
			e.preventDefault();
		}
	}

	const columns = [
		't',
		'tLength',
		'tMin',
		'tMax',
		'uCount',
		'uCountNormalized',
		'u',
		'uNormalized',
		'r',
		's',
		'c',
		'sc',
		'd'
	];
</script>

<main class="container-fluid">
	<input autocapitalize="none" type="search" {onkeydown} />
	{#each bangsNormalized as bangs}
		<table>
			<thead>
				<tr>
					<td>{'index'}</td>
					{#each columns as columnName}
						<td>{columnName}</td>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each bangs as bang, index (bang.t)}
					<tr>
						<td>{index}</td>
						{#each columns as columnName}
							<td title={bang[columnName]}>{bang[columnName]}</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	{/each}
</main>

<style>
	td {
		max-width: 800px;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
</style>
