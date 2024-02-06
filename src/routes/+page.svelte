<script lang="ts">
	import '@picocss/pico';

	import _ from 'lodash';

	import { gg } from '$lib/util';

	export let data;

	// Bindings:
	let inputElement: HTMLInputElement;

	let lastTime = +new Date();
	function ggDeltaTime() {
		const now = +new Date();
		gg(now - lastTime);
		lastTime = now;
	}

	function onkeydown(this: HTMLInputElement, event: Event) {
		const e = event as KeyboardEvent;

        gg(e);
		ggDeltaTime();

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

	function onclick(e: Event) {
		gg();
		inputElement.focus();
	}
</script>

<main class="container-fluid" {onclick} role="none">
	<!-- svelte-ignore a11y-autofocus -->
	<input
		bind:this={inputElement}
		autocapitalize="none"
		{onkeydown}
		oninput={onkeydown}
		autofocus
		autocomplete="off"
	/>

	<ul>
		<li>
			<a href="https://www.leftium.com/bangtastic">About Bangtastic!</a>
		</li>
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
		height: calc(100svh - 8px);
	}
</style>
