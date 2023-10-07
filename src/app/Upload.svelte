<script>
  import { 
    postDictionary,
    relay
  } from '../lib/stores'

  import { uploadSong } from '../lib/ipfs'
  import { 
    newPostEvent,
    publishEvent,
    signEvent
  } from '../lib/nostr'
  import { preload } from '../lib/util'

  import Post from '../app/Post.svelte'

  export let keys
  export let page
  let uploading = false

  const handleUpload = async (e) => {
    e.preventDefault()
    uploading = true
    const data = new FormData(e.currentTarget)
    let content = {
      name: undefined,
      audio: undefined,
      image: undefined,
      description: undefined
    }
    const results = await fetch("http://solar.credenso.cafe/upload", {
      method: "POST",
      body: data
    }).then(response => response.json()
      .then(async json => {
        const ids = Promise.all(json.map(async event => {
          const mimetype = event.tags.find(tag => tag[0] === "m")[1]
          const e = signEvent(event, keys.privateKey)
          await publishEvent($relay, e)
          if (mimetype.startsWith('audio')) {
            content.audio = e.id
          } else if (mimetype.startsWith('image')) {
            content.image = e.id
          }
          console.log(e)
          return e.id
        }))

        console.log(await ids)
        console.log(content)

        content.name = data.get('name');
        content.description = data.get('desc');

        const event = newPostEvent(JSON.stringify(content), keys.publicKey, keys.privateKey)
        console.log('publishing event', event)
        await publishEvent($relay, event)

        // Navigate home
        uploading = false
        page = "main"
      }))
  }

</script>

<form on:submit={handleUpload}>
  <p class="header">Upload A Song</p>
  <input type="hidden" name="pubkey" value={keys.publicKey} />
  <div class="formEntry">
    <label for="formSong">Song.</label>
    <input type="file" accept="audio/*" id="formSong" name="song" />
  </div>
  <div class="formEntry">
    <label for="formPic">Art.</label>
    <input type="file" accept="image/*" id="formPic" name="icon" />
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
  {#if uploading}
    <button type="submit" disabled>Uploading...</button>
  {:else}
    <button type="submit">Upload</button>
  {/if}
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
