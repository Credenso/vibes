<script>
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
    const data = new FormData(e.currentTarget)
    console.log('formdata', data)
    let content = {
      name: undefined,
      audio: undefined,
      image: undefined,
      description: undefined
    }
    const results = await fetch("http://localhost:8002/upload", {
      method: "POST",
      body: data
    }).then(response => response.json()
      .then(json => {
        content.audio = json.audio;
        content.image = json.image;
        content.name = data.get('name');
        content.description = data.get('desc');

        const event = newPostEvent(JSON.stringify(content), keys.publicKey, keys.privateKey)
        publishEvent($relay, event)
      }))
  }

</script>

<form on:submit={handleUpload}>
  <p class="header">Upload A Song</p>
  <input type="hidden" name="pubkey" value={keys.publicKey} />
  <div class="formEntry">
    <label for="formSong">Song.</label>
    <input type="file" id="formSong" name="song" />
  </div>
  <div class="formEntry">
    <label for="formPic">Art.</label>
    <input type="file" id="formPic" name="icon" />
  </div>
  <div class="formEntry">
    <label for="formName">Name.</label>
    <input type="text" id="formName" name="name" />
  </div>
  <div class="formEntry">
    <label for="formDesc">About.</label>
    <input type="text" id="formDesc" name="desc" />
  </div>
  <br/>
  <br/>
  <button type="submit">Upload</button>
</form>


<style>
  form {
    background: #FFFFFF;
    margin: 0.5em;
    padding: 0.5em;
  }

  .header {
    font-size: 1.5em;
  }

  input {
    background-color: #EEEEEE;
    border-radius: 1em;
    padding: 0.5em;
  }

  button {
    padding: 0.5em;
    margin: 0.5em auto;
    border: 1px solid;
  }

  .formEntry {
    display: flex;
    align-items: center;
    justify-content: space-around;
  }

  .formEntry * {
    flex-grow: 1;
  }

  .formEntry label {
    font-weight: bold;
  }

  .formEntry input {
    margin: 0.5em;
  }

</style>
