<script>
  import KeyEditor from './KeyEditor.svelte'
  import { 
    initRelay,
    RELAY_URL,
    genKeys,
    newProfileEvent,
    newContactsEvent,
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
    members,
    contacts,
    chats,
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
  $: invalid = ($members.names && $members.names[metadata?.username] !== undefined)
  let posts = []
  let following = undefined
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

  const hyperImage = async (id) => {
    const event = $contentDictionary[id]
    const mime = event.tags.find(t => t[0] === "m")[1]
    const content = await $hyper.drive.get(event.content)
    if (await content) {
      return `data:${mime};base64,${b4a.toString(content, 'base64')}`
    } else {
      return undefined
    }
  }

  const updateAvatar = async (profile) => {
    if (profile?.avatar) {
      const address = $contentDictionary[profile.avatar].url
      if (address) {
        const path = address.split('/')
        const filename = path[path.length - 1]
        const hyperfile = await $hyper.drive.exists(filename)
        if (hyperfile) {
          console.log('avatar hyperfile', hyperfile)
          avatar = await hyperImage(profile.avatar)
        } else {
          avatar = address
        }
      }
    }
  }

  const updateBanner = async (profile) => {
    if (profile?.banner) {
      const address = $contentDictionary[profile.banner].url
      if (address) {
        const path = address.split('/')
        const filename = path[path.length - 1]
        const hyperfile = await $hyper.drive.exists(filename)
        if (hyperfile) {
          console.log('banner hyperfile', hyperfile)
          banner = `url(${await hyperImage(profile.banner)})`
        } else {
          banner = `url(${address})`
        }
      }
    }
  }

  // Not great
  contentDictionary.subscribe(async dict => {
    window.setTimeout(() => {
      updateAvatar(metadata)
      updateBanner(metadata)
    }, 100)
  })

  contacts.subscribe(list => {
    following = list?.find(contact => { return profile && contact[1] === profile })
  })
  // Probably shouldn't be for active user?
  activeUser.subscribe(async id => {
    profile = id
    metadata = $userDictionary[id] || { name: "NPC" }
    following = $contacts.find(contact => { return profile && contact[1] === profile })

    if (metadata && metadata.station === undefined) {
      metadata.station = 'solar.credenso.cafe'
    }

    posts = Object.keys($postDictionary)
      .filter(post_id => $postDictionary[post_id].pubkey === id)

    updateAvatar(metadata)
    updateBanner(metadata)
  })

  const handleChat = (e) => {
    $modal = "direct"
  }

  const handleFollow = (e) => {
    console.log('I want to hear from this person')
    const follow = ["p",profile,`wss://${metadata.station}`, metadata.username]
    let newContacts

    if ($contacts.length < 1) {
      newContacts = [follow] 
    } else {
      newContacts = [...$contacts, follow]
    }

    $contacts = newContacts
    const ev = newContactsEvent($keys.publicKey, $contacts)
    const signed = signEvent(ev, $keys.privateKey)
    publish(signed)
  }

  const handleUnfollow = (e) => {
    console.log('I no longer want to hear from this person')
    $contacts = $contacts.filter(contact => { return contact[1] && contact[1] !== profile })
    const ev = newContactsEvent($keys.publicKey, $contacts)
    const signed = signEvent(ev, $keys.privateKey)
    publish(signed)
  }

  const imageFromPost = (id) => {
    const imgID = $postDictionary[id].content.image
    return $contentDictionary[imgID].url
  }

  const publish = (e) => {
    publishEvent($relay, e)

    // TODO: Reintegrate Hyperdrive
    //$hyper.log.append(JSON.stringify(e))
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
      formData.delete('avatar')
    }

    if (formData.get('banner').name === "") {
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

      // TODO: Reintegrate Hyperdrive
      //// This uploads a copy of all the files to our hyperdrive
      //await Promise.all(Array.from(files).map(async f => {
      //  const fileBuffer = await f.arrayBuffer()
      //  await $hyper.drive.put(f.name.replaceAll(/[#? ]/g, ""), fileBuffer)
      //}))

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
    metadata.username = metadata.username.toLowerCase()
    if (metadata.name === "NPC") {
      metadata.name = metadata.username
    }

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
  {#if editable && metadata.nip05 }
    <button class="editButton" on:click={() => editing = !editing}>✏️</button>
  {/if}
  {#if editing}
    <form on:submit|preventDefault={save}>
      <input type="hidden" name="pubkey" value={$keys.publicKey} />
        <div class="banner formEntry" style={`background-image: ${banner || "inherit"}`} >
        <img class="pic" src="{ avatar || "profile_photo.png" }" alt="default profile picture" />
        <input class="name" type="text" name="name" id="name" bind:value={metadata.name} />
        {#if metadata.nip05}
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
        <tr on:click={() => identityMenu = false && !identityMenu}>
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
          <input class:invalid type="text" id="username" bind:value={metadata.username} />
        </div>
        <div class="formEntry">
          <label for="station">Station.</label>
          <input type="text" id="station" bind:value={metadata.station} disabled/>
        </div>
        {#if metadata?.nip05 === undefined}
          <button on:click={register}>Register</button>
        {/if}
      </div>
      <div class="formEntry">
        <label for="bio">Bio.</label>
        <textarea type="text" id="bio" placeholder="A bit about me..." bind:value={metadata.bio} />
      </div>
      <div class="formEntry">
        <label for="site">Site.</label>
        <input type="url" id="site" placeholder="https://myhome.page" bind:value={metadata.site} />
      </div>
      <hr>
      <button type="submit">Save</button>
    </form>
  {:else}
    <div class="banner" style={`background-image: ${banner || "inherit"}`} >
      <img class="pic" src="{ avatar || "profile_photo.png" }" alt="profile picture" />
      <b class="name">{metadata.name}</b>
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
      {#if metadata.site}
        <tr>
          <td>🌐</td>
          <td><a target="_blank" href="{metadata.site}">{metadata.site}</a></td>
        </tr>
      {/if}
    </table>
    {#if metadata.bio}
      <blockquote>{metadata.bio}</blockquote>
    {/if}
    {#if $activeUser !== $keys.publicKey}
      <div class="actions">
        <button on:click={handleChat}>Chat</button>
        {#if following}
          <button on:click={handleUnfollow}>Unfollow</button>
        {:else}
          <button on:click={handleFollow}>Follow</button>
        {/if}
      </div>
    {:else if metadata.nip05 === undefined}
      <b>Register Here</b>
      <div class="formEntry">
        <label for="username">Username.</label>
        <input class:invalid type="text" id="username" bind:value={metadata.username} />
      </div>
      <p class="warning" class:invalid>{metadata.username === "" ? "Add a username" : "Username taken"}</p>
      <div class="formEntry">
        <label for="station">Station.</label>
        <input type="text" id="station" bind:value={metadata.station} disabled/>
      </div>
      <div class="actions">
        <button on:click={register}>Register</button>
      </div>
    {/if}
    {#if posts.length > 0}
      <hr>
      <p class="recent">Recent Posts</p>
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
    background: #EEEEEE;
    max-width: 100%;
    border-radius: 0.5em;
    margin-top: 0.5em;
  }

  td {
    text-align: left;
    max-width: min(32em, 66vw);
    padding-right: 0.5em;
    padding-left: 0.5em;
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

  .formEntry input,textarea {
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
    margin: 1em;
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

  .warning {
    display: none;
    font-size: 0.7em;
    color: red;
  }

  .warning.invalid {
    display: block
  }

  input.invalid {
    border: 2px solid red;
  }

  input#username {
    text-transform: lowercase;
  }

  blockquote {
    margin: 0.5em;
    color: #333333;
    text-align: left;
  }

  .recent {
    font-size: 1.2em;
    font-weight: bold;
    text-align: left;
    margin: 1rem;
    margin-bottom: 0;
  }
</style>
