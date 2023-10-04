<script>
  import { activeSong, queue } from '../lib/stores.js'
  import { clickOutside, secondsToTime } from '../lib/util.ts'

  import { onMount } from 'svelte'

  export let audioPlayer;
  export let searchOpen;

  let open = false
  export let isPlaying
  let hasAppeared = false

  // These are reactive bindings, they update whenever
  // one of the mentioned values changes
  $: if (searchOpen) open = false;
  $: isPlaying, setPlayPauseIcon(isPlaying)
  let progress = undefined

  const setPlayPauseIcon = (isPlaying) => {
	  const icon = document.querySelector('#playPause')
	  if (icon && isPlaying) {
		  icon.src = "pause_button.png"
	  } else if (icon) {
		  icon.src = "play_button.png"
	  }
  }

  // These two variables and the next three functions
  // are for seeking to specific times in the song.
  // It's not my best work, but it works... for now.
  let seeking
  let seekResult

  const seek = (e) => {
	  // We save the initial x-coordinate of the mouse
	  // so that we can see how much we've moved for the
	  // progress bar
	  seeking = e.clientX
	  const menuWidth = document.querySelector('#musicMenu').clientWidth
	  const progressWidth = document.querySelector('#background').clientWidth

	  window.addEventListener("mousemove", moveProgressBar)
	  window.addEventListener("mouseup", finishMove)
	  window.addEventListener("touchmove", moveProgressBar)
	  window.addEventListener("touchend", finishMove)
  }

  const finishMove = () => {
	  window.removeEventListener("touchmove", moveProgressBar)
	  const newTime = Math.floor((seekResult / 100) * audioPlayer.duration)

	  // newTime is also sometimes NaN
	  if (newTime) {
		  audioPlayer.currentTime = newTime
	  }
	  seekResult = undefined
	  seeking = undefined
  }

  const moveProgressBar = (e) => {
	  const menuWidth = document.querySelector('#musicMenu').clientWidth
	  const diff = e.clientX - seeking
	  seekResult = Math.ceil((seeking + diff) * 100 / menuWidth)

	  // Sometimes seekResult returns NaN, we skip those
	  if (seekResult) {
		  const widthValue = `max(3.25rem, ${seekResult}%)`
		  document.querySelector('canvas').style.width = widthValue
		  elapsed = secondsToTime(Math.floor((seekResult / 100 ) * audioPlayer.duration))
	  }
  }

  // We need these to record how long the song has
  // been playing for
  let elapsed
  let duration

  // Checks every 100ms what the current elapsed time is
  window.setInterval(() => {
	  if (isPlaying & !seeking) {
		  elapsed = secondsToTime(audioPlayer.currentTime)
		  duration = secondsToTime(audioPlayer.duration)
		  progress = Math.ceil((audioPlayer.currentTime / audioPlayer.duration) * 100)

		  if (progress) {
			  const widthValue = `max(3.25rem, ${progress}%)`
			  document.querySelector('canvas').style.width = widthValue
		  }
	  }
  }, 100);

  // Whenever the activeSong is set to something new, we play it
  activeSong.subscribe((file) => {
    if (file) {
		hasAppeared = true;
		audioPlayer.src = file
		audioPlayer.play()
    }
  })

  queue.subscribe((queue) => {
	  if (!isPlaying) {
		  activeSong.set(queue.splice(0,1)[0])
	  }
  })

  audioPlayer.addEventListener('ended', () => {
    console.log("song over!")
	nextSong()
  })

  const togglePlay = () => {
	  console.log('toggling play')
	  if (audioPlayer.paused) {
	  console.log('playing')
		  audioPlayer.play()
		  isPlaying = true
	  } else {

		  audioPlayer.pause()
		  isPlaying = false
	  }
  }
  
  let longpress = undefined

  const buttonDown = (e) => {
	  e.preventDefault()
	  longpress = setTimeout(() => {
		  // A long-press on the open bar starts seeking
		  if (open) seek(e)

		  longpress = undefined
		  open = true
	  }, 250)
  }

  const buttonUp = (e) => {
	  e.preventDefault()
	  if (longpress) {
		  // Short press
		  switch(e.target.id) {
			  case "prev":
				  previousSong();
				  break;
			  case "playPause":
				  togglePlay();
				  break;
			  case "next":
				  nextSong();
				  break;
		  }

		  console.log('shortpress')
		  clearTimeout(longpress)
	  }
  }
  
  const previousSong = () => {
	  audioPlayer.currentTime = 0
  }

  const nextSong = () => {
	  if ($queue.length > 0) {
		  activeSong.set($queue.splice(0,1)[0])
	  } else {
		  activeSong.set(null)
		  audioPlayer.currentTime = 0
		  audioPlayer.pause()
	  }
  }
</script>

<button 
	id="musicMenu"
	class:hasAppeared
	class:open 
	use:clickOutside={() => open = false}

	on:touchstart={(e) => buttonDown(e) }
	on:touchend={(e) => buttonUp(e) }

	on:mousedown={(e) => buttonDown(e) }
	on:mouseup={(e) => buttonUp(e) }
	>
	<canvas class:open id="background" />
	<p class:open class="minimized elapsed">{ elapsed }</p>
	<div class:open class="minimized musicButton">
		<img id="prev" src="previous_track.png" alt="previous" />
	</div>
	<div class="musicButton">
		<img class:isPlaying id="vinyl" src="vinyl.png" alt="vinyl" />
		<img id="playPause" src="play_button.png" />
	</div>
	<div class:open class="minimized musicButton">
		<img id="next" src="next_track.png" alt="next" />
	</div>
	<p class:open class="minimized duration">{duration}</p>
</button>

<style>
	canvas {
		position: absolute;
		width: 3.25rem;
		max-width: 100%;
		left: 0;
		height: 100%;
		background-color: #028a9b;
		z-index: 99;
		overflow: hidden;
		border-radius: 1.625em;
		align-self: center;
		opacity: 0;
		transition: width 0.1s linear;
	}

	canvas.open {
		opacity: 1;
	}

	button {
		z-index: 101;
		position: fixed;
		bottom: 0;
		left: -5em;
		display: flex;
		margin-left: 1.25rem;
		margin-bottom: 1.25rem;
		box-shadow: 0.25em 0.25em 0.5em 0.25em #33333333;
		background: #f8a147;
		border-radius: 1.625em 1.625em 1.625em 1.625em;
		height: 3.25em;
		width: 3.25em;
		transition: all 0.2s ease-in-out;
		transition: width 0.2s ease-in-out;
		transition: left 0.5s ease-in-out;
		justify-content: center;
		border: 2px solid white;
	}

	button.hasAppeared {
		left: 0;
	}

	.musicButton {
		width: fit-content;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 105;
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
		z-index: 100;
	}

	.elapsed {
		align-self: center;
		justify-content: start;
		padding-left: 1.5em;
		z-index: 100;
		flex-grow: 1;
	}

	.duration {
		align-self: center;
		justify-content: end;
		padding-right: 1.5em;
		z-index: 100;
		flex-grow: 1;
	}

	button.open {
		width: 75%;
		border-radius: 1.625em 1.625em 1.625em 1.625em;
		transition: width 0.3s ease-in-out;
	}

	button img {
		margin: auto;
	}

	button.open img {
		transition: margin 0.3s ease-in-out;
	}
</style>
