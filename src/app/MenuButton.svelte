<script>
	export let open = false
</script>

<button class="text-gray-500 hover:text-gray-700 cursor-pointer mr-4 border-none focus:outline-none" class:open on:click={() => open = !open}>
	<svg width=32 height=24>
		<line id="top" x1=0 y1=2  x2=32 y2=2/>
		<line id="middle" x1=0 y1=12 x2=24 y2=12/>
		<line id="bottom" x1=0 y1=22 x2=32 y2=22/>
	</svg>
</button>

<style>
	svg {
		min-height: 24px;
		transition: transform 0.3s ease-in-out;
	}
	
	svg line {
		stroke: currentColor;
		stroke-width: 3;
		transition: transform 0.3s ease-in-out
	}
	
	button {
		z-index: 101;
		position: fixed;
		top: 0;
		left: 0;
		margin-left: 1.5rem;
		height: 5em;
	}
	
	.open svg {
		transform: scale(0.8) translate(0px, -6px);
	}
	
	.open #top {
		transform: translate(6px, 0px) rotate(45deg)
	}
	
	.open #middle {
		transform: rotateY(180deg);
	}
	
  .open #bottom {
		transform: translate(-12px, 9px) rotate(-45deg)
	}
</style>
