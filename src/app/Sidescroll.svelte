<script>
	import { postDictionary, userDictionary } from '../lib/stores'
	import { preload } from '../lib/util'
    
	import Post from '../app/Post.svelte'

	export let title;
	export let posts;
	export let color = "red";
</script>

<div class="sectionHeader {color}">
	<b>{title}</b>
</div>
<div class="sideScroll">
  {#if posts}
	{#each posts as event (event.id)}
      <Post 
        postId="{event.id}"
        image="{$postDictionary[event.id]?.image}"
        />
	{/each}
  {/if}
</div>

<style>
  .sideScroll {
    display: flex;
    overflow-x: scroll;
    scrollbar-width: none;
    width: 100%;
  }

  sideScroll::-webkit-scrollbar{
    display: none;
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
</style>
