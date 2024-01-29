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

	type LocationFlag = boolean | 'header' | 'footer';

	export let search: LocationFlag = 'header';
	export let rowsPerPage: LocationFlag = 'header';
	export let rowCount: LocationFlag = 'footer';
	export let pagination: LocationFlag = 'footer';

	let element: HTMLElement;
	let clientWidth = 1000;

	handler.on('change', () => {
		if (element) element.scrollTop = 0;
	});
</script>

<section bind:clientWidth class={$$props.class ?? ''}>
	<div>
		<header>
			<div>
				{#if [true, 'header'].includes(search)}
					<Search {handler} />
				{/if}
				{#if [true, 'header'].includes(rowsPerPage)}
					<RowsPerPage {handler} small={clientWidth < 600} />
				{/if}
			</div>
			<div>
				{#if [true, 'header'].includes(rowCount)}
					<RowCount {handler} small={clientWidth < 600} />
				{/if}
				{#if [true, 'header'].includes(pagination)}
					<Pagination {handler} small={clientWidth < 600} />
				{/if}
			</div>
		</header>
		<article bind:this={element}>
			<slot />
		</article>
		<footer>
			<div>
				{#if [true, 'footer'].includes(rowCount)}
					<RowCount {handler} small={clientWidth < 600} />
				{/if}
				{#if [true, 'footer'].includes(pagination)}
					<Pagination {handler} small={clientWidth < 600} />
				{/if}
			</div>
			<div>
				{#if [true, 'footer'].includes(search)}
					<Search {handler} />
				{/if}
				{#if [true, 'footer'].includes(rowsPerPage)}
					<RowsPerPage {handler} small={clientWidth < 600} />
				{/if}
			</div>
		</footer>
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
	footer div {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;

		height: auto;

		padding: 4px;
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
