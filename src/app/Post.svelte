<script>
  export let name;
  export let artist;
  export let image;
  export let description;
</script>

<article class="post px-5 rounded-md">
  <div class="box border-red relative h-full w-full overflow-hidden rounded-md border-2 bg-white pb-2">
    <div class="relative aspect-square w-full overflow-hidden">
      <img src="{ image }" alt="vinyl" class="aspect-square object-cover">
    </div>
    <div class="px-3 pt-2 pb-1 font-bold">{ name }</div>
    <div class="px-3 pb-2 italic leading-none">{ artist }</div>
    <div class="desc font-secondary px-3 leading-4">{ description }</div>
  </div>
</article> 

<style>
  .post {
    position: relative;
    z-index: 10;
    min-width: min(70vw, 20em);
    max-width: min(70vw, 20em);
    margin: 1em auto;
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
