<script>
  import { onMount } from 'svelte'
  import { encode } from 'blurhash'
  import { 
    postDictionary,
    hyper,
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

  import Post from './Post.svelte'
  import Tags from './Tags.svelte'
  import SongSelector from './SongSelector.svelte'

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
    console.log(upload)
    uploading = true
    const data = new FormData(e.currentTarget)

    // Here, we get a list of all the inputs named "song" and then
    // make an array with a home for each one.
    const songInputs = document.querySelectorAll('input[name="song"]')
    let songIds = new Array(songInputs.length)
    let songNames = new Array(songInputs.length)
    songInputs.forEach((input, i) => {
      // The or (||) statement covers the case for single uploads
      const name = document.querySelector(`input[id="name_${input.id}"]`) || document.querySelector('#formSong')
      if (input.type === "file") {
        // This is the same name replacement that solar uses...
        // but this might end up being kind of fragile.

        // We use it to replace it with the ID of the event once
        // it has been signed
        songIds[i] = input.files[0].name.replaceAll(/[#? ]/g, "")
        songNames[i] = name.value

      } else if (input.type === "hidden") {
        // If the input type is hidden, it's the result of
        // our SongSelector. We grab the id and save it.
        songIds[i] = input.value
        songNames[i] = $postDictionary[input.value].content.name
      }
    })

    let content = {
      name: undefined,
      audio: undefined,
      image: undefined,
      description: undefined,
      tags: undefined
    }

    const publish = (e) => {
      if (upload.includes('nostr')) {
        publishEvent($relay, e)
      }
      if (upload.includes('solar')) {
        $hyper.log.append(JSON.stringify(e))
      }
    }

    // This is our function for uploading to a server
    const uploadToServer = (formData) => {

      // First, we post all the form data
      fetch("http://solar.credenso.cafe/upload", {
      method: "POST",
      body: formData
      })
        .then(response => response.json()
          .then(async json => {

            // The json object that is returned by the /upload endpoint
            // is an array of unsigned events for the user to sign
            // and publish - we do that here. We don't actually do
            // anything with the IDs though.
            const ids = await Promise.all(json.map(async event => {
              const mimetype = event.tags.find(tag => tag[0] === "m")[1]
              const e = signEvent(event, keys.privateKey)

              console.log('event is', e)
              publish(e)

              // If we find an event with an image mimetype, that
              // is the art we're using for the post
              if (mimetype.startsWith('image')) {
                content.image = e.id
              }

              // For each file uploaded, find its place in the songIds
              // list and replace it with its new ID
              const formIndex = songIds.indexOf(event.content)
              if (formIndex !== -1) {
                songIds[formIndex] = e.id
              }

              return e.id
            }))

            // Set the audio entry to the array of songIds we created
            content.audio = songIds

            if (content.audio.length > 1) {
              // If there's multiple audio files, add the names list
              content.names = songNames
            } else {
              // If there's only one audio file, drop the array
              content.audio = content.audio[0]
            }

            // Fill the rest of the data from the form
            content.name = data.get('name');
            content.description = data.get('desc');

            // Time to make our post!
            let eventsToPublish = []

            // First, we make the post itself
            const postEvent = newPostEvent(JSON.stringify(content), keys.publicKey, keys.privateKey)
            eventsToPublish.push(postEvent)

            // Then, for each vibe we give it, we publish that as well.
            tags.forEach(tag => {
              const unsignedEvent = newReactionEvent(tag, keys.publicKey, postEvent)
              eventsToPublish.push(signEvent(unsignedEvent, keys.privateKey))
            })

            // Do the publishing!
            await Promise.all(eventsToPublish.map(async event => {
              publish(event)
            }))

            // Navigate home
            uploading = false
            page = "main"
          }))
    }

    if (upload.includes('nostr')) {
      uploadToServer(data)
    }

    if (upload.includes('solar')) {
      //TODO: Enable upload to hyperlog
      //uploadToServer(data)
    }
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

  const uploadType =  [
    'single',
    'collection'
  ]

  let value = ''
  let selectedUploadType = uploadType[0]
  let answer = ''

  let contents = [undefined]

  const addContent = () => {
    contents = [...contents, undefined]
  }

  const removeContent = () => {
    contents = contents.slice(0, contents.length - 1)
  }

  let upload = undefined

</script>

<form autocomplete="off" on:submit|preventDefault={handleUpload}>
  <label class="header" for="formType">Upload a</label>
  <select
    id="formType"
    class="header"
    bind:value={selectedUploadType}
    on:change={() => (answer = '')}
    >
    {#each uploadType as type}
      <option value={type}>
      {type}
      </option>
    {/each}
  </select>
  <hr/>
  <input type="hidden" name="pubkey" value={keys.publicKey} />
  {#if selectedUploadType === 'single'}
    <div class="formEntry">
      <label for="formSong">Song.</label>
      <input type="file" accept="audio/*" id="formSong" name="song" />
    </div>
  {:else if selectedUploadType === 'collection'}
    {#each contents as content, i}
      {#if i > 0}
        <hr>
      {/if}
      <div class="formEntry">
        <label for="formSong">Song {i+1}.</label>
        {#if content === undefined}
          <div class="btn" on:click={() => content = "upload"}>Upload</div>
          <div class="btn" on:click={() => content = "single"}>Link</div>
        {:else if content === "upload"}
          <input type="file" accept="audio/*" id="formSong{i}" name="song" />
          <input type="text" id="name_formSong{i}" name="songName" placeholder="Song name"/>
          <div class="btn" on:click={() => content = undefined}>X</div>
        {:else if content === "single"}
          <SongSelector bind:content />
        {/if}
      </div>
    {/each}
    <div class="btn" on:click={addContent}>+ Add a song</div>
    {#if contents.length > 1}
      <div class="btn" on:click={removeContent}>- Remove a song</div>
    {/if}
  {/if}

  <hr/>
  <div class="formEntry">
    <label for="formPic">Art.</label>
    <input type="file" accept="image/*" id="formPic" name="icon" />
  </div>
  <input type="hidden" name="blurhash" value={blurhash} />

  <div class="formEntry">
    <label for="formName">Title.</label>
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
    <label for="radio_nostr">Nostr</label>
    <input type="checkbox" id="radio_nostr" bind:group={upload} value="nostr" disabled>
    <label for="radio_solar">Solar</label>
    <input type="checkbox" id="radio_solar" bind:group={upload} value="solar" disabled>
  {:else}
    <label for="radio_nostr">Nostr</label>
    <input type="checkbox" id="radio_nostr" bind:group={upload} value="nostr">
    <label for="radio_solar">Solar</label>
    <input type="checkbox" id="radio_solar" bind:group={upload} value="solar">
  {/if}
  {#if uploading}
    <button type="submit" disabled>Uploading...</button>
  {:else if upload === undefined}
    <button type="submit" disabled>Upload</button>
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
  select {
    background-color: transparent;
  }

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

  hr {
    margin: 1em;
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

  .btn {
    cursor: pointer;
    padding: 0.5em;
    margin: 0.5em;
    border: 1px solid;
    border-radius: 1em;
    flex-grow: 0;
  }

  input, textarea {
    background-color: #EEEEEE;
    border-radius: 1em;
    padding: 0.5em;
    flex-grow: 1;
  }

  button {
    padding: 0.5em;
    margin: 0.5em auto;
    border: 1px solid;
  }

  .formEntry {
    display: flex;
    flex-wrap: wrap;
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
