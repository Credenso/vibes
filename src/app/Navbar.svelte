<script>
  export let page;
</script>

<nav>
  <button on:click={() => page = "main"}><img src='vibes_logo.svg' alt="Vibes" id="navLogo"></button>
</nav>

<style>
  nav {
    background: white;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    display: flex;
    justify-content: center;
    height: 5em;
  }

  #navLogo {
    width: 8em;
    margin: 1em;
    will-change: filter;
    transition: filter 300ms;
  }

  #navLogo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
</style>
