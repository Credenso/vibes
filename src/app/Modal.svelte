<script>
  import CommentsBlock from './CommentsBlock.svelte'
  import TagsBlock from './TagsBlock.svelte'
  import { onMount, onDestroy } from 'svelte'
  import { 
    initRelay,
    RELAY_URL,
    newProfileEvent,
    publishEvent
  } from '../lib/nostr'
  import { 
    postDictionary,
    userDictionary,
    contentDictionary,
    activePost,
    activeSong,
    queue,
    modal
  } from '../lib/stores'


  const openModal = () => {
    $modal = true
  }

  const closeModal = () => {
    $modal = undefined
  }
</script>

<div on:click={closeModal} class:modal={$modal} class="overlay"></div>

<div class:modal={$modal} class="modalView">
  <slot />
</div>

<style>
  .overlay {
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: black;
    z-index: 200;
    transition: all 0.3s ease-in-out;
  }

  .modalView {
    display: flex;
    flex-direction: column;
    background: white;
    position: absolute;
    overflow: hidden;
    opacity: 0;
    width: min(90vw, 30em);
    height: 0;
    border-radius: 1em;
    top: 10vh;
    left: 5vw;
    box-shadow: 0 0 10em 0.5em;
    z-index: 201;
    transition: all 0.3s ease-in-out;
  }

  .modal.modalView {
    overflow-y: scroll;
    scrollbar-width: none;
    padding: 2em;
    opacity: 1;
    height: 80vh;
  }

  .modal.overlay {
    display: block;
    opacity: 0.3;
  }
</style>
