<script>
	const randomQuip = () => {
		const quips = [
			"Modulating harmful frequencies...",
			"Rasterizing that good-good...",
			"Aligning qubits...",
			"Transcoding kumbaya.flac...",
			"Harmonizing overtones...",
			"Sending good vibes to the L1 cache...",
			"Searching for post-hardcore folkstep...",
			"Bootstrapping harmonic oscillator...",
			"Collapsing wave equation...",
			"Binauralizing beats..."
		]
		return quips[Math.floor(Math.random() * quips.length)]
	}

	let loadingPhrase = randomQuip()

	window.setInterval(() => loadingPhrase = randomQuip(), 2000);
</script>

<div class="loading">
	<img class="loadingVinyl" src="/vinyl.png" alt="vinyl">
	<p class="quip">{loadingPhrase}</p>
</div>

<style>
	@keyframes spin {
		0% { transform: rotate(0deg);}
		100% { transform: rotate(360deg);}
	}

	.loading {
		position: absolute;
		top: 0;
		left: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100vw;
		height: 100%;
		padding: 5em;
	}
	
	.loadingVinyl {
		width: 15em;
		animation: spin 1s infinite;
	}

	.quip {
		margin-top: 1em;
		height: 5em;
		font-size: 1.5em;
	}
</style>


