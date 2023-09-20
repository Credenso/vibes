<script>
  // Components
  import Sidebar from './app/Sidebar.svelte'
  import Navbar from './app/Navbar.svelte'
  import Profile from './app/Profile.svelte'
  import Post from './app/Post.svelte'
  import Search from './app/Search.svelte'
  import Upload from './app/Upload.svelte'
  import Loading from './app/Loading.svelte'
  import Sidescroll from './app/Sidescroll.svelte'

  // Utilities
  import { onMount, onDestroy } from 'svelte'
  import { getPosts } from './lib/nostr'
  import { getSong } from './lib/ipfs'
  import { postDictionary } from './lib/stores.js'

  // State Variables
  let loading = true
  let openMenu = false
  let search = ""
  let page = "main"
  let postEvents = []
  let results = undefined

  // The first thing we do in this app is to load all nostr
  // events and associated data into memory so they can be
  // processed without further latency
  onMount(async () => {
    postEvents = await getPosts();
    results = Promise.all(postEvents.map(async (event) => {
      // If we have already registered this event...
      if (event.content in $postDictionary) {
        // Then we skip it.
        return null
      } else {
        // Otherwise - we get the data from IPFS,
        const eventData = await getSong(event.content);
        // And save it to the postDictionary
        $postDictionary[event.content] = eventData;
        return eventData
      }
    }))

    console.log('results', await results)
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
  <button on:click={() => navTo("upload")}>Upload</button>
</Sidebar>

<Profile>
  <b>Profile Information</b>
  <p>Set/generate your public key/metadata here</p>
</Profile>

<main>
  <div class="redBorder">
    <div class="orangeBorder">
      <div class="blueBorder">
        {#if loading }
          <Loading />
        {/if}
        <section class="is-preload">
          {#if page === "main"}
          <div class="sectionHeader orange">
            <b>Your collections.</b>
          </div>
          <div class="sideScroll">
            <Post 
              artist="Lil Yachty" 
              name="Let's Start Here." 
              image="lets_start_here.jpg"
              description="This is what happens when you listen to your parents' music."
              />
            <Post 
              artist="Kendrick Lamar" 
              name="To Pimp A Butterfly" 
              image="tpab.png"
              description="If anyone tells you that rap isn't art, send them this."
              />
            <Post 
              artist="Daft Punk" 
              name="Random Access Memories (10th Anniversary Edition)" 
              image="ram10.jpg"
              description="Analog Dance Music for the kids who never got to grow up with disco"
              />
          </div>
          <Sidescroll 
            title="Recently posted."
            color="red"
            posts={postEvents}
            />
          {:else if page === "upload"}
            <p>Rendering upload page</p>
            <Upload />
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
    height: 90vh;
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
    margin-bottom: -2em;
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
