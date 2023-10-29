<script>
	import MenuButton from './MenuButton.svelte'
	import { clickOutside } from '../lib/util.ts'
	export let open

	let justOpened = false
	$: open, openGuard()

	// Protects the menu-opening click from closing the menu
	const openGuard = () => {
		justOpened = true
		setTimeout(() => justOpened = false, 300);
	}

	const closeIfOpen = (e) => {
		if (open && !justOpened) {
			open = false
		}
	}
</script>

<MenuButton  bind:open />
<aside class:open>
  	<h1>Menu</h1>
	<hr>
	<nav use:clickOutside={closeIfOpen}>
		<slot />
	</nav>
</aside>

<style>
	aside {
		position: fixed;
		width: min(20em, 60vw);
		height: 100%;
		background-color: #EEEEEE;
		border-right-width: 2px;
		box-shadow: 0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -2px rgba(0,0,0,.05);
		z-index: 100;
		top: 0;
		left: -200%;
		transition: left 0.3s ease-in-out;
	}

	h1 {
		font-size: 1.5em;
		font-weight: bold;
		margin: 1em;
	}

	hr {
		margin: 1em;
	}

	nav {
		display: flex;
		flex-direction: column;
		padding: 3rem;
		padding-top: 0;
		font-size: 1.25rem;
		align-items: start;
	}
	
	.open {
		left: 0
	}
</style>
