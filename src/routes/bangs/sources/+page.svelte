<script lang="ts">
	import _ from 'lodash';

	import { gg } from '$lib/util';

	export let data;

	const filteredBangs = _.filter(data.bangs, ({ sources, r }) => r > 0 && sources.length > 2);
	gg(filteredBangs.length);

	const isTableOpen: Record<string, boolean> = {
		[data.bangs[0].n]: true
	};

	const columns = {
		s: 'ummary',
		t: 'riggers',
		d: 'omain',
		r: 'ank',
		u: 'rl',
		n: 'ormalized url',
		c: 'ategory',
		sc: ' sub-category'
	};

	function columnsEntries(columns: Record<string, string>) {
		gg();
		return Object.entries(columns) as [name: Field<(typeof $rows)[0]>, note: string][];
	}

	function makeOnClick(key: string) {
		return function () {
			isTableOpen[key] = !isTableOpen[key];
		};
	}
</script>

<main class="pico container-fluid">
	<table>
		<thead>
			<tr class="header-row">
				{#each columnsEntries(columns) as [columnName, note]}
					<td>{columnName}<span class="note">{note}</span></td>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each filteredBangs as bang, index (bang.n)}
				<tr class="main-row" onclick={makeOnClick(bang.n)}>
					{#each Object.keys(columns) as columnName}
						{@const columnData = bang[columnName]}
						{@const title = columnData?.length > 30 ? columnData : null}
						<td {title}>{columnData}</td>
					{/each}
				</tr>
				{#each bang.sources as source, sourceIndex (source.t)}
					{@const hidden = !isTableOpen[source.n]}
					{#if !hidden}
						<tr {hidden} onclick={makeOnClick(bang.n)}>
							{#each Object.keys(columns) as columnName}
								{@const sourceColumnData = source[columnName]}
								{@const title = sourceColumnData?.length > 30 ? sourceColumnData : null}
								{@const alreadySeen =
									sourceIndex !== _.findIndex(bang.sources, [columnName, sourceColumnData])}
								<td {title} style:opacity={alreadySeen || columnName === 'n' ? 0.3 : 1}>
									{#if columnName === 'n'}
										{sourceIndex}
									{:else}
										{sourceColumnData}
									{/if}
								</td>
							{/each}
						</tr>
					{/if}
				{/each}
			{/each}
		</tbody>
	</table>
</main>

<style>
	td {
		max-width: 400px;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.header-row td {
		background-color: gray;
	}

	.main-row td {
		background-color: lightgray;
	}

	span.note {
		opacity: 0.5;
	}
</style>
