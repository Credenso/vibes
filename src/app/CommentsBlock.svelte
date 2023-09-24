<script>
  import { 
    postDictionary,
    commentsDictionary,
    userDictionary,
    keys,
    relay
  } from '../lib/stores'

  import { uploadSong } from '../lib/ipfs'
  import { newCommentEvent, publishEvent } from '../lib/nostr'
  import { prettyDate } from '../lib/util'

  import { onMount } from 'svelte'

  import Post from '../app/Post.svelte'

  export let event
  let uploading = false
  let comments = []
  let newComment = ""

  const handleComment = async (e) => {
    uploading = true
    e.preventDefault()
    if (newComment) {
      const commentEvent = newCommentEvent(newComment, event, $keys.publicKey, $keys.privateKey)
      newComment = ""
      await publishEvent($relay, commentEvent)
      uploading = false
    }
  }
</script>

{#if $commentsDictionary[event]}
  {#each $commentsDictionary[event] as comment (comment.id)}
    <section class="commentBox">
      <div class="deets">
        <b>{$userDictionary[comment.pubkey]?.name || "Anonymous"}</b><hr><p>{prettyDate(new Date(comment.created_at * 1000))}</p>
      </div>
      <p class="comment">{comment.content}</p>
    </section>
  {/each}
{:else}
  <p>No Comments</p>
{/if}
<section class="commentBox">
  {#if uploading}
    <div class="deets">
      <p>Posting...</p>
    </div>
  {:else}
    <div class="deets">
      <b>{$userDictionary[$keys?.publicKey]?.name || "Anonymous"}</b><hr><p>{prettyDate(new Date())}</p>
    </div>
    <div class="deets">
      <textarea name="comment" bind:value="{newComment}" />
      <button on:click={handleComment}>Comment</button>
    </div>
  {/if}
</section>


<style>
  textarea {
    width: 100%;
    border-radius: 0.5em;
    margin-right: 0.5em;
    padding: 0.25em;
  }

  button {
    border: 1px solid #213547;
    padding: 0.25em;
    align-self: end;
  }

  .commentBox {
    border: 1px solid;
    border-radius: 1em;
    margin: 0.5em;
    padding: 0.5em;
  }

  .commentBox:nth-child(3n) {
    border-color: #de5a5a;
    background-color: #de5a5a33;
  }

  .commentBox:nth-child(3n+1) {
    border-color: #f8a147;
    background-color: #f8a14733;
  }

  .commentBox:nth-child(3n+2) {
    border-color: #028a9b;
    background-color: #028a9b33;
  }

  .header {
    font-size: 1.5em;
  }

  .deets {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9em;
  }

  .deets hr {
    border-color: #213547;
    margin: 0.5em;
    flex-grow: 1
  }

  .comment {
    text-align: left;
    font-size: 1.1;
  }
</style>
