<script>
  // This may be deprecated as I've decided to focus on Hypercore

  import { 
    postDictionary,
    relay
  } from '../lib/stores'

  import { uploadSong } from '../lib/ipfs'
  import { newPostEvent, publishEvent } from '../lib/nostr'
  import { preload } from '../lib/util'

  import Post from '../app/Post.svelte'

  export let keys
  let uploading = false

  const handleUpload = async (e) => {
    e.preventDefault()

    const hash = await uploadSong(e)
    const event = newPostEvent(hash, keys.publicKey, keys.privateKey)
    publishEvent($relay, event)
  }

</script>

<p class="header">Upload A Song to IPFS</p>
<form on:submit={handleUpload}>
  <h2>Song</h2>
  <input type="file" id="formSong" name="song" />
  <h2>Icon</h2>
  <input type="file" id="formPic" name="icon" />
  <h2>Song Name</h2>
  <input type="text" id="formName" name="name" />
  <h2>Song Desc</h2>
  <input type="text" id="formDesc" name="name" />
  <br/>
  <br/>
  <button type="submit">Upload</button>
</form>


<style>
  .header {
    font-size: 1.5em;
  }
</style>
