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
    memberDictionary, 
    postDictionary, 
    contentDictionary, 
    activeMember,
    keys, 
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
  import { bytesToHex } from '@noble/hashes/utils';
  import { sha256 } from '@noble/hashes/sha256';



  import { onMount } from 'svelte'

  $: editable = ($keys.publicKey === $activeMember)
  let editing = false
  let keyMenu = false
  let picMenu = false
  let identityMenu = false

  export let profile = undefined
  export let invite = undefined

  let metadata = {}
  $: invalid = ($members.names && $members.names[metadata?.name] !== undefined)
  let posts = []
  let following = undefined
  let saving

  let files = []
  let avatar = undefined
  let banner = undefined

  modal.subscribe(m => {
    // Modal closed
    if (m === undefined) {
      $activeMember = undefined
      avatar = undefined
      banner = undefined
      metadata = undefined
      saving = false
    }
  })

  const updateAvatar = async (profile) => {
    if (profile?.avatar) {
      const address = $contentDictionary[profile.avatar]?.url
      if (address) {
        const path = address.split('/')
        const filename = path[path.length - 1]
        avatar = address
      }
    }
  }

  const updateBanner = async (profile) => {
    if (profile?.banner) {
      const address = $contentDictionary[profile.banner]?.url
      if (address) {
        const path = address.split('/')
        const filename = path[path.length - 1]
        banner = `url(${address})`
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
  // Probably shouldn't be for active Member?
  activeMember.subscribe(async id => {
    profile = id
    metadata = $memberDictionary[id] || { display_name: "NPC" }
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
    const follow = ["p",profile,`wss://${metadata.station}`, metadata.name]
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
  }

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

      // TODO: This pattern shows up enough times to encapsulate it
      const pubKey = $keys.publicKey
      const name = Object.keys($members.names).find(key => $members.names[key] === pubKey)
      const nonceRequest = await fetch(`http://solar.credenso.cafe/nonce?name=${name}`)
      const nonce = await nonceRequest.text()
      const signedNonce = schnorr.sign(bytesToHex(sha256(nonce)), $keys.privateKey)
      const hexSig = b4a.toString(signedNonce, 'hex')

      formData.append('public_key', pubKey)
      formData.append('sig', hexSig)

      // Here's an upload to the station
      const response = await fetch(`http://solar.credenso.cafe/upload?name=${name}`, {
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

  const register = async (e) => {
    e.preventDefault()
    metadata.name = metadata.name.toLowerCase()
    if (metadata.display_name === "NPC") {
      metadata.display_name = metadata.name
    }

    if (invite && metadata?.nip05 === undefined ) {
      const pubKey = $keys.publicKey
      console.log('invite', invite)
      const signedInvite = schnorr.sign(bytesToHex(sha256(invite.code)), $keys.privateKey)
      const hexSig = b4a.toString(signedInvite, 'hex')

      // TODO: Adapt this to other domain names
      const results = await fetch(`http://solar.credenso.cafe/register?name=${metadata.name}`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain"
        },
        body: JSON.stringify({ pubKey, hexSig, invite })
      })

      console.log('registration complete')
      const json_keys = JSON.parse(await results.text())
      metadata.nip05 = `${json_keys.name}@${json_keys.station}`

      let profileEvent = newProfileEvent(metadata, $keys.publicKey)
      profileEvent = signEvent(profileEvent, $keys.privateKey)
      publish(profileEvent)
    }
  }

  const inputImageListeners = () => {
    if (editing) {
      window.setTimeout(() => {
        const avatarInput = document.getElementById('avatar')
        avatarInput.addEventListener('input', () => {
          const imageFile = avatarInput.files[0]
          const reader = new FileReader()
          reader.addEventListener(
            'load',
            () => {
              avatar = reader.result
            },
            false,
          );

          if (imageFile.size < 1000000) {
            reader.readAsDataURL(imageFile);
          } else {
            alert("avatar file size must stay under 1MB")
          }
        })

        const bannerInput = document.getElementById('banner')
        bannerInput.addEventListener('input', () => {
          const imageFile = bannerInput.files[0]
          const reader = new FileReader()
          reader.addEventListener(
            'load',
            () => {
              banner = `url(${reader.result})`
            },
            false,
          );

          if (imageFile.size < 1000000) {
            reader.readAsDataURL(imageFile);
          } else {
            alert("banner file size must stay under 1MB")
          }
        })
      }, 100)
    }
  }

  $: editing, inputImageListeners()
</script>

{#if metadata}
  {#if editable && metadata.nip05 }
    <button class="editButton" on:click={() => editing = !editing}>✏️</button>
  {/if}
  {#if editing}
    <form on:submit|preventDefault={save}>
      <input type="hidden" name="pubkey" value={$keys.publicKey} />
      <div on:click={() => document.getElementById('banner').click()} class="banner formEntry" style={`background-image: ${banner || "inherit"}`} >
        <img on:click={() => document.getElementById('avatar').click()} class="pic" src="{ avatar || "profile_photo.png" }" alt="default profile picture" />
        <input class="display_name" type="text" name="display_name" id="display_name" bind:value={metadata.display_name} />
      </div>
      <div class="hidden">
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
          <td class="mono" name="pubkey">{$activeMember}</td>
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
          <label for="name">Name.</label>
          <input class:invalid type="text" id="name" bind:value={metadata.name} />
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
        <input type="url" id="site" placeholder="https://myhome.page" bind:value={metadata.website} />
      </div>
      <hr>
      <button type="submit">Save</button>
    </form>
  {:else}
    <div class="banner" style={`background-image: ${banner || "inherit"}`} >
      <img class="pic" src="{ avatar || "profile_photo.png" }" alt="profile picture" />
      <b class="name">{metadata.display_name}</b>
    </div>
    <table>
      <tr>
        <td>🔑</td>
        <td class="mono">{$activeMember}</td>
      </tr>
      <tr>
        <td>📡</td>
        <td>{metadata.nip05 || '[unregistered]' }</td>
      </tr>
      {#if metadata.website}
        <tr>
          <td>🌐</td>
          <td><a target="_blank" href="{metadata.website}">{metadata.website}</a></td>
        </tr>
      {/if}
    </table>
    {#if metadata.bio}
      <blockquote>{metadata.bio}</blockquote>
    {/if}
    {#if $activeMember !== $keys.publicKey}
      <div class="actions">
        <button on:click={handleChat}>Chat</button>
        {#if following}
          <button on:click={handleUnfollow}>Unfollow</button>
        {:else}
          <button on:click={handleFollow}>Follow</button>
        {/if}
      </div>
    {:else if invite.code && metadata.nip05 === undefined}
      <b>Register Here</b>
      <div class="formEntry">
        <label for="name">Name.</label>
        <input class:invalid type="text" id="name" bind:value={metadata.name} />
      </div>
      <p class="warning" class:invalid>{metadata.name === "" ? "Add a name" : "Name taken"}</p>
      <div class="formEntry">
        <label for="station">Station.</label>
        <input type="text" id="station" bind:value={metadata.station} disabled/>
      </div>
      <input type="hidden" id="invite" bind:value={invite.code} disabled/>
      <div class="actions">
        <button on:click={register}>Register</button>
      </div>
    {/if}
    {#if posts.length > 0}
      <hr>
      <p class="recent">Recent Posts</p>
      <div class="posts">
        {#each posts.slice(0,10) as id (id)}
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
    width: 100%;
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
    max-width: 72px;
    height: 72px;
    object-fit: cover;
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

  input#name {
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
