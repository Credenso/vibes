<script>
  import KeyEditor from './KeyEditor.svelte'
  import { onMount } from 'svelte'
  import { 
    initRelay,
    RELAY_URL,
    genKeys,
    newProfileEvent,
    signEvent,
    publishEvent
  } from '../lib/nostr'

  import { 
    userDictionary, 
    postDictionary, 
    contentDictionary, 
    activeUser,
    keys, 
    hyper, 
    modal, 
    relay 
  } from '../lib/stores'

  import Post from './Post.svelte'

  // For hashing the privateKey
  import b4a from 'b4a'
  import { schnorr } from '@noble/curves/secp256k1';

  $: editable = ($keys.publicKey === $activeUser)
  let editing = false
  let keyMenu = false
  let picMenu = false
  let identityMenu = false

  export let profile = undefined
  let metadata = {}
  let posts = []
  let saving

  let files = []
  let avatar = undefined
  let banner = undefined

  modal.subscribe(m => {
    // Modal closed
    if (m === undefined) {
      $activeUser = undefined
      avatar = undefined
      banner = undefined
      metadata = undefined
      saving = false
    }
  })

  const updateAvatar = async (profile) => {
    if (profile?.avatar) {
      const address = $contentDictionary[profile.avatar]
      if (address) {
        const path = address.split('/')
        const filename = path[path.length - 1]
        const hyperfile = await $hyper.drive.get(filename)
        if (hyperfile) {
          console.log('avatar hyperfile', hyperfile)
          avatar = hyperImage(hyperfile)
        } else {
          console.log('avatar address: ', address)
          avatar = address
        }
      }
    }
  }

  const updateBanner = async (profile) => {
    if (profile?.banner) {
      const address = $contentDictionary[profile.banner]
      if (address) {
        const path = address.split('/')
        const filename = path[path.length - 1]
        const hyperfile = await $hyper.drive.get(filename)
        if (hyperfile) {
          console.log('banner hyperfile', hyperfile)
          banner = `url(${hyperImage(hyperfile)})`
        } else {
          console.log('banner address: ', address)
          banner = `url(${address})`
        }
      }
    }
  }

  contentDictionary.subscribe(async dict => {
    updateAvatar(metadata)
    updateBanner(metadata)
  })

  // Probably shouldn't be for active user?
  activeUser.subscribe(async id => {
    profile = id
    metadata = $userDictionary[id] || { name: "NPC" }

    if (metadata && metadata.station === undefined) {
      metadata.station = 'solar.credenso.cafe'
    }

    if (metadata && metadata.username === "" || metadata.username === undefined) {
      metadata.username = metadata?.name.toLowerCase()
    }

    posts = Object.keys($postDictionary)
      .filter(post_id => $postDictionary[post_id].pubkey === id)

    updateAvatar(metadata)
    updateBanner(metadata)
  })

  const handleChat = (e) => {
    console.log('gonna chat! (eventually)')
  }

  const handleFollow = (e) => {
    console.log('I want to hear from this person')
  }

  const imageFromPost = (id) => {
    const imgID = $postDictionary[id].content.image
    return $contentDictionary[imgID]
  }

  // TODO: Make this work
  const hyperImage = async (content) => {
    if (content) {
      return URL.createObjectURL(new Blob([content.buffer]))
    } else {
      return undefined
    }
  }

  const publish = (e) => {
    publishEvent($relay, e)
    $hyper.log.append(JSON.stringify(e))
  }

  // This function pushes the modified profile data to the 
  // station and the hyperlog
  const save = async (e) => {
    e.preventDefault()
    saving = true
    editing = false
    const formData = new FormData(e.currentTarget)

    // We remove the empty files so they don't get posted
    // TODO: fix the crash on uploading an empty file
    if (formData.get('avatar').name === "") {
      console.log('removing avatar')
      formData.delete('avatar')
    }

    if (formData.get('banner').name === "") {
      console.log('removing banner')
      formData.delete('banner')
    }

    // If there are files, upload them
    if (files.length > 0) {

      // Here's an upload to the station
      const response = await fetch("http://solar.credenso.cafe/upload", {
        method: "POST",
        body: formData
      })

      const json = await response.json()

      // This function signs and publishes every event object created
      // by the solar station
      const events = await Promise.all(json.map(async event => {
        const mimetype = event.tags.find(tag => tag[0] === "m")[1]
        const e = signEvent(event, $keys.privateKey)

        publish(e)

        return e
      }))

      // This uploads a copy of all the files to our hyperdrive
      await Promise.all(Array.from(files).map(async f => {
        const fileBuffer = await f.arrayBuffer()
        await $hyper.drive.put(f.name.replaceAll(/[#? ]/g, ""), fileBuffer)
      }))

      // Make sure the filepath is just a name
      if (metadata?.avatar?.includes('fakepath')) {
        metadata.avatar = metadata.avatar.replace(/.*[\/\\]/, '').replaceAll(/[#? ]/g, "")
      }

      if (metadata?.banner?.includes('fakepath')) {
        metadata.banner = metadata.banner.replace(/.*[\/\\]/, '').replaceAll(/[#? ]/g, "")
      }

      // Replace the file name with the ID of the content post
      const newAvatar = events.find(e => e.content === metadata.avatar)
      if (newAvatar) {
        metadata.avatar = newAvatar.id
      }

      const newBanner = events.find(e => e.content === metadata.banner)
      if (newBanner) {
        metadata.banner = newBanner.id
      }
    }

    console.log('metadata', metadata)

    let profileEvent = newProfileEvent(metadata, $keys.publicKey)
    profileEvent = signEvent(profileEvent, $keys.privateKey)

    console.log('publishing', profileEvent)
    publish(profileEvent)
    saving = false
  }


  // This function connects the current Hypercore session to the
  // 
  const register = async (e) => {
    e.preventDefault()
    if (metadata?.nip05 === undefined ) {
      const getNonce = await fetch(`http://solar.credenso.cafe/register?username=${metadata.username}`)
      const nonce = await getNonce.text()
      const pubKey = $keys.publicKey
      const signedNonce = schnorr.sign(nonce, $keys.privateKey)
      const hexSig = b4a.toString(signedNonce, 'hex')

      // This will be a request to the Solar server they specify
      const results = await fetch(`http://solar.credenso.cafe/register?username=${metadata.username}`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain"
        },
        body: JSON.stringify({ pubKey, hexSig })
      })

      console.log('registration complete')
      const json_keys = JSON.parse(await results.text())
      metadata.drive = json_keys.driveKey
      metadata.log = json_keys.logKey
      metadata.nip05 = json_keys.nip05

      let profileEvent = newProfileEvent(metadata, $keys.publicKey)
      profileEvent = signEvent(profileEvent, $keys.privateKey)
      publish(profileEvent)
    }
  }
</script>

{#if metadata}
  {#if editable}
    <button class="editButton" on:click={() => editing = !editing}>✏️</button>
  {/if}
  {#if editing}
    <form on:submit|preventDefault={save}>
      <input type="hidden" name="pubkey" value={$keys.publicKey} />
        <div class="banner formEntry" style={`background-image: ${banner || "inherit"}`} >
        <img class="pic" src="{ avatar || "profile_photo.png" }" alt="default profile picture" />
        <input class="name" type="text" name="name" id="name" bind:value={metadata.name} />
        {#if metadata.log}
        <span class="editPic" on:click={() => picMenu = !picMenu}>📷</span>
        {/if}
      </div>
      <div class="hidden" class:picMenu>
        <div class="formEntry">
          <label for="avatar">Avatar</label>
          <input type="file" id="avatar" name="avatar" bind:files bind:value={metadata.avatar} />
        </div>
        <div class="formEntry">
          <label for="banner">Banner</label>
          <input type="file" id="banner" name="banner" bind:files bind:value={metadata.banner} />
        </div>
      </div>
      <table>
        <tr on:click={() => keyMenu = !keyMenu }>
          <td>🔑</td>
          <td class="mono" name="pubkey">{$activeUser}</td>
        </tr>
      </table>
      <div class="hidden" class:keyMenu>
        <KeyEditor />
      </div>
      <table>
        <tr on:click={() => identityMenu = !identityMenu}>
          <td>📡</td>
          <td>{metadata.nip05 || '[unregistered]' }</td>
        </tr>
      </table>
      <div class="hidden" class:identityMenu>
        {#if metadata?.nip05 === undefined }
          <b>Register Here</b>
        {/if}
        <div class="formEntry">
          <label for="username">Username.</label>
          <input type="text" id="username" bind:value={metadata.username} />
        </div>
        <div class="formEntry">
          <label for="station">Station.</label>
          <input type="text" id="station" bind:value={metadata.station} disabled/>
        </div>
        {#if metadata?.nip05 === undefined }
          <button on:click={register}>Register</button>
        {/if}
      </div>
      <hr>
      <button type="submit">Save</button>
    </form>
  {:else}
    <div class="banner" style={`background-image: ${banner || "inherit"}`} >
      <img class="pic" src="{ avatar || "profile_photo.png" }" alt="default profile picture" />
      <b class="name">{metadata.name}{(metadata.name !== "NPC" && metadata.log === undefined) ? " (NPC)" : ""} </b>
    </div>
    <table>
      <tr>
        <td>🔑</td>
        <td class="mono">{$activeUser}</td>
      </tr>
      <tr>
        <td>📡</td>
        <td>{metadata.nip05 || '[unregistered]' }</td>
      </tr>
    </table>
    {#if $activeUser !== $keys.publicKey}
      <div class="actions">
        <button on:click={handleChat}>Chat</button>
        <button on:click={handleFollow}>Follow</button>
      </div>
    {/if}
    <hr>
    <p>Recent Posts</p>
    <div class="posts">
    {#each posts.reverse() as id (id)}
      <Post
        postId="{id}"
        image="{imageFromPost(id)}"
        form="short"
        />
    {/each}
    </div>
  {/if}
{/if}

<style>
  form button {
    border: 1px solid black;
    border-radius: 0.5em;
    padding: 0.5em;
  }

  .editButton {
    position: absolute;
    top: 0;
    right: 0;
    margin: 0.7em;
  }

  hr {
    margin: 0.5em;
  }

  table {
    max-width: 100%;
  }

  td {
    text-align: left;
    max-width: 80%;
    padding-right: 0.5em;
    overflow: hidden;
  }

  .banner {
    background-color: grey;
    background-size: cover;
    background-position: center center;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    min-height: 4em;
    border-radius: 0.5em;
    padding: 1em;
  }

  .hidden {
    display: none;
  }

  .keyMenu, .picMenu, .identityMenu {
    display: block;
  }

  .editPic {
    position: relative;
    align-self: end;
    background-color: #EEEEEE;
    border-radius: 0.25em;
    padding-left: 3px;
    padding-right: 3px;
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
    background-color: #EEEEEE;
    border-radius: 1em;
    padding: 0.5em;
    margin: 0.5em;
  } 

  .pic {
    box-shadow: 0px 0px 5px black;
    border-radius: 50%;
    width: 72px;
    height: 72px;
  }

  .actions {
    display: flex;
    flex-direction: row;
    justify-content: center;
    gap: 1em;
  }

  .actions button {
    border: 1px solid black;
    border-radius: 0.5em;
    padding: 1em;
    padding-top: 0.5em;
    padding-bottom: 0.5em;
  }

  .name {
    font-size: 1.8em;
    flex-grow: 1;
    width: 100%;
    color: white;
    text-shadow: 0px 0px 5px black;
    text-align: left;
    padding-left: 0.5em;
  }

  table {
    border-spacing: 0;
  }

  .mono {
    font-family: monospace;
  }
</style>
