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
<aside class="fixed w-half h-full bg-gray-200 border-r-2 shadow-lg" class:open>
	<nav use:clickOutside={closeIfOpen} class="p-12 text-xl">
		<slot />
	</nav>
</aside>

<style>
	aside {
		z-index: 100;
		top: 0;
		left: -200%;
		transition: left 0.3s ease-in-out;
	}

	nav {
		display: flex;
		flex-direction: column;
	}
	
	.open {
		left: 0
	}
</style>
