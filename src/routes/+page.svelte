<script lang="ts">
	import '@picocss/pico';

	import _ from 'lodash';

	import { gg } from '$lib/util';

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
</script>

<main class="container-fluid">
	<input autocapitalize="none" {onkeydown} />

	<ul>
		<li>
			<a href="/bangs">Browse bangtastic data</a> (DuckDuckGo bang.js data merged and cleaned up)
		</li>
		<li>
			<a href="/bangs/sources">Browse source data from bang.js</a> (Grouped by bangtastic normalized
			url)
		</li>
	</ul>
</main>

<style>
	main {
		margin: 4px 0;
	}
</style>
