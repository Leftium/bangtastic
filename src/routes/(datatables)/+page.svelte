<script lang="ts">
	import '$lib/css/global.css';

	import { DataHandler, Th, ThFilter, type Field } from '@vincjo/datatables';
	import Datatable from '$lib/components/Datatable.svelte';
	import { gg } from '$lib/util.js';

	export let data;

	const handler = new DataHandler(data.dataset, { rowsPerPage: 100 });
	const rows = handler.getRows();

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
</script>

<article class="table scroll-y" style="max-width:auto">
	<Datatable {handler} rowCount={true} pagination={true} search={true} rowsPerPage={false}>
		<table>
			<thead>
				<tr>
					{#each columnsEntries(columns) as [columnName, note]}
						<Th {handler} orderBy={columnName}>{columnName}<span class="note">{note}</span></Th>
					{/each}
				</tr>
				<tr>
					{#each columnsEntries(columns) as [columnName]}
						<ThFilter {handler} filterBy={columnName} />
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each $rows as bang, index (bang.n)}
					<tr>
						{#each columnsEntries(columns) as [columnName]}
							{@const columnData = bang[columnName]}
							{@const title = columnData?.length > 30 ? columnData : null}
							<td {title}>{columnData}</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</Datatable>
</article>

<style>
	article {
		max-width: 100%;
		height: calc(100vh - 4px);

		margin: 2px;

		border: 1px solid #e0e0e0;
		border-radius: 8px;
	}

	thead {
		background: #fff;
	}
	tbody td {
		border: 1px solid #f5f5f5;
		padding: 4px 20px;
	}
	tbody tr {
		transition: all, 0.2s;
	}
	tbody tr:hover {
		background: #f5f5f5;
	}

	span.note {
		opacity: 0.5;
	}
</style>
