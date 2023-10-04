<script>
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';

  export let tags;
  let vibes = ["happy", "sad", "funky", "depressed", "80s"]
</script>

<section>
  {#each vibes as vibe, i (vibe)}
    <button 
      animate:flip={{ delay: 200, duration: 500, easing: quintOut }} 
      on:click={() => window.setTimeout(() => vibes = vibes.filter(word => word !== vibe), 200)}
      >
      {vibe}
    </button>
  {/each}
</section>

<style>
  section {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }

  button {
    border-radius: 1.5em;
    padding: 0.5em;
    height: 3em;
    width: fit-content;
    margin-right: 1em;
  }

  button:before {
    content: "~"
  }

  @keyframes fadeBlue {
    0%   { background-color: #028A9B; }
    100% { background-color: #FFFFFF; }
  }

  button:focus {
    animation: fadeBlue 1s ease-out;
  }

  button:active {
    animation: none;
  }
</style>
