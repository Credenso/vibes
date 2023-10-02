<script>
  // Components
  import Sidebar from './app/Sidebar.svelte'
  import Navbar from './app/Navbar.svelte'
  import Profile from './app/Profile.svelte'
  import Post from './app/Post.svelte'
  import Search from './app/Search.svelte'
  import Upload from './app/Upload.svelte'
  import IPFSUpload from './app/IPFSUpload.svelte'
  import Loading from './app/Loading.svelte'
  import Sidescroll from './app/Sidescroll.svelte'
  import Modal from './app/Modal.svelte'
  import Music from './app/Music.svelte'

  // Utilities
  import { onMount, onDestroy } from 'svelte'
  import { 
    initRelay,
    RELAY_URL,
    getPosts,
    getUsers,
    getEvents,
    unsecuredLocalKeys,
    publishEvent
  } from './lib/nostr'

  import { getSong } from './lib/ipfs'

  import { 
    postDictionary,
    userDictionary,
    commentsDictionary,
    activePost,
    keys,
    relay
  } from './lib/stores.js'

  // State Variables
  let loading = true
  let openMenu = false
  let search = ""
  let page = "main"
  let events = []
  let results = undefined

  let recentPosts = []

  let audioPlayer = new Audio()
  audioPlayer.crossOrigin = true
  let queue = []

  let profile = {};

  activePost.subscribe((post) => {
    console.log('active post is...', post)
    //console.log($postDictionary[post])
    //music.src = $postDictionary[post]?.audio
    //music.play()
  })

  // This either generates new keys and saves
  // them to local storage, or just uses the
  // ones that are already there.
  // It isn't secure, but it works for now.
  $keys = unsecuredLocalKeys()

  // This is the function responsible for taking event data 
  // and turning it into something that our application can
  // work with.
  const processEvent = async (event) => {
    // If this event is a "post"...
    if (event.kind === 1) {
      // Then we need to decide if it's a media post or a comment.

      // We determine if the post is a comment based on 
      // whether or not it has a "root" tag
      if (event.tags.length > 0 && event.tags.find(t => t[t.length - 1] === "root")) {
        // First, we get the root post.
        const original_post = event.tags
          .find(t => t[t.length - 1] === "root")[1]

        const comments = $commentsDictionary[original_post]

        // Then we add the comment to a list of replies
        // to that specific post
        if (comments) {
          $commentsDictionary[original_post] = [...$commentsDictionary[original_post], event]
        } else {
          $commentsDictionary[original_post] = [event]
        }
      } else if (event.content.startsWith('Qm') && event.content.length === 46) {
        // If the event is a 46 character string starting with Qm, we assume it's an IPFS link
        // So, we get the data from IPFS,
        const eventData = await getSong(event.content);

        // And save it to the postDictionary with the event
        $postDictionary[event.id] = {...eventData, event};
        recentPosts = [event, ...recentPosts.slice(0, 10)]
        console.log('ipfs data', eventData)
        return eventData
      } else {
        // Assume it's a Hypercore upload.
        let eventData = undefined
        try {
          eventData = JSON.parse(event.content)
        } catch (SyntaxError) {
          eventData = undefined
        }

        if (eventData) {
          eventData.audio = `http://localhost/content/${event.pubkey}/${eventData.audio}`
          eventData.image = `http://localhost/content/${event.pubkey}/${eventData.image}`
        }

        $postDictionary[event.id] = {...eventData, event};
        recentPosts = [event, ...recentPosts.slice(0, 10)]
        console.log('hypercore data', eventData)
        return eventData
      }
      // If it's a user profile...
    } else if (event.kind === 0) {
      //let tags = event.tags.reduce((object, tag) => {...object, [tag[0]]: tag[1] }, {})
      let content = JSON.parse(event.content);
      $userDictionary[event.pubkey] = content;

      // If we find a user that matches our public key,
      // That's our profile! Whichever one was published
      // most recently ends up being the one we use.
      if (event.pubkey === $keys.publicKey) {
        profile = content
      }

      return {...content, "pubkey": event.pubkey };
    }
  }


  // The first thing we do in this app is to load all nostr
  // events and associated data into memory so they can be
  // processed without further latency
  onMount(async () => {
    $relay = await initRelay(RELAY_URL)
    events = await getEvents($relay, [{ kinds: [0, 1] }]);

    // I don't think we need this value for anything,
    // but we can await it.
    results = Promise.all(events.map(async (event) => processEvent(event)))

    let sub = $relay.sub([
      {
        kinds: [0,1],
        since: Math.floor(Date.now() / 1000)
      }
    ])

    sub.on('event', (event) => {
      console.log('got event, processing')
      processEvent(event)
    })

  });

  // This waits until the content is loaded before it displays
  window.onload = () => {
    window.setTimeout(() => {
      loading = false;
      document.querySelector('section.is-preload').classList.remove('is-preload');
      // A higher number hides the time it takes to load API data
      // too much?
    }, 4000);
  }

  const navTo = (pageName) => {
    page = pageName;
    openMenu = false;
  }
</script>

<Navbar bind:page />

<Sidebar bind:open={openMenu}>
  <b>Menu</b>
  <button on:click={() => navTo("main")}>Home</button>
  {#if profile.isArtist}
    <button on:click={() => navTo("upload")}>Upload</button>
    <button on:click={() => navTo("ipfs-upload")}>IPFS Upload</button>
  {/if}
</Sidebar>

<Profile bind:profile />

<Music bind:audioPlayer bind:queue />

<main>
  <div class="redBorder">
    <div class="orangeBorder">
      <div class="blueBorder">
        {#if loading}
          <Loading />
        {/if}
        <section class="is-preload">
          {#if page === "main"}
          <Modal />
          <Sidescroll 
            title="Recently posted."
            color="red"
            bind:posts={recentPosts}
            />
          {:else if page === "upload"}
            <Upload bind:keys={$keys} />
          {:else if page === "ipfs-upload"}
            <IPFSUpload bind:keys={$keys} />
          {:else if page === "search"}
            <p>Searching for {search}</p>
          {/if}
        </section>
      </div>
    </div>
  </div>
  <Search bind:search bind:page />
  <footer><b>&copy;redenso</b></footer>
</main>

<style>
  main {
    height: 92vh;
    overflow-y: scroll;
    overflow-x: hidden;
  }

  section {
    min-height: 100vh;
    transition: opacity 0.2s ease-in-out;
  }

  section.is-preload {
    opacity: 0;
  }

  section.is-preload *, section.is-preload *:before, section.is-preload *:after {
    animation: none;
    transition: none;
  }


  .sideScroll {
    display: flex;
    overflow-x: scroll;
    scrollbar-width: none;
    width: 100%;
  }

  sideScroll::-webkit-scrollbar{
    display: none;
  }

  .sectionHeader {
    color: white;
    width: 75%;
    border-radius: 0 1em 1em 0;
    position: relative;
    margin-top: 1em;
    margin-bottom: 1em;
    padding: 0.3rem;
    max-width: 20em;
    font-size: min(1.5em, 4.5vw);
  }

  .red {
    background: #de5a5a;
    transform: translateX(-20px);
  }

  .orange {
    background: #f8a147;
    transform: translateX(-15px);
  }

  .blue {
    background: #028a9b;
    transform: translateX(-10px);
  }

  .blueBorder {
    margin: -4px;
    padding: 0;
    border: 10px solid #028a9b;
    border-radius: 2em;
  }

  .orangeBorder {
    margin: -10px;
    padding: 0;
    border: 13px solid #f8a147;
    border-radius: 2em;
    z-index: -1;
  }

  .redBorder {
    margin: -2px;
    padding: 0;
    border: 22px solid #de5a5a;
    border-bottom-width: 3em;
    margin-bottom: -2.2em;
  }

  footer {
    position: static;
    color: white;
    height: 2em;
    width: 100%;
    margin: auto;
    padding-bottom: 0.5em;
  }
</style>
