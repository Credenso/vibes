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
	<nav use:clickOutside={closeIfOpen}>
		<slot />
	</nav>
</aside>

<style>
	aside {
		position: fixed;
		width: 50%;
		height: 100%;
		background-color: #EEEEEE;
		border-right-width: 2px;
		box-shadow: 0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -2px rgba(0,0,0,.05);
		z-index: 100;
		top: 0;
		left: -200%;
		transition: left 0.3s ease-in-out;
	}

	nav {
		display: flex;
		flex-direction: column;
		padding: 3rem;
		font-size: 1.25rem;
	}
	
	.open {
		left: 0
	}
</style>
