<script>
    import { onMount } from 'svelte';
    export let profile;

    let messages = []

    const scroll = () => {
        const chatBox = document.querySelector('.chat')
        if (chatBox) {
            window.setTimeout(() => {
            chatBox.scrollTo(0, chatBox.scrollHeight)
            }, 100)
        }
    }

    onMount(() => {
        const ws = new WebSocket(`ws://solar.credenso.cafe`);
        ws.binaryType = "blob";
        // Log socket opening and closing
        ws.addEventListener("open", event => {
            console.log("Websocket connection opened");
        });
        ws.addEventListener("close", event => {
            console.log("Websocket connection closed");
        });
        ws.onmessage = function (message) {
            if (message.data instanceof Blob) {
                const reader = new FileReader();
                reader.onload = () => {
                    const parsed_message = JSON.parse(reader.result)
                    messages = [...messages, parsed_message]
                };
                console.log('message', message)
                reader.readAsText(message.data);
            } else {
                const parsed_message = JSON.parse(reader.result)
                messages = [...messages, parsed_message]
            }
            scroll()
        }
        const form = document.getElementById('msgForm');
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            console.log('profile', profile)
            const message = {
                text: document.getElementById('inputBox').value,
                profile
            }
            
            ws.send(JSON.stringify(message));
            document.getElementById('inputBox').value = ''
        })
    })
</script>

<h2>Solar Chat</h2>
<p class="msg">
    This is a global chat for everyone on the page - be kind.
</p>
<hr>
<div class="chat">
    {#each messages as message}
        <div class="message">
            <div class="profile">
                {#if message.profile.picture}
                    <img src="{message.profile.picture}" alt="profile_photo"/>
                {:else}
                    <img src="profile_photo.png" alt="profile_photo"/>
                {/if}
                <b>{message.profile.name}:</b>
            </div>
            <p>{message.text}</p>
        </div>
    {/each}
</div>
<form id="msgForm" class="msgForm">
    <input autocomplete="off" type="text" placeholder="Send message" class="input" id="inputBox" />
</form>

<style>
    .msg {
        padding: 1em;
        padding-top: 0;
    }

    h2 {
        font-size: 1.5em;
    }

    .chat {
        display: flex;
        flex-direction: column;
        overflow-y: scroll;
        overflow-x: hidden;
        height: 80vh;
    }

    .message {
        display: flex;
        margin: 0.25em auto;
        border-radius: 0.5em;
        flex-direction: row;
        width: 95%;
        text-align: left;
        align-content: top;
    }

    .message p {
        min-height: 1.5em;
        padding-left: 0.5em;
        margin: 0.5em;
        width: 100%;
    }

    .profile {
        display: flex;
        flex-direction: row;
        align-self: start;
        align-items: center;
        margin-right: 1em;
        width: fit-content;
    }

    .profile img {
        height: 1.5em;
        margin: 0.5em;
    }

    .msgForm {
        width: 100%;
        padding: 1em;
        margin: auto;
    }

    .msgForm input {
        width: 100%;
        background-color: #FFFFFF;
        padding: 0.5em;
        border: 2px solid #636B71;
        border-radius: 1em;
    }

    .message:nth-child(3n) {
        border-color: #de5a5a;
        background-color: #de5a5a33;
    }

    .message:nth-child(3n+1) {
        border-color: #f8a147;
        background-color: #f8a14733;
    }

    .message:nth-child(3n+2) {
        border-color: #028a9b;
        background-color: #028a9b33;
    }
</style>
