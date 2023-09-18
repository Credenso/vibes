<script>
  export let name;
  export let artist;
  export let image;
  export let description;
</script>

<div class="post px-5 rounded-md ">
  <div class="border-red relative h-full w-full overflow-hidden rounded-md border-2 bg-white pb-2">
    <div class="relative aspect-square w-full overflow-hidden">
      <img src="{ image }" alt="vinyl" class="aspect-square object-cover">
    </div>
    <div class="px-3 pt-2 pb-1 font-bold">{ name }</div>
    <div class="px-3 pb-2 italic leading-none">{ artist }</div>
    <div class="font-secondary px-3 leading-4">{ description }</div>
  </div>
</div> 

<style>
  .post {
    position: relative;
    z-index: 10;
    min-width: 70vw;
    height: min-content;
    margin: 1em auto;
  }

  .post:hover {
    transform: scale(1.05);
  }

  .font-bold {
    line-height: 1;
  }
</style>
