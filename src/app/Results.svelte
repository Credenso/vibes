<script>
  import Sidescroll from './Sidescroll.svelte'
  import { onMount } from 'svelte'

  import { vibesDictionary, postDictionary } from "../lib/stores.js"
  import { alignment } from "../lib/util.ts"

  export let search
  export let tags

  let searchResults = []

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
</script>

{#each relevantTags as tag, i}
  <Sidescroll 
    title="~{tag} vibes"
    color="{["red","orange","blue"][i%3]}"
    bind:posts={results[tag]}
    />
{/each}
{#if relevantTags.length === 0}
  <p>No results!</p>
  <p>Try looking for...</p>
{/if}

