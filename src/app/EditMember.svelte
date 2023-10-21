<script>
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
    relay 
  } from '../lib/stores'

  import Post from './Post.svelte'

  // For hashing the privateKey
  import b4a from 'b4a'
  import { schnorr } from '@noble/curves/secp256k1';

  let profile = undefined
  let posts = []
  let edit = false


  activeUser.subscribe(id => {
    profile = $userDictionary[id]
    posts = Object.keys($postDictionary)
      .filter(post_id => $postDictionary[post_id].pubkey === id)
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

  let saving = false

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
    //if (metadata.isArtist && metadata.drive === undefined) {
    if (metadata.isArtist) {
      console.log("making a Solar drive")
      const sessionKey = b4a.toString($hyper.log.key, 'hex')
      const pubKey = $keys.publicKey
      const sigArray = schnorr.sign(sessionKey, $keys.privateKey)
      // const verified = schnorr.verify(sigArray, sessionKey, pubKey)
      const sig = b4a.toString(sigArray, 'hex')

      // This will be a request to the Solar server they specify
      const results = await fetch("http://solar.credenso.cafe/register", {
        method: "POST",
        headers: {
          "Content-Type": "text/plain"
        },
        body: JSON.stringify({ pubKey, sig, sessionKey })
      })
    }
  }
</script>

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
    <button on:click={() => {
            console.log('click!')
            console.log('core', $hyper.log)
            $hyper.log.append("it kinda work tho")
            }}>Hypercore</button>
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
{/if}
{#if profile}
  <button on:click={() => edit = !edit}>Edit</button>
  <div class="banner">
    <img class="pic" src="profile_photo.png" alt="default profile picture" />
    <b class="name">{profile.name}</b>
  </div>
  <p class="pk">🔑 <span class="key">{$activeUser}</span></p>
  <div class="actions">
    <button on:click={handleChat}>Chat</button>
    <button on:click={handleFollow}>Follow</button>
  </div>
  <hr>
  <p>Recent Posts</p>
  {#each posts as id (id)}
    <Post
      postId="{id}"
      image="{imageFromPost(id)}"
      form="short"
      />
  {/each}
{/if}

<style>
  hr {
    margin: 0.5em;
  }

  .banner {
    background-image: url('https://zenen.space/assets/bg-a54d08cc.jpg');
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

  .post {
    display: flex;
    flex-direction: row;
    height: 5em;
    background: #EEEEEE;
    border-radius: 0.5em;
    margin: 0.5em;
  }

  .post img {
    border-radius: 0.5em 0 0 0.5em;
    margin-right: 0.5em;
  }

  .pic {
    box-shadow: 0px 0px 5px black;
    border-radius: 50%;
  }

  .post .about {
    text-align: left;
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

  .pk {
    padding: 0.5em;
    font-family: monospace;
    overflow-x: scroll;
    width: max-content;
    text-overflow: ellipsis;
  }

  .key {
    width: 95%;
    display: inline-block;
    width: 20em;
    overflow-x: scroll;
    margin-bottom: -5px;
  }

</style>
