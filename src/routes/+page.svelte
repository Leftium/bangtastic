<script lang="ts">
	import { gg } from '$lib/util';

	// Bindings:
	let inputElement = $state<HTMLInputElement>(undefined as any);
	let value = $state('');

	function selectionLength(inputElement: HTMLInputElement) {
		return (inputElement.selectionEnd || 0) - (inputElement.selectionStart || 0);
	}

	function onkeydown(this: HTMLInputElement, event: Event) {
		const e = event as KeyboardEvent;
		gg(e.key, e);
		if (e.key === ' ') {
			// Convert space key to `!` if first character or follows another space:
			if (value === '' || value.at(-1) === ' ') {
				value += '!';
				e.preventDefault();
			}

			// Convert selection to `!` if all selected:
			if (value.length === selectionLength(inputElement)) {
				value = '!';
				inputElement.selectionStart = inputElement.selectionEnd;
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

	function onmousedown(e: Event) {
		inputElement.focus();
		if (selectionLength(inputElement) > 0) {
			inputElement.selectionEnd = inputElement.selectionStart = value.length;
		} else {
			inputElement.selectionStart = 0;
			inputElement.selectionEnd = value.length;
		}

		e.preventDefault();
	}

	function onvisibilitychange() {
		if (document.visibilityState === 'visible') {
			inputElement.select();
		}
	}
</script>

<svelte:document {onvisibilitychange} {onmousedown} />

<main class="pico container-fluid" role="none">
	<!-- svelte-ignore a11y-autofocus -->
	<input
		bind:this={inputElement}
		bind:value
		{onkeydown}
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
