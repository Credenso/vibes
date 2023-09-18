<script>
	import MenuButton from './MenuButton.svelte'
	export let open = false
</script>

<MenuButton bind:open={open}/>
<aside class="fixed w-half h-full bg-gray-200 border-r-2 shadow-lg" class:open>
	<nav class="p-12 text-xl">
		<slot />
	</nav>
</aside>

<style>
	aside {
		z-index: 100;
		top: 0;
		left: -200%;
		transition: left 0.3s ease-in-out
	}
	
	.open {
		left: 0
	}
</style>
