<script>
  // Components
  import Sidebar from './app/Sidebar.svelte'
  import Navbar from './app/Navbar.svelte'
  import Profile from './app/Profile.svelte'
  import Post from './app/Post.svelte'
  import Search from './app/Search.svelte'
  import Results from './app/Results.svelte'
  import Upload from './app/Upload.svelte'
  import Loading from './app/Loading.svelte'
  import Sidescroll from './app/Sidescroll.svelte'
  import Modal from './app/Modal.svelte'
  import Music from './app/Music.svelte'

  // Utilities
  import { onMount, onDestroy } from 'svelte'
  import { 
    initRelay,
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
    contentDictionary,
    commentsDictionary,
    vibesDictionary,
    repliesDictionary,
    activePost,
    keys,
    relay
  } from './lib/stores.js'

  const staticEndpoint = "/content"

  // State Variables
  let loading = true
  let openMenu = false
  let search = ""
  let page = "main"
  let events = []
  let results = undefined

  let searchOpen = false
  let tags = []

  let recentPosts = []

  let audioPlayer = new Audio()
  audioPlayer.crossOrigin = true
  $: isPlaying = !audioPlayer.paused

  let profile = {};

  activePost.subscribe((post) => {
    console.log('active post is...', post)
  })

  // This either generates new keys and saves
  // them to local storage, or just uses the
  // ones that are already there.
  // It isn't secure, but it works for now.
  $keys = unsecuredLocalKeys()

  // This is the function responsible for taking event data 
  // and turning it into something that our application can
  // work with. 
  // TODO: Refactor to make more modular
  const processEvent = async (event) => {
    if (event.kind === 1) {
      // Comment / Reply

      // We determine if the post is a comment based on 
      // whether or not it has a "root" tag
      if (event.tags.find(t => t[t.length - 1] === "root")) {

        if (event.tags.find(t => t[t.length - 1] === "reply")) {
          // this is a reply, don't add it directly to commentsDictionary
          const replyingTo = event.tags
            .find(t => t[t.length - 1] === "reply")[1]
          const replies = $repliesDictionary[replyingTo]
          if (replies) {
            $repliesDictionary[replyingTo] = [...$repliesDictionary[replyingTo], event]
          } else {
            $repliesDictionary[replyingTo] = [event]
          }

        } else {
          // It's a top-level comment
          // First, we get the root post.
          const original_post = event.tags
            .find(t => t[t.length - 1] === "root")[1]

          // Here is a top-level comment. We try to get all existing
          // comments, and then either add to or create that list
          const comments = $commentsDictionary[original_post]

          // Then we add the comment to a list of replies
          // to that specific post
          if (comments) {
            $commentsDictionary[original_post] = [...$commentsDictionary[original_post], event]
          } else {
            $commentsDictionary[original_post] = [event]
          }
        }
      }
    } else if (event.kind === 0) {
      // User Profile
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
    } else if (event.kind === 7) {
      // Reaction
      const post_id = event.tags.find(t => t[0] === "e")[1]
      const reaction = event.content 

      // This might be a waste of compute
      if (!tags.includes(reaction)) tags.push(reaction)

      const vibes = $vibesDictionary[post_id]
      // If we already have a list for the reactions
      if (vibes && vibes[reaction]) {
        vibes[reaction] = [...vibes[reaction], event.pubkey]
        $vibesDictionary[post_id] = vibes

      // If we have a dictionary for the post, but
      // this is the first reaction of the type
      } else if (vibes) {
        vibes[reaction] = [event.pubkey]
        $vibesDictionary[post_id] = vibes

      // Otherwise, we need to create the entry
      } else {
        $vibesDictionary[post_id] = { [reaction]: [event.pubkey] }
      }
    } else if (event.kind === 1063) {
      // Content (file)
      let content = event.tags.find(t => t[0] === "url")[1]
      $contentDictionary[event.id] = `${staticEndpoint}${content}`;
    } else if (event.kind === 1618) {
      console.log('found vibe!')
      event.content = JSON.parse(event.content)
      $postDictionary[event.id] = event
      recentPosts = [event, ...recentPosts.slice(0, 10)]
    }
  }


  // The first thing we do in this app is to load all nostr
  // events and associated data into memory so they can be
  // processed without further latency
  onMount(async () => {
    $relay = await initRelay('ws://relay.localhost')
    events = await getEvents($relay, [{ kinds: [0, 1, 7, 1063, 1618] }]);

    // I don't think we need this value for anything,
    // but we can await it.
    results = await Promise.all(events.map(async (event) => processEvent(event)))

    let sub = $relay.sub([
      {
        kinds: [0,1, 7, 1063, 1618],
        since: Math.floor(Date.now() / 1000)
      }
    ])

    sub.on('event', (event) => {
      console.log('got event, processing')
      processEvent(event)
    })

    // Make a query every 30 seconds to keep the connection alive
    window.setInterval(async () => {
    events = await getEvents($relay, [{ kinds: [0] }]);
    Promise.all(events.map(async (event) => processEvent(event)))
    }, 1000 * 30)
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
  {/if}
</Sidebar>

<Profile bind:profile />

<Music bind:audioPlayer bind:isPlaying bind:searchOpen />

<main>
  <div class="redBorder">
    <div class="orangeBorder">
      <div class="blueBorder">
        {#if loading}
          <Loading />
        {/if}
        <section class="is-preload">
          <Modal />
          {#if page === "main"}
          <Sidescroll 
            title="Recently posted."
            color="red"
            bind:posts={recentPosts}
            />
          {:else if page === "upload"}
            <Upload bind:page bind:keys={$keys} />
          {:else if page === "search"}
            <Results bind:search bind:tags />
          {/if}
        </section>
      </div>
    </div>
  </div>
  <Search bind:search bind:searchOpen bind:page />
  <footer><a href="https://credenso.cafe"><b>&copy;redenso</b></a></footer>
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
    border-bottom-width: 4em;
    margin-bottom: -3em;
  }

  footer {
    position: static;
    color: white;
    height: 3em;
    width: 100%;
    margin: auto;
    padding-bottom: 0.5em;
  }
</style>
