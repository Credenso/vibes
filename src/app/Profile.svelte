<script>
  import { onMount } from 'svelte'
  import { 
    initRelay,
    RELAY_URL,
    genKeys,
    newProfileEvent,
    publishEvent
  } from '../lib/nostr'
  import { userDictionary, keys, relay } from '../lib/stores'

  // For hashing the privateKey
  import b4a from 'b4a'
  import { schnorr } from '@noble/curves/secp256k1';

  export let profile

  let pro = false
  let saving = false
  let modalOpen = false

  const openProfile = () => {
    modalOpen = true
  }

  const closeProfile = () => {
    modalOpen = false
  }

  const newKeys = () => {
    let { sk, pk } = genKeys();
    $keys.publicKey = pk
    $keys.privateKey = sk
  }

  const saveKeys = () => {
    if ($keys.publicKey && $keys.privateKey) {
      window.localStorage.setItem('vibes_public_key', $keys.publicKey)
      window.localStorage.setItem('vibes_private_key', $keys.privateKey)
    }
  }

  const saveProfile = async (metadata) => {
    saving = true
    if (metadata.isArtist && metadata.drive === undefined) {
      console.log("making a Solar drive")
      const pubKey = $keys.publicKey
      const sigArray = schnorr.sign(pubKey, $keys.privateKey)
      const verified = schnorr.verify(sigArray, pubKey, pubKey)
      const sig = b4a.toString(sigArray, 'hex')

      // This will be a request to the Solar server they specify
      const key = await fetch("http://solar.credenso.cafe/register", {
        method: "POST",
        headers: {
          "Content-Type": "text/plain"
        },
        body: JSON.stringify({ pubKey, sig })
      })
      console.log('registration complete')
      metadata.drive = await key.text()
      console.log('drive', metadata.drive)
    }
    let profileEvent = newProfileEvent(metadata, $keys.publicKey, $keys.privateKey)
    publishEvent($relay, profileEvent)
      .then(res => {
        saving = false
        closeProfile()
      })
  }
</script>

<img on:click={openProfile} src="profile_photo.png" alt="profile" />

<div on:click={closeProfile} class:modalOpen class="overlay"></div>

<div class:modalOpen class="modal">
  <b class="header">Profile Information</b>
  <form>
    <div class="formEntry">
      <label for="name">Name. </label>
      <input type="text" id="name" bind:value={profile.name} />
    </div>
    <div class="formEntry">
      <label for="site">Site. </label>
      <input type="text" id="site" placeholder="https://solar.credenso.cafe" bind:value={profile.site} />
    </div>
    <div class="formEntry">
      <label for="artist">I want to publish content!</label>
      <input type="checkbox" id="artist" bind:checked={profile.isArtist} />
    </div>
    {#if profile.isArtist}
      <div class="formEntry">
        <label for="system">System.</label>
        <input type="text" id="site" placeholder="https://solar.credenso.cafe" bind:value={profile.solarServer} />
      </div>
      {#if profile.solarKey}
        <div class="formEntry">
          <label for="key">Solar Key. </label>
          <input type="text" id="key" bind:value={profile.solarKey} disabled />
        </div>
      {/if}
    {/if}
  </form>
  {#if saving}
    <button disabled>Saving...</button>
  {:else}
    <button on:click={() => saveProfile(profile)}>Save Profile</button>
  {/if}
  <hr>
  <details>
    <summary>Identity / Login</summary>
    <input type="checkbox" id="pro" bind:checked={pro} />
    <label for="pro">I know what I'm doing.</label>
    <br>
    {#if pro}
      <div class="formEntry">
        <label for="pk">Public Key</label>
        <input type="text" id="pk" value="{$keys.publicKey}" />
        <br>
      </div>
      <div class="formEntry">
        <label for="sk">Private Key</label>
        <input type="text" id="sk" value="{$keys.privateKey}" />
      </div>
      <button on:click={newKeys}>Generate New Keys</button>
      <button on:click={saveKeys}>Save</button>
    {:else}
      <div class="formEntry">
        <label for="pk">Public Key</label>
        <input type="text" id="pk" value="{$keys.publicKey}" disabled/>
        <br>
      </div>
      <div class="formEntry">
        <label for="sk">Private Key</label>
        <input type="text" id="sk" value="{$keys.privateKey}" disabled/>
      </div>
    {/if}
  </details>
</div>

<style>
  img {
    position: absolute;
    top: 0;
    right: 0;
    margin: 1em;
    width: 3em;
  }

  button {
    padding: 0.5em;
    margin: 0.5em auto;
    border: 1px solid;
  }

  input {
    background-color: #EEEEEE;
    border-radius: 1em;
    padding: 0.5em;
  } 

  hr {
    margin: .5em;
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

  .overlay {
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: black;
    z-index: 200;
    transition: all 0.3s ease-in-out;
  }

  .header {
    font-size: 1.5em;
  }

  .modal {
    display: block;
    background: white;
    position: absolute;
    overflow: hidden;
    opacity: 0;
    width: 90vw;
    height: 0;
    border-radius: 1em;
    top: 10vh;
    left: 5vw;
    box-shadow: 0 0 10em 0.5em;
    z-index: 201;
    transition: all 0.3s ease-in-out;
  }

  .modalOpen.modal {
    opacity: 1;
    height: 80vh;
    padding: 2em;
  }

  .modalOpen.overlay {
    display: block;
    opacity: 0.3;
  }
</style>
