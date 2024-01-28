<script lang="ts">
	import {
		type DataHandler,
		type Row,
		Search,
		RowsPerPage,
		RowCount,
		Pagination
	} from '@vincjo/datatables';

	type T = $$Generic<Row>;

	export let handler: DataHandler<T>;

	export let search = true;
	export let rowsPerPage = true;
	export let rowCount = true;
	export let pagination = true;

	let element: HTMLElement;
	let clientWidth = 1000;

	handler.on('change', () => {
		if (element) element.scrollTop = 0;
	});
</script>

<section bind:clientWidth class={$$props.class ?? ''}>
	<div>
		<header class:container={search || rowsPerPage}>
			<div>
				{#if rowCount}
					<RowCount {handler} small={clientWidth < 600} />
				{/if}
				{#if pagination}
					<Pagination {handler} small={clientWidth < 600} />
				{/if}
			</div>
			<div>
				{#if search}
					<Search {handler} />
				{/if}
				{#if rowsPerPage}
					<RowsPerPage {handler} small={clientWidth < 600} />
				{/if}
			</div>
		</header>
		<article bind:this={element}>
			<slot />
		</article>
	</div>
</section>

<style>
	section,
	section div {
		height: 100%;
	}

	section div {
		display: flex;
		flex-direction: column;
	}

	section :global(table) {
		border-collapse: separate;
		border-spacing: 0;
		width: 100%;
	}

	section :global(thead) {
		position: sticky;
		inset-block-start: 0;
		z-index: 1;
	}

	header div,
	footer {
		min-height: 8px;
		padding: 0 16px;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}
	header.container div,
	footer.container {
		height: auto;
	}
	footer {
		border-top: 1px solid #e0e0e0;
	}

	article {
		position: relative;
		overflow: auto;
		scrollbar-width: thin;
	}

	article::-webkit-scrollbar {
		width: 6px;
		height: 6px;
	}
	article::-webkit-scrollbar-track {
		background: #f5f5f5;
	}
	article::-webkit-scrollbar-thumb {
		background: #c2c2c2;
	}
	article::-webkit-scrollbar-thumb:hover {
		background: #9e9e9e;
	}
</style>
