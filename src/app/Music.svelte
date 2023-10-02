<script>
  import { activeSong } from '../lib/stores.js'
  import { clickOutside } from '../lib/util.ts'

  import { onMount } from 'svelte'

  export let audioPlayer;
  export let queue;

  let open = false
  let isPlaying = false

  // If the searchBar is clicked, ignore.
  // If the closed button is clicked, open it
  // If the open button is clicked, search
  const handleClick = (e) => {
	  e.preventDefault()
	  console.log('click!')
	  togglePlay()
	  if (e.target === document.getElementById('searchBar')) {
		  console.log('searching!')
	  } else if (!open) {
		  open = true
	  } else {
		  console.log('querying search')
		  //page = "search"
	  }
  }

  //// For the vibe measurement apparatus
  //// It could be cool, but not really in scope.
  //let audioCtx
  //let analyser
  //let track

  //const startAudioContext = () => {
  //    const canvas = document.getElementById("the-vibe")
  //    const canvasCtx = canvas.getContext("2d")

  //    if (!audioCtx) {
  //  	  audioCtx = new AudioContext()
  //  	  track = audioCtx.createMediaElementSource(audioPlayer)
  //  	  track.connect(audioCtx.destination)
  //  	  analyser = audioCtx.createAnalyser()
  //  	  analyser.connect(audioCtx.destination)
  //  	  analyser.smoothingTimeConstant = 0.85;

  //  	  visualize()
  //    }

  //    function visualize() {
  //  	  let WIDTH = canvas.width;
  //  	  let HEIGHT = canvas.height;

  //  	  const visualSetting = "sinewave"
  //  	  console.log(visualSetting);

  //  	  if (visualSetting === "sinewave") {
  //  		  analyser.fftSize = 2048;
  //  		  const bufferLength = analyser.fftSize;
  //  		  console.log(bufferLength);

  //  		  const dataArray = new Uint8Array(bufferLength);

  //  		  canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

  //  		  const draw = () => {
  //  			  console.log('draw', Date.now())
  //  			  let drawVisual = requestAnimationFrame(draw);

  //  			  analyser.getByteTimeDomainData(dataArray);

  //  			  canvasCtx.fillStyle = "rgb(200, 200, 200)";
  //  			  canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

  //  			  canvasCtx.lineWidth = 2;
  //  			  canvasCtx.strokeStyle = "rgb(0, 0, 0)";

  //  			  canvasCtx.beginPath();

  //  			  const sliceWidth = (WIDTH * 1.0) / bufferLength;
  //  			  let x = 0;

  //  			  for (let i = 0; i < bufferLength; i++) {
  //  				  let v = dataArray[i] / 128.0;
  //  				  let y = (v * HEIGHT) / 2;

  //  				  if (i === 0) {
  //  					  canvasCtx.moveTo(x, y);
  //  				  } else {
  //  					  canvasCtx.lineTo(x, y);
  //  				  }

  //  				  x += sliceWidth;
  //  			  }

  //  			  canvasCtx.lineTo(canvas.width, canvas.height / 2);
  //  			  canvasCtx.stroke();
  //  		  };

  //  		  draw();
  //  	  } else if (visualSetting == "frequencybars") {
  //  		  analyser.fftSize = 256;
  //  		  const bufferLengthAlt = analyser.frequencyBinCount;
  //  		  console.log(bufferLengthAlt);

  //  		  // See comment above for Float32Array()
  //  		  const dataArrayAlt = new Uint8Array(bufferLengthAlt);

  //  		  canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

  //  		  const drawAlt = function () {
  //  			  drawVisual = requestAnimationFrame(drawAlt);

  //  			  analyser.getByteFrequencyData(dataArrayAlt);

  //  			  canvasCtx.fillStyle = "rgb(0, 0, 0)";
  //  			  canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

  //  			  const barWidth = (WIDTH / bufferLengthAlt) * 2.5;
  //  			  let barHeight;
  //  			  let x = 0;

  //  			  for (let i = 0; i < bufferLengthAlt; i++) {
  //  				  barHeight = dataArrayAlt[i];

  //  				  canvasCtx.fillStyle = "rgb(" + (barHeight + 100) + ",50,50)";
  //  				  canvasCtx.fillRect(
  //  					  x,
  //  					  HEIGHT - barHeight / 2,
  //  					  barWidth,
  //  					  barHeight / 2
  //  				  );

  //  				  x += barWidth + 1;
  //  			  }
  //  		  };

  //  		  drawAlt();
  //  	  } else if (visualSetting == "off") {
  //  		  canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
  //  		  canvasCtx.fillStyle = "red";
  //  		  canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
  //  	  }
  //    }
  //}

  activeSong.subscribe((file) => {
    if (file) {
		audioPlayer.src = file
		audioPlayer.play()
    }
  })

  audioPlayer.addEventListener('play', () => isPlaying = true);
  audioPlayer.addEventListener('pause', () => isPlaying = false);

  audioPlayer.addEventListener('ended', () => {
    console.log("song over!")
    if (queue.length > 0) {
      activeSong.set(queue.splice(0,1))
    } else {
      activeSong.set(null)
    }
  })

  const togglePlay = () => {
	  if (audioPlayer.paused) {
		  audioPlayer.type("audio/mp3")
		  audioPlayer.play()
		  isPlaying = true
	  } else {
		  audioPlayer.pause()
		  isPlaying = false
	  }
  }
  
  let longpress = undefined

  const touchStart = (e) => {
	  e.preventDefault()
	  longpress = setTimeout(() => {
		  console.log('longpress')
		  longpress = undefined
		  open = true
	  }, 300)
  }

  const touchEnd = (e) => {
	  e.preventDefault()
	  if (longpress) {
		  clearTimeout(longpress)
		  togglePlay()
		  console.log('shortpress')
	  }
  }
</script>

<!--
<canvas id="the-vibe" />
<div on:click={() => startAudioContext()}>CTX</div>
-->
<button 
	class:open 
	use:clickOutside={() => open = false} 
	on:click={(e) => handleClick(e) }
	on:touchstart={(e) => touchStart(e) }
	on:touchend={(e) => touchEnd(e) }
	>
	<div class:open class="minimized musicButton">
		<img src="previous_track.png" alt="previous" />
	</div>
	<div class="musicButton">
		<img class:isPlaying id="vinyl" src="vinyl.png" alt="vinyl" />
		{#if isPlaying }
			<img id="playPause" src="pause_button.png" />
		{:else}
			<img id="playPause" src="play_button.png" />
		{/if}
	</div>
	<div class:open class="minimized musicButton">
		<img src="next_track.png" alt="next" />
	</div>
</button>

<style>
	canvas {
		width: 100%;
	}

	button {
		z-index: 101;
		position: fixed;
		bottom: 0;
		left: 0;
		display: flex;
		margin-left: 1.25rem;
		margin-bottom: 1.25rem;
		box-shadow: 0.25em 0.25em 0.5em 0.25em #33333333;
		background: #f8a147;
		border-radius: 1.625em 1.625em 1.625em 1.625em;
		height: 3.25em;
		width: 3.25em;
		transition: width 0.2s ease-in-out;
		justify-content: center;
		border: 2px solid white;
	}

	.musicButton {
		width: fit-content;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.minimized {
		display: none;
	}

	.minimized.open {
		display: flex;
	}

	#vinyl {
		position: absolute;
		height: 100%;
	}

	@keyframes spin {
		0% { transform: rotate(0deg);}
		100% { transform: rotate(360deg);}
	}

	.isPlaying#vinyl {
		animation: spin 1s infinite;
		animation-timing-function: linear;
	}

	#playPause {
		position: relative;
		height: 100%;
		padding: 0.8em;
	}

	button.open {
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

	button.open input {
		width: inherit;
		margin: 0.5rem;
		margin-left: 1rem;
		margin-right: 1rem;
		padding-left: 1rem;
	}

	button img {
		margin: auto;
	}

	button.open img {
		transition: margin 0.3s ease-in-out;
	}
</style>
