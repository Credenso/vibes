<script>
  import { 
    postDictionary,
    commentsDictionary,
    repliesDictionary,
    userDictionary,
    activePost,
    keys,
    relay
  } from '../lib/stores'

  import { uploadSong } from '../lib/ipfs'
  import { newCommentEvent, publishEvent } from '../lib/nostr'
  import { prettyDate } from '../lib/util'

  import { onMount } from 'svelte'

  import Post from '../app/Post.svelte'

  let event = $postDictionary[$activePost]
  let uploading = false
  let comments = []
  let newComment = ""
  let replyingTo = undefined

  onMount(() => {
    // Adds a listener for the Enter button to make a comment.
    document.onkeydown = async (e) => {
      e = e || window.event;
      switch (e.which || e.keyCode) {
        case 13 : 
          await handleComment(e)
          break;
      }
    }
  })

  activePost.subscribe(id => {
    event = $postDictionary[id]
  })

  const handleComment = async (e) => {
    e.preventDefault()
    if (newComment) {
      uploading = true
      const commentEvent = newCommentEvent(newComment, event.id, event.pubkey, $keys.publicKey, $keys.privateKey, replyingTo)
      newComment = ""
      replyingTo = undefined
      await publishEvent($relay, commentEvent)
      uploading = false
    } 
  }
</script>

<hr>
<h1 class="header">Comments</h1>

{#if $commentsDictionary[event.id]}
  {#each $commentsDictionary[event.id] as comment (comment.id)}
    <section class="commentBox">
      <div class="deets">
        <b>{$userDictionary[comment.pubkey]?.name || "NPC"}</b><hr><p>{prettyDate(new Date(comment.created_at * 1000))}</p>
      </div>
      <p class="comment">{comment.content}</p>
      <div class="actions">
        <small class="actionButton"><a on:click="{() => replyingTo = { id: comment.id, pubkey: comment.pubkey }}">Reply</a></small>
        <small class="actionButton"><a on:click="{() => replyingTo = { id: comment.id, pubkey: comment.pubkey }}">Block</a></small>
      </div>
    </section>
  {#if $repliesDictionary[comment.id]}
    {#each $repliesDictionary[comment.id] as reply (reply.id)}
      <section class="commentBox reply">
        <div class="deets">
          <b>{$userDictionary[reply.pubkey]?.name || "NPC"}</b><hr><p>{prettyDate(new Date(reply.created_at * 1000))}</p>
        </div>
        <p class="comment">{reply.content}</p>
      </section>
    {/each}
  {/if}
  {/each}
{:else}
  <p>No Comments</p>
{/if}

<form on:submit={handleComment} class="commentBox">
  {#if uploading}
    <div class="deets">
      <p>Posting...</p>
    </div>
  {:else}
    <div class="deets">
      <b>{$userDictionary[$keys?.publicKey]?.name || "NPC"}</b><hr><p>{prettyDate(new Date())}</p>
    </div>
    {#if replyingTo}
    <div class="deets">
      Replying to {$userDictionary[replyingTo.pubkey]?.name || "NPC"}
      <button class="cancel" on:click={() => replyingTo = undefined}>X</button>
    </div>
    {/if}
    <div class="deets">
      <textarea name="comment" bind:value="{newComment}" />
      <button type="submit">Comment</button>
    </div>
  {/if}
</form>

<style>
  .header {
    font-size: 1.3em;
    font-weight: bold;
  }

  hr {
    margin: 0.5em;
  }

  textarea {
    width: 100%;
    border-radius: 0.5em;
    margin-right: 0.5em;
    padding: 0.25em;
  }

  @keyframes fadeBlue {
    0%   { background-color: #028A9B; }
    100% { background-color: #FFFFFF; }
  }

  button {
    border: 1px solid #213547;
    padding: 0.25em;
    align-self: end;
  }

  button.cancel {
    width: 2em;
  }

  .commentBox {
    border: 2px solid;
    border-radius: 1em;
    margin: 0.5em;
    padding: 0.5em;
  }

  .actions {
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: end;
    gap: 1em;
  }

  .actionButton {
    padding-right: 0.5em;
    cursor: pointer;
  }

  .reply {
    margin-left: 2em;
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
