<script>
  import {
    activeSong
  } from '../lib/stores.js'

  export let music;

  activeSong.subscribe((song) => {
    music.src = song
    music.play()
  })
</script>
