<script>
  import { onMount } from 'svelte'
  import { encode } from 'blurhash'
  import { 
    postDictionary,
    memberDictionary,
    contentDictionary,
    members,
    relay
  } from '../lib/stores'

  import { uploadSong } from '../lib/ipfs'
  import { 
    newPostEvent,
    newReactionEvent,
    publishEvent,
    signEvent
  } from '../lib/nostr'

  import { schnorr } from '@noble/curves/secp256k1';
  import { bytesToHex } from '@noble/hashes/utils';
  import { sha256 } from '@noble/hashes/sha256';
  import b4a from 'b4a';

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
  let uploadedImage
  let hasImage = false
  let lyrics = false
  let formOne = undefined
  let section = 1
  let tab = "about"
  $: me = $memberDictionary[keys.publicKey]

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
    //uploading = true
    const formTwo = new FormData(document.querySelector('form#partTwo'))

    // Duplicate the first form into the second
    const iter = formOne.entries()
    let i = 0
    for (const d of iter) {
      formTwo.append(d[0], d[1])
    }

    console.log('formTwo', formTwo)

    // Here, we get a list of all the inputs named "song" and then
    // make an array with a home for each one.
    const songInputs = formTwo.getAll('song')
    console.log('songInputs', songInputs)
    console.log('songs', songs)
    let songIds = new Array(songInputs.length)
    let songNames = new Array(songInputs.length)
    songInputs.forEach((input, i) => {
      // The or (||) statement covers the case for single uploads
      //const name = document.querySelector(`input[id="name_${input.id}"]`) || document.querySelector('#formSong')

      if (typeof input === "string") {
        songIds[i] = input
      } else {
        songIds[i] = input.name.replaceAll(/[#? ]/g, "")
      }

      //} else if (input.type.includes('audio')) {
      //  // This is the same name replacement that solar uses...
      //  // but this might end up being kind of fragile.

      //  // We use it to replace it with the ID of the event once
      //  // it has been signed
      //  songIds[i] = input.name.replaceAll(/[#? ]/g, "")
      //  //songNames[i] = name.value

      //} else if (input.type === "hidden") {
      //  // If the input type is hidden, it's the result of
      //  // our SongSelector. We grab the id and save it.
      //  songIds[i] = input.value
      //  songNames[i] = $postDictionary[input.value].content.name
      //}
    })

    console.log('data1', formOne)
    console.log('data2', formTwo)
    console.log('songIds', songIds)
    console.log('songs', songs.map(s => s.songName))

    let content = {
      name: undefined,
      audio: undefined,
      image: undefined,
      description: undefined,
      tags: undefined
    }

    const publish = (e) => {
      console.log('publishing event', e)
      publishEvent($relay, e)
      //$hyper.log.append(JSON.stringify(e))
    }

    // This is our function for uploading to a server
    const uploadToServer = async (formData) => {
      const pubKey = keys.publicKey
      const name = Object.keys($members.names).find(key => $members.names[key] === pubKey)
      const nonceRequest = await fetch(`http://solar.credenso.cafe/nonce?name=${name}`)
      const nonce = await nonceRequest.text()
      const signedNonce = schnorr.sign(bytesToHex(sha256(nonce)), keys.privateKey)
      const hexSig = b4a.toString(signedNonce, 'hex')

      formData.append('public_key', pubKey)
      formData.append('sig', hexSig)

      // First, we post all the form data
      fetch(`http://solar.credenso.cafe/upload?name=${name}`, {
      method: "POST",
      body: formData
      })
        .then(response => response.json()
          .then(async json => {

            // The json object that is returned by the /upload endpoint
            // is an array of unsigned events for the member to sign
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
              content.names = songs.map(s => s.songName) //songNames
            } else {
              // If there's only one audio file, drop the array
              content.audio = content.audio[0]
            }

            // Fill the rest of the data from the form
            content.name = formTwo.get('name');
            content.description = formTwo.get('desc');
            content.lyrics = formTwo.getAll('formLyrics');

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

    uploadToServer(formTwo)
    uploading = false
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
        hashableContext = ctx
      }
      fr.onload = draw
      fr.readAsDataURL(inputPic.files[0])
      hasImage = true

      // Does nothing right now
    });
  })

  const uploadType =  [
    'single',
    'collection'
  ]

  let value = ''
  let selectedUploadType = uploadType[0]
  let answer = ''

  let postTitle = undefined

  let contents = [undefined]
  let songs = []
  let selectedSong = 0

  const addContent = () => {
    contents = [...contents, undefined]
  }

  const removeContent = () => {
    contents = contents.slice(0, contents.length - 1)
  }

  const next = (e) => {
    e.preventDefault()

    // Here, we resize the original file upload to be more managable serverside
    const canvas = document.getElementById('imagePreview') 
    uploadedImage = canvas.toDataURL()
    const oldImage = document.getElementById('formPic')
    let resizedImage

    // Apparently everything has to go in the callback... janky
    canvas.toBlob((blob) => {
      resizedImage = new File([blob], oldImage.files[0].name, { type: oldImage.files[0].type })
      if (oldImage.files[0].size > resizedImage.size) {
        const dt = new DataTransfer()
        dt.items.add(resizedImage)
        oldImage.files = dt.files
      }

      formOne = new FormData(document.querySelector('form#partOne'))

      const iter = formOne.entries()
      let i = 0
      for (const d of iter) {
        console.log('d', d)
        if (d[0] === "song") {
          if (d[1].type?.includes('audio/')) {
            // This is an uploaded song
            console.log(d, 'is a songfile')
            const fileName = d[1].name.replaceAll(/[#? ]/g, "")
            const next = iter.next()
            console.log('next', next)
            if (next.done) break;
            const songName = next.value[1]
            console.log('givenName is', songName)
            console.log('fileName is', fileName)
            songs[i] = { songName, fileName }
          } else if (d[0] === "song") {
            // It's a linked post
            console.log('is a post')
            console.log(d[1])
            const songName = $postDictionary[d[1]].content.name
            songs[i] = { post_id: d[1], songName }
          }
          i += 1
        }
      }
      //console.log('songs', songs)
      //makeBlurhash(hashableContext)
      //console.log('next section')

      if (true || section === 1 && hasImage) {
        section = 2
      }
    })
  }

</script>

<div class="container">
  {#if section === 1}
    <form 
      id="partOne" 
      autocomplete="off" 
      on:submit|preventDefault={handleUpload}
      >
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
      <article class="post">
        <div class="box" class:collection={selectedUploadType === "collection"}>
          <div on:click={() => document.getElementById('formPic').click()} class="cameraIcon" class:hasImage>
            <img src="camera.svg" />
          </div>
          <div class="art">
            <!-- Could set the dimensions larger for higher quality images -->
            <canvas class:preview id="imagePreview" width=1080 height=1080 />
          </div>
          <section class="about">
            <div class="formEntry">
              <input type="text" id="formName" name="name" bind:value={postTitle} placeholder="Post title" />
            </div>
            <div class="artist">{$memberDictionary[keys?.publicKey]?.display_name}</div>
          </section>
        </div>
      </article> 
      <div class="formEntry hidden">
        <input type="file" accept="image/*" id="formPic" name="icon" />
      </div>
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

      <button class="continue" on:click={next}>Continue →</button>
    </form>
  {/if}
  <!-- Section 2 -->
  {#if section === 2}
    <form 
      id="partTwo" 
      autocomplete="off" 
      on:submit|preventDefault={handleUpload}
      >
      <p class="header">{postTitle}</p>
      <a class="subtitle"><img class="micro" src="{$contentDictionary[me?.avatar]?.url || "profile_photo.png"}"/> {me?.display_name || me?.name} - posted {new Date(Date.now()).toDateString()}</a> 

      <img class="dataImage" src="{uploadedImage}" />

      <div class="actions">
        <div class:activeTab={tab === "about"} on:click={() => tab = "about"}>About</div>
        {#if selectedUploadType === "collection"}
          <div class:activeTab={tab === "tracklist"} on:click={() => tab = "tracklist"}>Tracklist</div>
        {/if}
        {#if lyrics}
          <div class:activeTab={tab === "lyrics"} on:click={() => tab = "lyrics"}>Lyrics</div>
        {/if}
      </div>

      <div class="hidden" class:show={tab === "about"}>
        <textarea type="text" id="formDesc" name="desc" rows="5" placeholder="What do you want to tell people about this post?"/>
        <div class="formEntry">
          <input class="check" name="hasLyrics" type="checkbox" bind:checked={lyrics} />
          <label for="hasLyrics">Add lyrics?</label>
          <Tags bind:tags />
        </div>
      </div>
      <div class="hidden" class:show={tab === "lyrics"}>
        {#if lyrics && selectedUploadType === 'single'}
          <textarea 
            type="text" 
            name="formLyrics" 
            id="lyrics_formSong" 
            rows="5" 
            placeholder="What are the lyrics to {postTitle}?"/>
        {:else if lyrics}
          {#each songs as { songName, post_id }, i}
            {#if post_id === undefined}
              <div class="formEntry">
                <textarea 
                  type="text" 
                  name="formLyrics" 
                  id="lyrics_formSong{i}" 
                  rows="5" 
                  placeholder="What are the lyrics to {songs[i].songName}?"
                  />
              </div>
            {:else}
              <input 
                type="hidden" 
                name="formLyrics" 
                id="lyrics_formSong{i}" 
                value={$postDictionary[post_id]?.content?.lyrics || ""}
                />
            {/if}
          {/each}
        {/if}
      </div>
      <div class="hidden" class:show={tab === "tracklist"}>
        <table>
          {#each songs as { songName }, i}
            <tr 
              class:selected={ selectedSong === i } 
              on:click={() => selectedSong = i }
              >
              <td><b>{i+1}.</b></td>
              <td>{songName}</td>
            </tr>
          {/each}
        </table>
      </div>

      <input type="hidden" name="blurhash" value={blurhash} />

      <br/>
      {#if uploading}
        <button type="submit" disabled>Uploading...</button>
      {:else}
        <button type="submit">Upload</button>
      {/if}
    </form>
  {/if}
</div>


<style>
  select {
    background-color: transparent;
  }

  canvas {
    width: 100%;
    max-width: 600px;
    margin: auto;
  }

  #secondImagePreview {
    width: 90%;
    max-width: 25em;
    border-radius: 0.5em;
    margin: 1em auto;
  }

  h1 {
    font-size: 1.5em;
    font-weight: bold;
  }

  hr {
    margin: 1em;
  }

  .container {
    background: #FFFFFF;
    border-radius: 1.5em;
    padding: 0.5em;
    height: 100%;
  }

  form {
    width: 20em;
    margin: auto;
  }

  .header {
    font-size: 1.5em;
  }

  #formName {
    text-align: center;
    font-weight: bold;
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
    justify-content: center;
    margin: auto;
    gap: 1em;
  }

  .formEntry * {
    flex-grow: 1;
  }

  .formEntry label {
    font-weight: bold;
    flex-grow: 0;
  }

  .formEntry input, textarea {
    margin: 0.5em auto;
  }

  .formEntry input.check {
    flex-grow: 0;
    width: unset;
    margin: 0;
  }

  .dataImage {
    margin: auto;
    width: 20em;
    height: 20em;
    border-radius: 1em;
  }

  .hidden {
    display: none;
  }

  .hidden.preview {
    display: block;
  }

  .show {
    display: block;
  }

  img {
    object-fit: cover;
    width: 100%;
    height: 16em;
  }

  .cameraIcon {
    position: absolute;
    background: #EEEEEE55;
    top: 0;
    left: 0;
    width: 100%;
    opacity: 1;
    transition: all 0.2s ease-in-out;
  }

  .cameraIcon img {
    padding: 5em;
    object-fit: contain;
  }

  .hasImage {
    opacity: 0;
  }

  .post {
    position: relative;
    z-index: 10;
    min-width: min(70vw, 20em);
    max-width: min(70vw, 20em);
    margin: 1em auto;
    transition: all 0.2s;
    padding-left: 1.25rem;
    padding-right: 1.25rem;
    border-radius: .375rem;
  }

  .about {
    margin: 0.25em;
  }

  .box {
    display: flex;
    position: relative;
    height: 100%;
    width: 100%;
    overflow: hidden;
    border-radius: .375rem;
    border-width: 2px;
    background-color: #FFFFFF;
    flex-direction: column;
    justify-content: space-between;
    padding-bottom: 0.5rem;
    border: 5px solid #f8a147;
  }

  .collection {
    border: 5px solid #028a9b;
  }

  img.micro {
    border-radius: 50%;
    display: inline;
    height: 1rem;
    width: 1rem;
    margin: 0;
  }

  .author {
    color: #028a9b;
    text-decoration: unset;
    text-align: right;
    display: block;
    padding: 0.5em;
  }

  .description {
    padding: 0.5em;
  }

  .actions {
    display: flex;
    flex-direction: row;
    max-width: 15em;
    margin: auto;
    justify-content: space-between;
  }

  .activeTab {
    font-weight: bold;
    text-decoration: underline;
  }

  .header {
    font-family: "Comfortaa";
    font-size: 1.3em;
    font-weight: bold;
  }

  .subtitle {
    font-family: "Comfortaa";
    font-size: 0.8em;
  }

  table {
    width: 100%;
    max-width: 20em;
    margin: auto;
  }

  tr {
    text-align: left;
    background: #DDDDEE;
  }

  tr:nth-child(even) {
    background: #EEEEEE;
  }

  tr.selected {
    background: #AACCFF;
  }

  .btn {
    cursor: pointer;
    padding: 0.5em;
    margin: 0.5em auto;
    border: 1px solid;
    border-radius: 1em;
    max-width: 30em;
    flex-grow: 0;
  }
</style>
