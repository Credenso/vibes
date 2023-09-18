<script>
  import svelteLogo from './assets/svelte.svg'
  import viteLogo from '/vite.svg'
  import Sidebar from './lib/Sidebar.svelte'
  import Navbar from './lib/Navbar.svelte'
  import Profile from './lib/Profile.svelte'
  import Post from './lib/Post.svelte'
  import Search from './lib/Search.svelte'

  let open = false

  window.onload = () => {
    window.setTimeout(() => {
      document.querySelector('section').classList.remove('is-preload');
    }, 100);
  }
</script>

<Sidebar bind:open>
  <p>Menu</p>
</Sidebar>

<Navbar/>

<Profile/>

<main>
  <div class="redBorder">
    <div class="orangeBorder">
      <div class="blueBorder">
        <section class="is-preload">
          <div class="sectionHeader red">
            <b>Recent Shares.</b>
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
          </div>
          <div class="sectionHeader orange">
            <b>What's Trending.</b>
          </div>
          <div class="sideScroll">

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
        </section>
      </div>
    </div>
  </div>
  <Search />
  <footer>&copy;redenso</footer>
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
    width: 100%;
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
