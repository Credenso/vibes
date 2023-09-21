<script>
  import { postDictionary, userDictionary, activePost } from '../lib/stores'

  export let postHash
  export let image
  let content = undefined
  let name
  let author

  postDictionary.subscribe(() => {
    content = $postDictionary[postHash]
    if (content) {
      author = $userDictionary[content.event.pubkey]
    }
  })

  const setActive = () => {
    activePost.set(postHash)
  }
</script>

<article class="post px-5 rounded-md">
  <div class="box border-red relative h-full w-full overflow-hidden rounded-md border-2 bg-white pb-2">
    <div class="relative aspect-square w-full overflow-hidden">
      <img src="{ image }" alt="vinyl" class="aspect-square object-cover">
    </div>
    <section class="about" on:click={setActive}>
    <div class="px-3 pt-2 pb-1 font-bold">{ content?.name }</div>
    <div class="px-3 pb-2 italic leading-none">{ author?.name || 'Anonymous' }</div>
    </section>
  </div>
</article> 

<style>
  img {
    object-fit: cover;
    height: 16em;
  }

  .post {
    position: relative;
    z-index: 10;
    min-width: min(70vw, 20em);
    max-width: min(70vw, 20em);
    margin: 1em auto;
    transition: all 0.2s;
  }

  .box {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .desc {
    flex-grow: 1;
    display: flex;
    align-items: center;
  }

  .post:hover {
    transform: scale(1.05);
  }

  .font-bold {
    line-height: 1;
  }
</style>
