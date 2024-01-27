<script>
	import '$lib/css/global.css';

	import { DataHandler, Datatable, Th, ThFilter } from '@vincjo/datatables';

	export let data;

	const handler = new DataHandler(data.dataset, { rowsPerPage: 50 });
	const rows = handler.getRows();
</script>

<article class="table scroll-y" style="max-width:auto">
	<Datatable {handler}>
		<table>
			<thead>
				<tr>
					<Th {handler} orderBy="first_name">First Name</Th>
					<Th {handler} orderBy="last_name">Last Name</Th>
					<Th {handler} orderBy="email">Email</Th>
				</tr>
				<tr>
					<ThFilter {handler} filterBy="first_name" />
					<ThFilter {handler} filterBy="last_name" />
					<ThFilter {handler} filterBy="email" />
				</tr>
			</thead>
			<tbody>
				{#each $rows as row}
					<tr>
						<td>{row.first_name}</td>
						<td>{row.last_name}</td>
						<td>{row.email}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</Datatable>
</article>

<style>
	article {
		max-width: 100%;
		height: calc(100vh - 16px);

		margin: 8px;

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
</style>
