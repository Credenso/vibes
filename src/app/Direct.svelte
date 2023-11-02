<script>
  import { 
    memberDictionary,
    contentDictionary,
    activeMember,
    chats,
    keys,
    relay
  } from '../lib/stores'

  import { newMessageEvent, signEvent, publishEvent } from '../lib/nostr'
  import { prettyDate } from '../lib/util'

  import { onMount } from 'svelte'

  import Post from '../app/Post.svelte'

  let chatLog = undefined
  let uploading = false
  let comments = []
  let newMessage = ""
  let replyingTo = undefined

  const scroll = () => {
    const chatBox = document.querySelector('.chat')
    if (chatBox) {
      window.setTimeout(() => {
        chatBox.scrollTo(0, chatBox.scrollHeight)
      }, 100)
    }
  }

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

  activeMember.subscribe(id => {
    chatLog = $chats[id]
    scroll()
  })

  chats.subscribe(dict => {
    if (chatLog && chatLog.length < dict[$activeMember].length) {
      chatLog = dict[$activeMember]
      scroll()
    }
  })

  const handleComment = async (e) => {
    e.preventDefault()
    if (newMessage) {
      uploading = true
      const commentEvent = await newMessageEvent(newMessage, $keys.publicKey, $keys.privateKey, $activeMember)
      const signed = signEvent(commentEvent, $keys.privateKey)
      newMessage = ""
      replyingTo = undefined
      await publishEvent($relay, signed)
      uploading = false
    } 
  }
</script>

<div class="header">
   <h1 class="title">Messages</h1>
</div>
<div class="chat">
  {#if chatLog}
    {#each chatLog as message (message.id)}
      <section class="chatBox" class:me={message.pubkey === $keys.publicKey}>
        <div class="deets">
          <b>{$memberDictionary[message.pubkey]?.name || "NPC"}</b><hr><p>{prettyDate(new Date(message.ts * 1000))}</p>
        </div>
        <p class="comment">{message.text}</p>
      </section>
    {/each}
  {:else}
    <p>No Messages</p>
  {/if}
</div>

<form on:submit={handleComment} class="chatBox me">
  {#if uploading}
    <div class="deets">
      <p>Posting...</p>
    </div>
  {:else}
    <div class="deets">
      <b>{$memberDictionary[$keys?.publicKey]?.name || "NPC"}</b><hr><p>{prettyDate(new Date())}</p>
    </div>
    <div class="deets">
      <textarea name="comment" bind:value="{newMessage}" />
      <button type="submit">Comment</button>
    </div>
  {/if}
</form>

<style>
  .header {
    position: fixed;
    top: 0;
    left: 0;
    height: 4rem;
    width: 100%;
    background: white;
  }

  .title {
    font-size: 1.3em;
    font-weight: bold;
    margin: 0.5em;
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

  .chat {
    margin-top: 2em;
    margin-bottom: 4em;
    height: 56vh;
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
  }

  .me {
    align-self: end;
  }

  .chatBox {
    border: 2px solid;
    border-radius: 1em;
    margin: 0.5em;
    padding: 0.5em;
    width: fit-content;
    border-color: #445566;
    background-color: #EEEEEE;
  }

  form.chatBox {
    position: fixed;
    bottom: 0;
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

  .me:nth-child(3n) {
    border-color: #de5a5a;
    background-color: #de5a5a33;
  }

  .me:nth-child(3n+1) {
    border-color: #f8a147;
    background-color: #f8a14733;
  }

  .me:nth-child(3n+2) {
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
