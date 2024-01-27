<script lang="ts">
	import '@picocss/pico';

	import _ from 'lodash';

	export let data;

	const isTableOpen: Record<string, boolean> = {
		[data.bangs[0].uKey]: true
	};

	const columns = {
		s: 'summary',
		t: 'triggers',
		d: 'domain',
		r: 'rank',
		u: 'url',
		uKey: 'normalized url key',
		c: 'category',
		sc: 'sub-category'
	};

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

	function makeOnClick(key: string) {
		return function () {
			isTableOpen[key] = !isTableOpen[key];
		};
	}
</script>

<main class="container-fluid">
	<input autocapitalize="none" type="search" {onkeydown} />

	<table>
		<thead>
			<tr class="header-row">
				{#each Object.entries(columns) as [columnName, note]}
					<td>{columnName} ({note})</td>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each data.bangs as bang, index (bang.uKey)}
				<tr class="main-row" onclick={makeOnClick(bang.uKey)}>
					{#each Object.keys(columns) as columnName}
						{@const columnData = bang[columnName]}
						{@const title = columnData?.length > 30 ? columnData : null}
						<td {title}>
							{#if columnName === 'uKey'}
								{index} | {bang.uKey}
							{:else}
								{columnData}
							{/if}
						</td>
					{/each}
				</tr>
				{#each bang.sources as source, sourceIndex (source.t)}
					<tr hidden={!isTableOpen[source.uKey]} onclick={makeOnClick(bang.uKey)}>
						{#each Object.keys(columns) as columnName}
							{@const sourceColumnData = source[columnName]}
							{@const title = sourceColumnData?.length > 30 ? sourceColumnData : null}
							{@const alreadySeen =
								sourceIndex !== _.findIndex(bang.sources, [columnName, sourceColumnData])}
							<td {title} style:opacity={alreadySeen || columnName === 'uKey' ? 0.3 : 1}>
								{#if columnName === 'uKey'}
									{sourceIndex}
								{:else}
									{sourceColumnData}
								{/if}
							</td>
						{/each}
					</tr>
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
</style>
