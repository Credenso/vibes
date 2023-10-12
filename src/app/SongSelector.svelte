<script>
  import { postDictionary, keys } from '../lib/stores'

  export let content
  let options = []
  let inputBox = null
  let search

  const autocomplete = (e) => {
    inputBox = e.target
    const value = inputBox.value
    if (value.length > 0) {
      options = Object.keys($postDictionary).filter((post) => {
        const postObject = $postDictionary[post]
        if (postObject.pubkey === $keys.publicKey 
          && postObject.content.type === "single" 
          && postObject.content.name
          .toLowerCase()
          .startsWith(value.toLowerCase())
        ) {
          return true
        } else {
          return false
        }
      })
    } else {
      options = []
    }
  }

  let selected

  const reset = () => {
    content = undefined
    selected = undefined
    options = []
    search = ''
  }

</script>

{#if selected === undefined}
  <div class="autocomplete">
    <input on:input={autocomplete} on:blur={() => window.setTimeout(() => options = [], 10)} type="text" id="formSong" name="song" bind:value={search} placeholder="Post name"/>
    {#if options?.length > 0}
      <ul>
        {#each options as option}
          <li on:click={() => selected = option}>{$postDictionary[option].content.name}</li>
        {/each}
      </ul>
    {/if}
  </div>
{:else}
  <section class="selection">
    <h1>{$postDictionary[selected].content.name}</h1>
    <div on:click={reset}>x</div>
  </section>
  <input type="hidden" name="song" bind:value={selected} />
{/if}

<style>
  .autocomplete {
    position: relative;
    display: inline-block;
    width: fit-content;
  }

  h1 {
    font-size: 1.2em;
  }

  input {
    background-color: #EEEEEE;
    border-radius: 1em;
    padding: 0.5em;
    margin: 0.5em;
    flex-grow: 1;
  }

  section {
    flex-grow: 1;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
  }

  ul {
    position: absolute;
    z-index: 100;
    margin: 0;
    padding: 1em;
    width: inherit;
    border: 1px solid #ddd;
    background-color: #ddd;
    transform: translate(1rem, -1rem);
  }	
  li {
    font-size: 1.1em;
  }
</style>
