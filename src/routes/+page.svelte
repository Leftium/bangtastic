<script lang="ts">
	import '@picocss/pico';
	import _ from 'lodash';

	export let data;

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
		's',
		't',
		'u',
		'uKey',
		'd',
		'r'
		//'c',
		//'sc',

		/*
		'uLength',
		'tLength',
		'tMin',
		'tMax',
		'uCount'
        */
	];
</script>

<main class="container-fluid">
	<input autocapitalize="none" type="search" {onkeydown} />

	<table>
		<thead>
			<tr class="header-row">
				<td>{'index'}</td>
				{#each columns as columnName}
					<td>{columnName}</td>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each data.bangs as bang, index (bang.uKey)}
				<tr class="main-row">
					<td>{index}</td>
					{#each columns as columnName}
						{@const columnData = bang[columnName]}
						{@const title = columnData?.length > 30 ? columnData : null}
						<td {title}>{columnData}</td>
					{/each}
				</tr>
				{#each bang.sources as source, sourceIndex (source.t)}
					<tr>
						<td style:opacity=".5">{sourceIndex}</td>
						{#each columns as columnName}
							{@const sourceColumnData = source[columnName]}
							{@const title = sourceColumnData?.length > 30 ? sourceColumnData : null}
							{@const alreadySeen =
								sourceIndex !== _.findIndex(bang.sources, [columnName, sourceColumnData])}

							<td {title} style:opacity={alreadySeen ? 0.3 : 1}>{sourceColumnData}</td>
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
