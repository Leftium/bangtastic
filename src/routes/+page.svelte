<script lang="ts">
	import '@picocss/pico';

	import { gg } from '$lib/util';

	// Bindings:
	let inputElement = $state<HTMLInputElement>(undefined as any);
	let value = $state('');

	let lastTime = +new Date();
	function ggDeltaTime() {
		const now = +new Date();
		gg(now - lastTime);
		lastTime = now;
	}

	function onkeydown(this: HTMLInputElement, event: Event) {
		const e = event as KeyboardEvent;
		gg(e.key);
		ggDeltaTime();

		if (!['Tab', 'Shift', 'Ctrl', 'Alt'].includes(e.key)) {
			inputElement.focus();
		}

		// Convert space to `!` if first character or follows another space:
		if (e.key === ' ') {
			if (value === '' || value.at(-1) === ' ') {
				value += '!';
				e.preventDefault();
			}
		}

		// Handle double tap space to ". " on iOS:
		if (e.key === '. ') {
			value += ' !';
			e.preventDefault();
		}

		// Execute search on Kagi.com:
		if (e.key === 'Enter') {
			window.open(`https://kagi.com/search?q=${value}`, '_blank');
			e.preventDefault();
		}
	}

	function onclick(e: Event) {
		gg();
		inputElement.select();
	}

	function onvisibilitychange() {
		if (document.visibilityState === 'visible') {
			inputElement.select();
		}
	}
</script>

<svelte:document {onvisibilitychange} {onkeydown} />

<main class="container-fluid" {onclick} role="none">
	<!-- svelte-ignore a11y-autofocus -->
	<input
		bind:this={inputElement}
		bind:value
		{onkeydown}
		oninput={onkeydown}
		autofocus
		spellcheck="false"
		autocomplete="off"
		autocorrect="off"
		autocapitalize="off"
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
