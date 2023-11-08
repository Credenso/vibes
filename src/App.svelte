<script>
  // Components
  import Sidebar from './app/Sidebar.svelte'
  import Navbar from './app/Navbar.svelte'
  import Profile from './app/Profile.svelte'
  import Member from './app/Member.svelte'
  import Post from './app/Post.svelte'
  import Search from './app/Search.svelte'
  import Results from './app/Results.svelte'
  import Upload from './app/Upload.svelte'
  import Loading from './app/Loading.svelte'
  import Sidescroll from './app/Sidescroll.svelte'
  import Details from './app/Details.svelte'
  import Modal from './app/Modal.svelte'
  import Music from './app/Music.svelte'
  import Chat from './app/Chat.svelte'
  import Direct from './app/Direct.svelte'
  import Invite from './app/Invite.svelte'

  // Utilities
  import { onMount, onDestroy } from 'svelte'
  import { 
    initRelay,
    getPosts,
    getMembers,
    getEvents,
    unsecuredLocalKeys,
    signEvent,
    publishEvent
  } from './lib/nostr'

  import { getSong } from './lib/ipfs'

  import { nip42 } from 'nostr-tools'

  import b4a from 'b4a'
  import { schnorr } from '@noble/curves/secp256k1';

  import { 
    postDictionary,
    memberDictionary,
    contentDictionary,
    commentsDictionary,
    vibesDictionary,
    repliesDictionary,
    activePost,
    keys,
    modal,
    activeMember,
    memberClass,
    members,
    contacts,
    relay
  } from './lib/stores.js'

  const staticEndpoint = "/content"

  // State Variables
  let loading = true
  let openMenu = false
  let search = ""
  let page = "main"
  let activeWidget = undefined
  let events = []

  let searchOpen = false

  let recentPosts = []
  let followedPosts = []
  let yrVibes= []
  let tags = []

  let audioPlayer = new Audio()
  audioPlayer.crossOrigin = true
  $: isPlaying = !audioPlayer.paused

  // Grab querystring data
  const query = new URLSearchParams(window.location.search)
  let invite = {
    code: query.get('invite'),
    member: query.get('member')
  }

  // Then replace it
  var href = window.location.href;
  var url  = href.split('?invite=');
  window.history.replaceState(null, null, url[0]);

  let profile = {};

  // This either generates new keys and saves
  // them to local storage, or just uses the
  // ones that are already there.
  // It isn't the most secure, but it works 
  // for now.
  $keys = unsecuredLocalKeys()

  activePost.subscribe((post) => {
    if (post) {
      console.log('active post is...', post)
    }
  })

  members.subscribe(dict => {
    if (dict.admins) {
      if (dict.admins.includes($keys.publicKey)) {
        $memberClass = "admin"
      } else if (Object.values(dict.names).includes($keys.publicKey)) {
        $memberClass = "member"
      } else {
        $memberClass = "npc"
      }
    }
  })

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
      // Member Profile
      let content = JSON.parse(event.content);
      if (profile.display_name === undefined) {
        profile.display_name = profile.name
      }

      // We default to our server if one isn't
      // defined - assuming they'll want to register
      // at whatever station they are browsing
      if (profile.station === undefined) {
        profile.station = "solar.credenso.cafe"
      }

      $memberDictionary[event.pubkey] = content;

      // If we find a member that matches our public key,
      // That's our profile! Whichever one was published
      // most recently ends up being the one we use.
      if (event.pubkey === $keys.publicKey) {
        profile = content
      }

      return {...content, "pubkey": event.pubkey };
    } else if (event.kind === 5) {
      // Delete
      const ids = event.tags.filter(t => t[0] === "e").map(t => t[1])
      ids.forEach(id => {
        delete $postDictionary[id]
        delete $contentDictionary[id]
      })
      recentPosts = recentPosts.filter(p => !ids.includes(p.id))
      if (followedPosts) {
        updateFollows()
        updateVibes()
      }

    } else if (event.kind === 7) {
      // Reaction
      const post_id = event.tags.find(t => t[0] === "e")[1]
      const reaction = event.content 

      // This might be a waste of compute, but it's a
      // list of all tags available in the app
      if (!tags.includes(reaction)) tags.push(reaction)

      const vibes = $vibesDictionary[post_id]
      // If we already have a list for the reactions
      if (vibes && vibes[reaction]) {
        // Filter is necessary to prevent duplication from different sources
        vibes[reaction] = [...vibes[reaction].filter(r => r !== event.pubkey), event.pubkey]
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
      //console.log('vibes', $vibesDictionary)
    } else if (event.kind === 1063) {
      // Content (file)
      const urltag = event.tags.find(t => t[0] === "url")[1]
      if (urltag.startsWith('http')) {
        event.url = urltag
      } else {
        event.url = `${staticEndpoint}${urltag}`
      }

      $contentDictionary[event.id] = event
    } else if (event.kind === 1618) {
      // Post
      event.content = JSON.parse(event.content)

      if (Array.isArray(event.content.audio)) {
        event.content.type = "collection"
      } else {
        event.content.type = "single"
      }

      $postDictionary[event.id] = event
    }
  }

  const updateRecent = () => {
    recentPosts = Object.values($postDictionary).sort((p1, p2) => {
      return p1.created_at < p2.created_at
    }).slice(0,10)
  }

  const updateFollows = () => {
    const followedIDs = $contacts.map(c => c[1])
    followedPosts = Object.values($postDictionary).filter(post => followedIDs.includes(post.pubkey))
  }

  const updateVibes = () => {
    // Complexity O(mn)
    if (profile.vibes) {
      const vibeyKeys = Object.keys($postDictionary)
        .filter(post_id => Object.keys($vibesDictionary[post_id] || {})
          .some(tag => profile.vibes.includes(tag)))
      yrVibes = vibeyKeys.map(key => $postDictionary[key]).sort(() => Math.random() - 0.5)
    }
  }


  // The first thing we do in this app is to load all nostr
  // events and associated data into memory so they can be
  // processed without further latency
  onMount(async () => {
    // Nostr boostrap
    $relay = await initRelay('ws://relay.credenso.cafe')

    // We need to authenticate
    const sign = async (event) => {
      event.pubkey = $keys.publicKey
      return await signEvent(event, $keys.privateKey)
    }
    $relay.on('auth', async challenge => {
      nip42.authenticate({ relay: $relay, sign, challenge })

      // This is very jank (arbitrarily waits 500ms for auth)
      // TODO: Dejankify
      window.setTimeout(() => {
        $relay.authorized = true
      }, 500)
    })

    events = await getEvents($relay, [{ kinds: [0, 1, 5, 7, 1063, 1618] }]);

    await Promise.all(events.map(async (event) => processEvent(event)))

    $contacts = await $relay.list([{ 
      kinds: [3],
      authors: [$keys.publicKey],
      limit: 1
    }]).then(list => {
      if (list.length > 0) {
        return list[0].tags
      } else {
        return []
      }
    })


    updateRecent()
    updateFollows()
    updateVibes()

    // Here we get the list of currently registered members
    const membersJSON = await fetch("http://solar.credenso.cafe/.well-known/nostr.json")
    $members = await membersJSON.json()

    let sub = $relay.sub([
      {
        kinds: [0, 1, 5, 7, 1063, 1618],
        since: Math.floor(Date.now() / 1000)
      }
    ])

    sub.on('event', (event) => {
      console.log('got event, processing')
      processEvent(event)
      if (event.kind === 0) {
        updateVibes()
      }
      if (event.kind === 3) {
        updateFollows()
      }
      if (event.kind === 1618) {
        updateRecent()
      }
    })

    // Make a query every 30 seconds to keep the connection alive
    window.setInterval(async () => {
      events = await getEvents($relay, [{ kinds: [0] }]);
      //Promise.all(events.map(async (event) => processEvent(event)))
    }, 1000 * 30)
  });

  // This waits until the content is loaded before it displays
  window.onload = () => {
    window.setTimeout(() => {
      loading = false;
      document.querySelector('section.is-preload').classList.remove('is-preload');

      if (invite.code) {
        $activeMember = $keys.publicKey
        $modal = "member"
      }
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
  <button on:click={() => navTo("main")}>🏠 Home</button>
  {#if $memberClass !== 'npc'}
    <button on:click={() => navTo("chat")}>💬 Chat</button>
    <button on:click={() => navTo("upload")}>📁 Upload</button>
  {/if}
  {#if $memberClass === 'admin'}
    <button on:click={() => navTo("invite")}>✉️ Invite</button>
  {/if}
</Sidebar>

<Modal>
  <div class="hidden" class:visible={$modal === "details"}>
    <Details />
  </div>
  <div class="hidden" class:visible={$modal === "member"}>
    <Member bind:invite />
  </div>
  <div class="hidden" class:visible={$modal === "direct"}>
    <Direct />
  </div>
</Modal>

<Profile />

<Music bind:audioPlayer bind:isPlaying bind:activeWidget />
<Search bind:search bind:activeWidget bind:page />

<main>
  <div class="redBorder">
    <div class="orangeBorder">
      <div class="blueBorder">
        {#if loading}
          <Loading />
        {/if}

        <section class="is-preload">
          <div class="hidden" class:visible={page === "main"}>
            <Sidescroll 
              title="Recent posts."
              color="red"
              bind:posts={recentPosts}
              />

              {#if followedPosts.length > 0}
                <Sidescroll 
                  title="People you follow."
                  color="orange"
                  bind:posts={followedPosts}
                  />
              {/if}

                {#if yrVibes.length > 0}
                  <Sidescroll 
                    title="Yr vibe."
                    color="blue"
                    bind:posts={yrVibes}
                    />
                {/if}
          </div>
          <div class="hidden" class:visible={page === "upload"}>
            <Upload bind:page bind:keys={$keys} />
          </div>
          <div class="hidden" class:visible={page === "search"}>
            <Results bind:tags bind:search />
          </div>
          <div class="hidden" class:visible={page === "chat"}>
            <Chat bind:profile />
          </div>
          {#if $memberClass === "admin"}
            <div class="hidden" class:visible={page === "invite"}>
              <Invite />
            </div>
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

  .hidden.visible {
    display: block;
  }

  footer {
    position: static;
    color: white;
    height: 3em;
    width: 100%;
    margin: auto;
    padding-bottom: 0.5em;
    font-family: "Comfortaa";
  }
</style>
