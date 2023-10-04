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
    activePost,
    queue
  } from '../lib/stores'

  let saving = false
  let modalOpen = false
  let data
  let author

  const openModal = () => {
    modalOpen = true
  }

  const closeModal = () => {
    $activePost = undefined
    modalOpen = false
  }

  onMount(() => {
    const unsubscribe = activePost.subscribe((id) => {
      if (id) {
        data = $postDictionary[id]
        author = $userDictionary[data.event.pubkey]
        openModal()
      }
    })

    // This is to prevent memory leaks?
    //onDestroy(unsubscribe)
  })

  const addToQueue = (priority = undefined) => {
    if (priority === 0) {
      $queue = [data.audio, ...$queue]
    } else {
      $queue.push(data.audio)
    }
  }

</script>

<div on:click={closeModal} class:modalOpen class="overlay"></div>

<div class:modalOpen class="modal">
  {#if data}
    <p class="header">{data.name}</p>
    <small>posted {new Date(data.event.created_at * 1000).toDateString()}</small>
    <img src="{data.image}" alt="img"/>
    <p>{data.description}</p>
    <a class="author" href="{author?.site || '#'}" target="_blank">-- {author?.name || "Anonymous"}</a>
    <div class="actions">
      <button on:click={() => addToQueue(0)}>Play Next</button>
      <button on:click={() => addToQueue()}>Add to Queue</button>
      <a class="button" href="{data.audio}" download>Download</a>
    </div>
    {#if modalOpen}
      <hr>
      <p class="header">Comments</p>
      <CommentsBlock event={data.event.id} />
      <hr>
      <p class="header">Vibes</p>
      <TagsBlock />
    {/if}
  {/if}
</div>

<style>
  @keyframes fadeBlue {
    0%   { background-color: #028A9B; }
    100% { background-color: #FFFFFF; }
  }

  button, a.button {
    padding: 0.5em;
    margin: 0.25em;
    border: 1px solid;
    border-radius: 0.25em;
    font-size: 0.9em;
  }

  button:focus, a:focus {
    animation: fadeBlue 0.7s ease-out;
  }

  button:active, a:focus {
    animation: none;
  }

  img {
    margin: 1em auto;
    border-radius: 0.5em;
  }

  hr {
    margin: .5em;
  }

  .author {
    color: #028a9b;
    text-decoration: unset;
    text-align: right;
    display: block;
    padding: 0.5em;
  }

  .actions {
    display: flex;
    flex-direction: row;
  }

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

  .header {
    font-size: 1.3em;
    font-weight: bold;
  }

  .modal {
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

  .modalOpen.modal {
    overflow-y: scroll;
    scrollbar-width: none;
    padding: 2em;
    opacity: 1;
    height: 80vh;
  }

  .modalOpen.modal::-webkit-scrollbar{
    display: none;
  }

  .modalOpen.overlay {
    display: block;
    opacity: 0.3;
  }
</style>
