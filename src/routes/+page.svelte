<script lang="ts">
	import '@picocss/pico';

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
		'r',
		't',
		's',
		'domains',
		//'uLength',
		'uNormalized'
		// 'u'
		/*
		'c',
		'sc',
		'd',
		'tLength',
		'tMin',
		'tMax',
		'uCount',
		'uCountNormalized',
        */
	];
</script>

<main class="container-fluid">
	<input autocapitalize="none" type="search" {onkeydown} />

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
			{#each data.bangs as bang, index (bang.t)}
				<tr>
					<td>{index}</td>
					{#each columns as columnName}
						<td title={bang[columnName]}>{bang[columnName]}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>

	{#if false}
		{#each data.bangs as bangs}
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
	{/if}
</main>

<style>
	td {
		max-width: 400px;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
</style>
