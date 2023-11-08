<script>
  import { 
    memberDictionary,
    contentDictionary,
    activeMember,
    modal,
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
  let friend = undefined

  const scroll = () => {
    const chatBox = document.querySelector('.chat')
    if (chatBox) {
      window.setTimeout(() => {
        chatBox.scrollTo(0, chatBox.scrollHeight)
      }, 100)
    }
  }

  //onMount(() => {
  //  // Adds a listener for the Enter button to make a comment.
  //  document.onkeydown = async (e) => {
  //    e = e || window.event;
  //    switch (e.which || e.keyCode) {
  //      case 13 : 
  //        await handleComment(e)
  //        break;
  //    }
  //  }
  //})

  const readyMessage = (e) => {
    const key = (e) => {
      if (e.code === "Enter") {
        handleComment(e)
      }
    }

    e.target.addEventListener('keydown', key)
    e.target.addEventListener('blur', () => {
      e.target.removeEventListener('keydown', key)
    })
  }


  activeMember.subscribe(id => {
    friend = $memberDictionary[id]
    chatLog = $chats[id]
    scroll()
  })

  modal.subscribe(type => {
    if (type === "direct") {
      scroll()
    }
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

  const avatarURL = (pubkey) => {
    const member = $memberDictionary[pubkey]
    if (member && member.avatar) {
      return $contentDictionary[member.avatar]?.url
    } else {
      return "profile_photo.png"
    }
  }
</script>

<div class="header" on:click={() => $modal = "member"}>
  {#if friend}
  <img src={avatarURL($activeMember)} />
  <h1 class="title">{friend.display_name || friend.name}</h1>
  {/if}
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

<form id="msgForm" class="msgForm" >
  <input on:focus={readyMessage} autocomplete="off" type="text" placeholder="Send message" class="input" id="inputBox" bind:value={newMessage}/>
</form>

<style>
  .header {
    position: fixed;
    font-size: 1.5em;
    top: 0;
    left: 0;
    height: 4rem;
    width: 100%;
    background: white;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .header img {
    height: 48px;
    border-radius: 50%;
    flex-grow: 0;
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
    height: 62vh;
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
    scroll-behavior: smooth;
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

  .msgForm {
    width: 100%;
    padding: 1em;
    margin: auto;
    display: flex;
    position: absolute;
    bottom: 0;
    left: 0;
  }

  .msgForm select {
    flex-grow: 0;
    border-radius: 0.25em;
    padding: 0.25em;
  }

  .msgForm input {
    flex-grow: 1;
    background-color: #FFFFFF;
    padding: 0.5em;
    border: 2px solid #636B71;
    border-radius: 1em;
  }

</style>
