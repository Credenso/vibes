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
    queue
  } from '../lib/stores'

  let saving = false
  let modalOpen = false
  let event
  let author
  let postType

  // We need this if the postType is a collection
  let tracks = undefined
  let tab = "about"

  const getTracks = () => {
    tracks = []
    event.content.audio.forEach((id,i) => {
      // If there's a matching post for the ID, pull its audio file
      if ($postDictionary[id]) {
        tracks.push($postDictionary[id]?.content.audio)
      } else {
        tracks.push(id)
      }
    })
  }

  const openModal = () => {
    modalOpen = true

    // We only want to update this once
    if (event && postType === undefined) {
      author = $userDictionary[event.pubkey]
      postType = event.content.type
      if (postType === "collection") {
        getTracks()
      }
    }
  }

  const closeModal = () => {
    $activePost = undefined
    postType = undefined
    tab = "about"
    modalOpen = false
  }

  const goTo = (post_id) => {
    closeModal()
    activePost.set(post_id)
  }

  onMount(() => {
    activePost.subscribe((id) => {
      if (id) {
        event = $postDictionary[id]
        author = $userDictionary[event.pubkey]
        openModal()
      }
    })
  })

  const addToQueue = (priority = undefined) => {
    if (postType === "collection") {
      const queueItems = tracks.map(track_id => $contentDictionary[track_id])
      if (priority === 0) {
        $queue = [...queueItems, ...$queue]
      } else {
        queueItems.forEach(track => {
          $queue.push(track)
        })
      }

    } else if (postType === "single") {
      const audio = $contentDictionary[event.content.audio]
      if (priority === 0) {
        $queue = [audio, ...$queue]
      } else {
        $queue.push(audio)
      }
    }
  }

  const play = (id = undefined) => {
    if (id) {
      activeSong.set($contentDictionary[id])
    } else if (postType === "collection") {
      tracks.forEach((id,i) => {
        // If it's the first song, play it. Otherwise, queue it.
        if (i === 0) {
          activeSong.set($contentDictionary[id])
        } else {
          $queue.push($contentDictionary[id])
        }
      })
    } else if (postType === "single") {
      // otherwise it's a single, we don't have to worry about
      // Any of these strange shenannies
      activeSong.set($contentDictionary[post.content.audio])
    }
  }


</script>

<div on:click={closeModal} class:modalOpen class="overlay"></div>

<div class:modalOpen class="modal">
  {#if event}
    <p class="header">{event.content.name}</p>
    <small>posted {new Date(event.created_at * 1000).toDateString()}</small>
    <img src="{$contentDictionary[event.content.image]}" alt="img"/>
    {#if postType === "collection"}
      <div class="actions">
        <div class:activeTab={tab === "about"} on:click={() => tab = "about"}>About</div>
        <div class:activeTab={tab === "tracklist"} on:click={() => tab = "tracklist"}>Tracklist</div>
      </div>
    {/if}
    {#if tab === "about"}
      <p>{event.content.description}</p>
    {:else if tab === "tracklist"}
      <table>
        {#each tracks as track_id, i}
          <tr class:nowPlaying={$activeSong === $contentDictionary[track_id]} on:click={() => play(track_id)}>
            <td><b>{i+1}.</b></td>
            <td>{event.content.names[i]}</td>
            {#if $postDictionary[event.content.audio[i]] }
              <td><img on:click={() => goTo(event.content.audio[i])} src="hyperlink.png" alt="post_available" /></td>
            {:else}
              <td></td>
            {/if}
            {#if ($activeSong === $contentDictionary[track_id])}
              <td><img src="play.png" alt="play_icon" /></td>
            {:else}
              <td></td>
            {/if}

          </tr>
        {/each}
      </table>
    {/if}
    <a class="author" href="{author?.site || '#'}" target="_blank">-- {author?.name || "Anonymous"}</a>
    <div class="actions">
      <button on:click={() => addToQueue(0)}>Play Next</button>
      <button on:click={() => addToQueue()}>Add to Queue</button>
      <a class="button" href="{$contentDictionary[event.content.audio]}" download>Download</a>
    </div>
    {#if modalOpen}
      <hr>
      <p class="header">Comments</p>
      <CommentsBlock event={event} />
      <hr>
      <p class="header">Vibes</p>
      <TagsBlock bind:event />
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
    justify-content: space-around;
  }

  .activeTab {
    font-weight: bold;
    text-decoration: underline;
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

  tr {
    text-align: left;
    background: #DDDDEE;
  }

  tr:nth-child(even) {
    background: #EEEEEE;
  }

  tr.nowPlaying {
    background: #AACCFF;
  }

  td img {
    height: 1em;
    margin: 0;
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
