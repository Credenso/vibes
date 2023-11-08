<script>
    import { onMount } from 'svelte';
    import {
        memberDictionary,
        contentDictionary,
        activeMember,
        modal,
        relay,
        keys,
        chats
    } from '../lib/stores'

    import  {
        getEvents,
        newPubChannelEvent,
        newPubChannelMessageEvent,
        signEvent,
        publishEvent
    } from '../lib/nostr'

    import {
        prettyDate
    } from '../lib/util'

    import { nip04, nip44 } from 'nostr-tools'

    export let profile;

    let people = []
    let channels = []
    let secrets = {}
    let activeChannel = undefined
    let messageDraft = undefined
    let panel = "direct"

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

    const avatarURL = (pubkey) => {
        const member = $memberDictionary[pubkey]
        if (member && member.avatar) {
            return $contentDictionary[member.avatar]?.url
        } else {
            return "profile_photo.png"
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

    const processPubchat = async (event) => {
        const channelTag = event.tags.find(t => t[0] === "e")
        const channelID = (channelTag ? channelTag[1] : event.id)
        if ($chats[channelID] === undefined) {
            $chats[channelID] = [{}]
        }

        if (event.kind !== 42) {
            event.content = JSON.parse(event.content)
        }

        switch(event.kind) {
            case 40:
                // New Channel
                const newChannel = { name: event.content.name, id: channelID, about: event.content.about }
                channels = [...channels, newChannel]

                // This is our "General" channel
                if (newChannel.name === "General") activeChannel = newChannel
            case 41:
                // Channel Update / New Channel
                $chats[channelID][0] = event
                break
            case 42:
                // May need special interaction for 43/44
                const sorted = [...$chats[channelID], event].sort((m1, m2) => {
                    return m1.created_at > m2.created_at
                })
                $chats[channelID] = sorted
                break
            case 43:
            case 44:
        }
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

            // TODO: Activate pubchat
            let pubchat = await r.list([
                { kinds: [40, 41, 42, 43, 44] }
            ])

            let pubfeed = r.sub([
                { kinds: [40, 41, 42, 43, 44], since: Math.floor(Date.now() / 1000) },
            ])

            pubfeed.on('event', async event => {
                await processPubchat(event)
            })

            await Promise.all(pubchat.map(async (event) => processPubchat(event)))

            // Ideally, this should be done by the Solar server
            // Whenever a follow event occurs
            if (channels.length === 0) {
                //newChannel()
            }

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

            chats.subscribe(memberChats => {
                people = Object.keys(memberChats).sort((p1, p2) => {
                    const index1 = $chats[p1].length - 1
                    const latest1 = $chats[p1][index1]
                    const index2 = $chats[p2].length - 1
                    const latest2 = $chats[p2][index2]
                    return latest1.ts < latest2.ts
                })
            })
        }
    })

    const newChannel = () => {
        const metadata = {
            name: "General",
            about: "This is a global chat for everyone on the page - be kind.",
            picture: undefined
        }

        const chan = channels.find(channel => channel.name = metadata.name)

        if (!chan) {
            const event = newPubChannelEvent(metadata, $keys.publicKey)
            const signed = signEvent(event, $keys.privateKey)
            publishEvent($relay, signed)
        }
    }

    const readyMessage = (e) => {
        const key = (e) => {
            if (e.code === "Enter" && activeChannel) {
                send()
            }
        }

        e.target.addEventListener('keydown', key)
        e.target.addEventListener('blur', () => {
            e.target.removeEventListener('keydown', key)
        })
    }

    const send = () => {
        console.log(messageDraft)
        const event = newPubChannelMessageEvent(messageDraft, activeChannel.id, $keys.publicKey)
        const signed = signEvent(event, $keys.privateKey)
        publishEvent($relay, signed)

        messageDraft = undefined
    }

    const openProfile = (pubkey) => {
        $activeMember = pubkey
        $modal = "member"
    }

    const openChat = (pubkey) => {
        $activeMember = pubkey
        $modal = "direct"
    }

    const latestMessage = (pubkey) => {
        const index = $chats[pubkey].length - 1
        const message = $chats[pubkey][index]
        const who = (message.pubkey === $keys.publicKey) ? "You: " : "Them: "
        return `${who}${message.text.substring(0,20)}...`
    }

    const getName = (pubkey) => {
        const member = $memberDictionary[pubkey]
        if (member) {
            return member.display_name || member.name
        } else {
            return 'NPC'
        }
    }

</script>

<div class="panelSelector">
    <div on:click={() => panel = "direct"} class:underlined={panel === "direct"}>Direct Messages</div>
    <div on:click={() => panel = "public"} class:underlined={panel === "public"}>Chatroom</div>
</div>
<hr>
{#if panel === "public"}
    {#if activeChannel && $chats[activeChannel.id] }
        <h2>{activeChannel.name}</h2>
        <p class="msg">
            {activeChannel.about}
        </p>
        <hr>
        <div class="chat">
            {#each $chats[activeChannel.id].filter(m => m.kind === 42) as message}
                <div class="message">
                    <div class="profile" on:click={openProfile(message.pubkey)}>
                        {#if avatarURL(message?.pubkey)}
                            <img src="{avatarURL(message.pubkey)}" alt="profile_photo"/>
                        {:else}
                            <img src="profile_photo.png" alt="profile_photo"/>
                        {/if}
                        <b>{getName(message?.pubkey)}</b>
                    </div>
                    <p>{message.content}</p>
                    <small class="timestamp">{prettyDate(new Date(message.created_at * 1000))}</small>
                </div>
            {/each}
        </div>
    {/if}
    {#if activeChannel}
        <form id="msgForm" class="msgForm" >
            <select
                value={activeChannel}
                on:change={() => (messageDraft = undefined)}
                >
                {#each channels as channel}
                    <option value={channel}>
                    {channel.name}
                    </option>
                {/each}
            </select>
            <input on:focus={readyMessage} autocomplete="off" type="text" placeholder="Send message" class="input" id="inputBox" bind:value={messageDraft}/>
        </form>
    {/if}
{:else}
    <div class="chat">
        {#each people as person}
            {#if $memberDictionary[person]}
                <div class="DMBlock" on:click={openChat(person)}>
                    <div class="profile">
                        {#if avatarURL(person)}
                            <img src="{avatarURL(person)}" alt="profile_photo"/>
                        {:else}
                            <img src="profile_photo.png" alt="profile_photo"/>
                        {/if}
                        <b>{getName(person)}:</b>
                    </div>
                    <p>{latestMessage(person)}</p>
                    <hr/>
                </div>
            {/if}
        {/each}
    </div>
{/if}

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

    .timestamp {
        position: static;
        font-size: 0.7em;
        width: fit-content;
        top: 0;
        right: 0;
    }

    .profile {
        display: flex;
        flex-direction: row;
        align-self: start;
        align-items: center;
        margin-right: 1em;
        width: fit-content;
    }

    .DMBlock {
        display: flex;
        align-items: center;
        margin: 0.5em;
        margin-bottom: 0;
        background-color: #FFFFFF;
        border-radius: 0.25em;
    }

    .profile img {
        height: 1.5em;
        width: 1.5em;
        object-fit: cover;
        border-radius: 50%;
        margin: 0.5em;
    }

    .msgForm {
        width: 100%;
        padding: 1em;
        margin: auto;
        display: flex;
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

    .panelSelector {
        display: flex;
        font-size: 1.2em;
        justify-content: center;
        gap: 2em;
    }

    .underlined {
        font-weight: bold;
        text-decoration: underline;
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
