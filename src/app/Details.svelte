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
    activeUser,
    queue,
    modal
  } from '../lib/stores'

  let saving = false
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
      author = $userDictionary[event.pubkey]
      postType = event.content.type
      if (postType === "collection") {
        getTracks()
      }
  }

  const closeModal = () => {
    $activePost = undefined
    postType = undefined
    tab = "about"
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
      const queueItems = tracks.map(track_id => $contentDictionary[track_id].url)
      if (priority === 0) {
        $queue = [...queueItems, ...$queue]
      } else {
        queueItems.forEach(track => {
          $queue.push(track)
        })
      }

    } else if (postType === "single") {
      const audio = $contentDictionary[event.content.audio].url
      if (priority === 0) {
        $queue = [audio, ...$queue]
      } else {
        $queue.push(audio)
      }
    }
  }

  const play = (id = undefined) => {
    if (id) {
      activeSong.set($contentDictionary[id].url)
    } else if (postType === "collection") {
      tracks.forEach((id,i) => {
        // If it's the first song, play it. Otherwise, queue it.
        if (i === 0) {
          activeSong.set($contentDictionary[id].url)
        } else {
          $queue.push($contentDictionary[id].url)
        }
      })
    } else if (postType === "single") {
      // otherwise it's a single, we don't have to worry about
      // Any of these strange shenannies
      activeSong.set($contentDictionary[post.content.audio].url)
    }
  }

  const visit = (user_id) => {
    $modal = undefined
    $activeUser = user_id
    window.setTimeout(() => $modal = "member", 200)
  }

</script>

<section>
  {#if event}
    <p class="header">{event.content.name}</p>
    <a class="subtitle" on:click={() => visit(event.pubkey)}><img class="micro" src="{$contentDictionary[author?.avatar]?.url || "profile_photo.png"}"/> {author?.name} - posted {new Date(event.created_at * 1000).toDateString()}</a> 
    <img src="{$contentDictionary[event.content.image].url}" alt="img"/>
    {#if postType === "collection"}
      <div class="actions">
        <div class:activeTab={tab === "about"} on:click={() => tab = "about"}>About</div>
        <div class:activeTab={tab === "tracklist"} on:click={() => tab = "tracklist"}>Tracklist</div>
      </div>
    {/if}
    {#if tab === "about"}
      <p class="description">{event.content.description}</p>
    {:else if tab === "tracklist"}
      <table>
        {#each tracks as track_id, i}
          <tr class:nowPlaying={$activeSong === $contentDictionary[track_id].url} on:click={() => play(track_id)}>
            <td><b>{i+1}.</b></td>
            <td>{event.content.names[i]}</td>
            {#if $postDictionary[event.content.audio[i]] }
              <td><img on:click={() => goTo(event.content.audio[i])} src="hyperlink.png" alt="post_available" /></td>
            {:else}
              <td></td>
            {/if}
            {#if ($activeSong === $contentDictionary[track_id].url)}
              <td><img src="play.png" alt="play_icon" /></td>
            {:else}
              <td></td>
            {/if}

          </tr>
        {/each}
      </table>
    {/if}
    <div class="actions">
      <button on:click={() => addToQueue(0)}>Play Next</button>
      <button on:click={() => addToQueue()}>Add to Queue</button>
    </div>
    <CommentsBlock />
    <TagsBlock />
  {/if}
</section>

<style>
  @keyframes fadeBlue {
    0%   { background-color: #028A9B; }
    100% { background-color: #FFFFFF; }
  }

  section {
    font-family: "Montserrat";
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

  img.micro {
    border-radius: 50%;
    display: inline;
    height: 1rem;
    margin: 0;
  }

  .author {
    color: #028a9b;
    text-decoration: unset;
    text-align: right;
    display: block;
    padding: 0.5em;
  }

  .description {
    padding: 0.5em;
  }

  .actions {
    display: flex;
    flex-direction: row;
    justify-content: start;
  }

  .activeTab {
    font-weight: bold;
    text-decoration: underline;
  }

  .header {
    font-family: "Comfortaa";
    font-size: 1.3em;
    font-weight: bold;
  }

  .subtitle {
    font-family: "Comfortaa";
    font-size: 0.8em;
  }

  table {
    width: 100%;
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
</style>