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
  import Chat from './app/Chat.svelte'

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

  import { makeSwarm, makeRAMStore, makeDrive } from './lib/hyper'
  
  import b4a from 'b4a'
  import { schnorr } from '@noble/curves/secp256k1';

  import { 
    postDictionary,
    userDictionary,
    contentDictionary,
    commentsDictionary,
    vibesDictionary,
    repliesDictionary,
    activePost,
    keys,
    hyper,
    relay
  } from './lib/stores.js'

  const staticEndpoint = "/content"

  // State Variables
  let loading = true
  let openMenu = false
  let search = ""
  let page = "main"
  let events = []

  // Hyperdrive stuff
  let store
  let core
  let swarm
  let drive

  let searchOpen = false
  let tags = []

  let recentPosts = []

  let audioPlayer = new Audio()
  audioPlayer.crossOrigin = true
  $: isPlaying = !audioPlayer.paused

  let profile = {};

  // This is a function for turning a profile into
  // a collection of that person's nostr events
  const cloneCore = async (profile) => {
    //if (profile.drive) {
    //  console.log('drive', profile.drive)
    //}

    if (profile.log && store) {
      console.log('log', profile.log)
      let existentData = store.get({ key: profile.log })

      await existentData.ready()

      const discover = swarm.join(existentData.discoveryKey)
      const foundPeers = store.findingPeers()
      swarm.flush().then(() => foundPeers())
      await discover.flushed()


      console.log('key for existentData is ', b4a.toString(existentData.key, 'hex'))
      //await existentData.download()
      await existentData.update({ wait: true })
      console.log('persisted length is', existentData.length)
      //let range = existentData.download()
      //await range.done()

      if (existentData.length > 0) {
        console.log('copying existent data.')
        let position = 0
        await $hyper.core.ready()
        for await (const block of existentData.createReadStream({ start: 0, end: existentData.length })) {
          //console.log(`Block ${position++}: ${b4a.toString(block)}`)
          $hyper['core'].append(block)
          console.log('log length', $hyper['core'].length)
        }
      }
    }
  }


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
      // Post
      event.content = JSON.parse(event.content)

      if (Array.isArray(event.content.audio)) {
        event.content.type = "collection"
      } else {
        event.content.type = "single"
      }

      $postDictionary[event.id] = event

      // The filter keeps us from rendering duplicates
      recentPosts = [event, ...recentPosts.filter(p => p.id !== event.id).slice(0,10)]
    }
  }


  // The first thing we do in this app is to load all nostr
  // events and associated data into memory so they can be
  // processed without further latency
  onMount(async () => {
    // Nostr boostrap
    $relay = await initRelay('ws://relay.localhost')
    events = await getEvents($relay, [{ kinds: [0, 1, 7, 1063, 1618] }]);

    await Promise.all(events.map(async (event) => processEvent(event)))

    // Hypercore bootstrap
    swarm = await makeSwarm()
    store = await makeRAMStore()

    core = store.get({ name: 'log' })
    $hyper.core = core
    await core.ready()

    // When someone connects to us via the swarm, generally
    // the solar server or someone browsing our profile, we 
    // replicate all the data in the core so far.
    swarm.on('connection', conn => { 
      console.log('yep, that\'s a connection')
      store.replicate(conn) 
    })

    drive = await makeDrive(store.namespace('drive'))
    await drive.ready()

    const discover = swarm.join(core.discoveryKey)
    await discover.flushed()
    
    core.on('append', () => {
      const seq = core.length - 1
      core.get(seq).then(block => {
        let data
        try {
          data = JSON.parse(b4a.toString(block))
          processEvent(data)
        } catch (SyntaxError) {
          data = b4a.toString(block)
        }

        console.log(`Block ${seq} data:`, data)
      })
    })


    if (profile) {
      cloneCore(profile)
            .then(async () => {
              console.log('done cloning!')
              if (profile.log) {
                console.log('now we start the session')
                const sessionKey = b4a.toString($hyper.core.key, 'hex')
                const pubKey = $keys.publicKey
                const sig = b4a.toString(schnorr.sign(sessionKey, $keys.privateKey), 'hex')

                const results = await fetch("http://solar.credenso.cafe/session", {
                  method: "POST",
                  headers: {
                    "Content-Type": "text/plain"
                  },
                  body: JSON.stringify({ pubKey, sig, sessionKey })
                })

                console.log(await results.text())
              }
            })
    }


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
  <button on:click={() => navTo("chat")}>Chat</button>
  {#if profile.isArtist}
    <button on:click={() => navTo("upload")}>Upload</button>
  {/if}
</Sidebar>

<Profile bind:profile bind:core bind:swarm />

<Music bind:audioPlayer bind:isPlaying bind:searchOpen />
<Search bind:search bind:searchOpen bind:page />

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
              title="Recent posts."
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

  .hidden {
    display: none;
  }

  .visible {
    display: block;
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
