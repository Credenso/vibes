<script>
  import { 
    newReactionEvent,
    publishEvent,
    signEvent
  } from '../lib/nostr'

  import { 
    relay,
    vibesDictionary,
    postDictionary,
    activePost,
    keys 
  } from '../lib/stores'

  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';

  let event = $postDictionary[$activePost]
  let vibes = $vibesDictionary[event.id]

  const sortedVibes = (vibesDict) => {
    if (vibes) {
      const sorted = Object.keys(vibes).sort((v1,v2) => {
        if (vibes[v1].length > vibes[v2].length) {
          return -1
        } else {
          return 1
        }
      })

      return sorted
    } else {
      return []
    }
  }

  let vibesList = sortedVibes(vibes)

  vibesDictionary.subscribe((vibeDict) => {
    // If the vibes have changed,
    // change the vibe.
    if (event) {
      vibes = vibeDict[event.id]
      vibesList = sortedVibes(vibes)
    }
  })

  activePost.subscribe((id) => {
    // likewise, we must stay up-to-date
    // on what's happening
    event = $postDictionary[id]
    if (event) {
      vibes = $vibesDictionary[event.id]
      vibesList = sortedVibes(vibes)
    }
  })

  const vote = (vibe) => {
    if (!vibes[vibe].includes($keys.publicKey)) {
      const rxn = newReactionEvent(`${vibe}`, $keys.publicKey, event)
      publishEvent($relay, signEvent(rxn, $keys.privateKey))
    } else {
      console.log('you already voted!')
    }
  }
  
</script>

<hr>
<h1 class="header">Vibes</h1>
{#if vibesList}
  <section>
    {#each vibesList as vibe, i (vibe)}
      <button 
        animate:flip={{ delay: 200, duration: 500, easing: quintOut }} 
        on:click={() => vote(vibe)}
        style={`font-size: ${Math.log(1  + vibes[vibe].length)}em`}
        >
        {vibe}
      </button>
    {/each}
  </section>
{/if}

<style>
  section {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-around;
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

  hr {
    margin: .5em;
  }

  .header {
    font-size: 1.3em;
    font-weight: bold;
    margin-top: 1em;
  }
</style>
