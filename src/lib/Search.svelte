<script>
	export let open = false
</script>

<button class="text-gray-500 hover:text-gray-700 cursor-pointer mr-4 border-none focus:outline-none" class:open on:click={() => open = !open}>
	<img src="magnifying_glass_light.png" alt="Search" />
</button>

<style>
	svg {
		min-height: 24px;
		transition: transform 0.3s ease-in-out;
	}

	button {
		z-index: 101;
		position: fixed;
		bottom: 0;
		right: 0;
		margin-right: 1.5rem;
		margin-bottom: 1.25rem;
		box-shadow: 0.25em 0.25em 0.5em 0.25em #33333333;
		background: #028a9b;
		border-radius: 50%;
		height: 3.25em;
		width: 3.25em;
	}

	button img {
		margin: auto;
	}
</style>
