<script>
    import { onMount } from 'svelte';
    import {
        userDictionary,
        relay,
        keys,
        chats
    } from '../lib/stores'

    import  {
        getEvents
    } from '../lib/nostr'

    import { nip04, nip44 } from 'nostr-tools'

    export let profile;

    let people = []
    let secrets = {}

    const getSharedKey = (member) => {
        let existing = secrets[member] 
        if (existing) {
            return existing
        } else {
            const newKey = nip44.getSharedSecret($keys.privateKey, member)
            secrets[member] = newKey
            return newKey
        }
    }

    const processDM = async (event) => {
        let member
        if (event.pubkey === $keys.publicKey) {
            // It's from us, who's it to?
            const pTag = event.tags.find(t => t[0] === "p")
            member = pTag[1]
        } else {
            // It's from someone else
            member = event.pubkey
        }

        const msg = {
            ts: event.created_at,
            text: await nip04.decrypt($keys.privateKey, member, event.content),
            //text: nip44.decrypt(key, event.content),
            pubkey: event.pubkey,
            id: event.id
        }

        if ($chats[member]) {
            const sorted = [...$chats[member], msg].sort((m1, m2) => {
                return m1.ts > m2.ts
            })
            $chats[member] = sorted
        } else {
            $chats[member] = [msg]
        }

        return msg
    }

    relay.subscribe(async r => {
        if (r?.authorized) {
            const history = await r.list([
                { kinds: [4], "#p": [$keys.publicKey] },
                { kinds: [4], author: [$keys.publicKey] }
            ])

            await Promise.all(history.map(async (event) => processDM(event)))

            let feed = r.sub([
                { kinds: [4], "#p": [$keys.publicKey], since: Math.floor(Date.now() / 1000) },
                { kinds: [4], author: [$keys.publicKey], since: Math.floor(Date.now() / 1000) }
            ])

            feed.on('event', async event => {
                await processDM(event)
            })

            // Keepalive
            window.setInterval(async () => {
                await r.list([
                    { 
                        kinds: [4],
                        since: Math.floor(Date.now() / 1000)
                    }
                ])
                //Promise.all(events.map(async (event) => processEvent(event)))
            }, 1000 * 30)

            chats.subscribe(userChats => {
                people = Object.keys(userChats)
            })
        }
    })
</script>

<h2>Solar Chat</h2>
<p class="msg">
    This is a global chat for everyone on the page - be kind.
</p>
<hr>
<div class="chat">
    {#each people as person}
        <p>{$userDictionary[person]?.name}</p>
        {#if $chats[person]}
            {#each $chats[person] as message}
                <div class="message">
                    <div class="profile">
                        {#if $userDictionary[message.pubkey].picture}
                            <img src="{$userDictionary[message.pubkey].picture}" alt="profile_photo"/>
                        {:else}
                            <img src="profile_photo.png" alt="profile_photo"/>
                        {/if}
                        <b>{$userDictionary[message.pubkey].name}:</b>
                    </div>
                    <p>{message.text}</p>
                </div>
            {/each}
        {/if}
        <hr/>
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
