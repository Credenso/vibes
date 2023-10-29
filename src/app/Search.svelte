<script>
	import { onMount } from 'svelte'
	import { clickOutside } from '../lib/util.ts'

	export let search;
	export let page;
	export let activeWidget;

	$: searchOpen = (activeWidget === 'search')

	const closeSearch = () => {
		if (activeWidget === 'search') {
			activeWidget = undefined
			if (page === 'search' && search.length === 0) page = 'main'
		}
	}

	// If the searchBar is clicked, ignore.
	// If the closed button is clicked, open it
	// If the open button is clicked, search
	const handleClick = (e) => {
		e.preventDefault()
		console.log('click!')
		if (e.target === document.getElementById('searchBar')) {
			console.log('searching!')
		} else if (!searchOpen) {
			activeWidget = 'search'
		} else {
			console.log('querying search')
			page = "search"
		}
	}

	onMount(() => {
		const search = document.getElementById('searchBar')
		search.addEventListener('keydown', (e) => {
			e = e || window.event
			switch (e.which || e.keyCode) {
				case 13 :
					page = "search"
					break
			}
		})
	})
</script>

<button use:clickOutside={closeSearch} class:searchOpen on:click={(e) => handleClick(e) } class="text-gray-500 hover:text-gray-700 cursor-pointer mr-4 border-none focus:outline-none">
	<img src="magnifying_glass_light.png" alt="Search" />
	<input id="searchBar" bind:value={search} />
</button>

<style>
	button {
		z-index: 101;
		position: fixed;
		bottom: 0;
		right: 0;
		display: flex;
		align-items: center;
		margin-left: 1.25rem;
		margin-bottom: 1.25rem;
		margin-right: 1rem;
		box-shadow: 0.25em 0.25em 0.5em 0.25em #33333333;
		background: #028a9b;
		border-radius: 1.625em 1.625em 1.625em 1.625em;
		border: 2px solid white;
		height: 3.25em;
		width: 3.25em;
		transition: width 0.2s ease-in-out;
		color: rgb(107 114 128);
	}

	button.searchOpen {
		width: 75%;
		border-radius: 1.625em 1.625em 1.625em 1.625em;
		transition: width 0.3s ease-in-out;
	}

	button input {
		display: inline;
		width: 0;
		border-radius: 1rem;
		height: 2rem;
	}

	button.searchOpen input {
		width: inherit;
		margin: 0.5rem;
		margin-left: 1rem;
		margin-right: 1rem;
		padding-left: 1rem;
	}

	button img {
		margin: auto;
	}

	button.searchOpen img {
		margin-left: 1rem;
		transition: margin 0.3s ease-in-out;
	}
</style>
