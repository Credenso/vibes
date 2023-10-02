<script>
  import {
    activeSong
  } from '../lib/stores.js'

  export let music;
  export let queue;

  activeSong.subscribe((song) => {
    if (song) {
      music.src = song
      music.play()
    }
  })

  music.addEventListener('ended', () => {
    console.log("song over!")
    if (queue.length > 0) {
      activeSong.set(queue.splice(0,1))
    } else {
      activeSong.set(null)
    }
  })

  const togglePlay = () => {
    if (music.paused) {
      music.play()
    } else {
      music.pause()
    }
  }
</script>

<button on:click={togglePlay}>Pause</button>
