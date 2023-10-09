<script>
  import { onMount } from 'svelte'
  import { encode } from 'blurhash'
  import { 
    postDictionary,
    relay
  } from '../lib/stores'

  import { uploadSong } from '../lib/ipfs'
  import { 
    newPostEvent,
    newReactionEvent,
    publishEvent,
    signEvent
  } from '../lib/nostr'
  import { preload } from '../lib/util'

  import Post from '../app/Post.svelte'
  import Tags from '../app/Tags.svelte'

  export let page
  export let keys
  let uploading = false
  let preview = false
  let tags = []
  let blurhash
  let hashableContext

  // I want to blurhash the canvas once it has already appeared!
  //$: makeBlurhash(hashableContext)

  // Doesn't get used at the moment
  const makeBlurhash = async (ctx) => {
    console.log('making blurhash')
    if (ctx) {
      const imgData = ctx.getImageData(0,0,ctx.canvas.width, ctx.canvas.height)
      blurhash = encode(imgData.data, imgData.width, imgData.height, 4, 4)
      console.log('blurhash', blurhash)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    uploading = true
    const data = new FormData(e.currentTarget)

    let content = {
      name: undefined,
      audio: undefined,
      image: undefined,
      description: undefined,
      tags: undefined
    }
    const results = await fetch("http://solar.credenso.cafe/upload", {
      method: "POST",
      body: data
    }).then(response => response.json()
      .then(async json => {
        const ids = await Promise.all(json.map(async event => {
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

        content.name = data.get('name');
        content.description = data.get('desc');
        let eventsToPublish = []

        const postEvent = newPostEvent(JSON.stringify(content), keys.publicKey, keys.privateKey)
        eventsToPublish.push(postEvent)
        tags.forEach(tag => {
          const unsignedEvent = newReactionEvent(tag, keys.publicKey, postEvent)
          eventsToPublish.push(signEvent(unsignedEvent, keys.privateKey))
        })

        console.log('publishing these', eventsToPublish)
        await Promise.all(eventsToPublish.map(async event => {
          console.log('publishing event', event)
          publishEvent($relay, event)
        }))

        // Navigate home
        uploading = false
        page = "main"
      }))
  }

  let img = new Image()

  onMount(() => {
    const inputPic = document.getElementById('formPic')
    inputPic.addEventListener('input', () => {
      let fr = new FileReader()
      const draw = () => {
        preview = true
        const canvas = document.getElementById('imagePreview') 
        const ctx = canvas.getContext('2d')
        const img = new Image()
        img.onload = () => {
          let offsetX, offsetY
          let diff = img.width - img.height

          // if it's landscape
          if (diff > 0) {
            console.log('landscape')
            ctx.drawImage(img, diff / 2, 0, img.height, img.height, 0, 0, canvas.width, canvas.height)
          } else {
            console.log('portrait')
            ctx.drawImage(img, 0, diff / 2, img.height, img.height, 0, 0, canvas.width, canvas.height)
          }

          console.log('img',img.width, img.height)
        }
        img.src = fr.result
      }
      fr.onload = draw
      fr.readAsDataURL(inputPic.files[0])

      // Does nothing right now
      //hashableContext = ctx
    });
  })
</script>

<form on:submit={handleUpload}>
  <p class="header">Upload A Song</p>
  <input type="hidden" name="pubkey" value={keys.publicKey} />
  <input type="hidden" name="blurhash" value={blurhash} />
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
    <textarea type="text" id="formDesc" name="desc" placeholder="What do you want to tell people about this song?"/>
  </div>
  <Tags bind:tags />
  <br/>
  <br/>
  {#if uploading}
    <button type="submit" disabled>Uploading...</button>
  {:else}
    <button type="submit">Upload</button>
  {/if}

  <div class="hidden" class:preview>
    <hr/>
    <h1>Preview</h1>
    <canvas class:preview id="imagePreview" width=1080 height=1080 />
  </div>
</form>


<style>

  .hidden {
    display: none;
  }

  canvas {
    width: 100%;
    max-width: 600px;
    margin: auto;
  }

  h1 {
    font-size: 1.5em;
    font-weight: bold;
  }

  .hidden.preview {
    display: block;
  }

  form {
    background: #FFFFFF;
    margin: 0.5em;
    padding: 0.5em;
  }

  .header {
    font-size: 1.5em;
  }

  input, textarea {
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

  .formEntry input, textarea {
    margin: 0.5em;
  }

</style>
