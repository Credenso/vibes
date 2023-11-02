<script>
  import Sidescroll from './Sidescroll.svelte'
  import { onMount } from 'svelte'

  import { vibesDictionary, postDictionary } from "../lib/stores.js"
  import { alignment } from "../lib/util.ts"

  export let search
  export let tags

  let searchResults = []
  let popularTags = []
  let popularity = {}

  const searchScore = (tag, query) => {
    let totalScore = alignment(tag, query)
    let multiplier = (query.length - Math.abs(tag.length - query.length)) / tag.length
    let score = Math.floor((totalScore * multiplier) / query.length)
    return score
  }

  let results = {}

  $: relevantTags = tags.filter(t => searchScore(t,search) >= 1) || []

  $: results = relevantTags.reduce((acc, tag) => {
    return { ...acc, [tag]: getRelevantPosts(tag) }
  }, {})

  const getRelevantPosts = (search) => {
    let scores = {}
    Object.keys($vibesDictionary).forEach(post => {
      const score = $vibesDictionary[post][search]?.length
      if (score) {
        scores[post] = score
      }
    })

    const sortedResults = Object.keys(scores).sort((k1, k2) => scores[k1] < scores[k2])
    return sortedResults.map(id => $postDictionary[id])
  }

  const mostPopular = () => {
    let pop = {}
    Object.values($vibesDictionary)
      .forEach(post => {
        Object.keys(post).forEach(vibe => { 
          pop[vibe] = (pop[vibe] || 0) + post[vibe].length 
        })
      })
    console.log('pop', pop)
    popularity = pop
    popularTags = Object.keys(pop).sort((k1,k2) => pop[k1] < pop[k2])
  }
</script>

{#each relevantTags as tag, i}
  <Sidescroll 
    title="~{tag} vibes"
    follow="{tag}"
    color="{["red","orange","blue"][i%3]}"
    bind:posts={results[tag]}
    />
{/each}
{#if relevantTags.length === 0}
  <p class="title">No results for {search}!</p>
  <p>Try one of these...</p>
  {#each popularTags as tag}
    <p class="vibe" on:click={() => search = tag} style={`font-size: ${Math.log(1 + popularity[tag])}em`}>~{tag}</p>
  {/each}
  <button on:click={mostPopular}>What's cool?</button>
{/if}

<style>
  .title {
    font-size: 1.5em;
  }

  .vibe {
    cursor: pointer;
    font-weight: bold;
  }
</style>
