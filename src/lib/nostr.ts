import {
    generatePrivateKey,
    getPublicKey,
    validateEvent,
    verifySignature,
    getSignature,
    getEventHash,
    finishEvent,
    VerifiedEvent,
    UnsignedEvent,
    relayInit,
    nip04,
    nip44,
    Relay,
    SimplePool,
} from "nostr-tools";

export const RELAY_URL = "ws://localhost:9481/";

// --- Key Management ---
//
export const genKeys = () => {
    let sk = generatePrivateKey();
    let pk = getPublicKey(sk);

    return { sk, pk };
};

export const unsecuredLocalKeys = () => {
    let publicKey = window.localStorage.getItem('vibes_public_key')
    let privateKey = window.localStorage.getItem('vibes_private_key')

    if (!privateKey) {
        let newKeys = genKeys()
        privateKey = newKeys.sk
        publicKey = newKeys.pk

        window.localStorage.setItem('vibes_private_key', privateKey)
        window.localStorage.setItem('vibes_public_key', publicKey)
    }

    return { privateKey, publicKey }
}

// TODO: Integrate this interface
interface Event {
    kind: number,
    content: string,
    public_key: string,
    private_key: string,
    tags: string[][]
}

// TODO: Should separate the signing and validation process
const genericEvent = (
    kind: number,
    content: string,
    public_key: string,
    private_key: string,
    tags: string[][]
) => {
    const unsignedEvent: UnsignedEvent<number> = {
        kind: kind,
        pubkey: public_key,
        created_at: Math.floor(Date.now() / 1000),
        tags: tags,
        content: content,
    };

    const id = getEventHash(unsignedEvent);
    const sig = getSignature(unsignedEvent, private_key);

    const signedEvent = {
        ...unsignedEvent,
        id,
        sig,
    };

    let ok = validateEvent(signedEvent);
    let veryOk = verifySignature(signedEvent);

    if (ok) {
        return finishEvent(signedEvent, private_key);
    } else {
        return null;
    }
};

const genericUnsignedEvent = (
    kind: number,
    content: string,
    public_key: string,
    tags: string[][]
) => {
    const unsignedEvent: UnsignedEvent<number> = {
        kind: kind,
        pubkey: public_key,
        created_at: Math.floor(Date.now() / 1000),
        tags: tags,
        content: content,
    };

    return unsignedEvent
}

export const signEvent = (event: UnsignedEvent, private_key: string) => {
    const id = getEventHash(event);
    const sig = getSignature(event, private_key);

    const signedEvent = {
        ...event,
        id,
        sig,
    };

    let ok = validateEvent(signedEvent);
    let veryOk = verifySignature(signedEvent);

    if (ok) {
        return finishEvent(signedEvent, private_key);
    } else {
        return null;
    }
}

// TODO: Refactor this to accord to NIPs
// Auth is important! NIP-42
// Kind 1063 for linked content/files (NIP-94)
export enum Kind {
    "profile" = 0,
    "post" = 1,
    //"album" = 2,
    "contacts" = 3,
    "message" = 4,
    "delete" = 5,
    "reaction" = 7,
    "channelCreate" = 40,
    "channelMetadata" = 41,
    "channelMessage" = 42,
    "channelHide" = 43,
    "channelMute" = 44,
    "vibe" = 1618,
    "blockList" = 10000
}

// TODO: Refactor this to accord to NIPs
export enum Tag {
    "event" = "e",
    "pubkey" = "p"
}

export const newProfileEvent = (
    // TODO: Profile interface
    profile_metadata: any,
    public_key: string,
) => {
    return genericUnsignedEvent(Kind.profile, JSON.stringify(profile_metadata), public_key, []);
};

export const newMessageEvent = async (
    message: string,
    public_key: string,
    secret_key: string,
    target: string,
) => {
    //let key = nip44.getSharedSecret(secret_key, target)
    //let ciphertext = nip44.encrypt(key, message)
    let ciphertext = await nip04.encrypt(secret_key, target, message)
    let tags = [["p", target]]
    return genericUnsignedEvent(Kind.message, ciphertext, public_key, tags);
};

export const newBlockListEvent = async (
    publically_blocked_keys: string[],
    privately_blocked_keys: string[],
    public_key: string,
    secret_key = undefined
) => {
    let p_tags = []
    publically_blocked_keys.forEach(k => {
        p_tags.push(['p',k])
    })

    console.log('pubblock', p_tags)

    let cipher = ""
    if (secret_key) {
        let s_tags = []
        privately_blocked_keys.forEach(k => {
            s_tags.push(['p',k])
        })
        cipher = await nip04.encrypt(secret_key, public_key, JSON.stringify(s_tags))
    }
    return genericUnsignedEvent(Kind.blockList, cipher, public_key, p_tags);
};

export const newPostEvent = (
    ipfs_link: string,
    public_key: string,
    private_key: string
) => {
    return genericEvent(Kind.vibe, ipfs_link, public_key, private_key, []);
};

//export const newCollectionEvent = (
//    ipfs_link: string,
//    public_key: string,
//    private_key: string
//) => {
//    return genericEvent(Kind.album, ipfs_link, public_key, private_key, []);
//};

export const newReactionEvent = (
    reaction: string,
    public_key: string,
    post: VerifiedEvent
) => {
    return genericUnsignedEvent(
        Kind.reaction, 
        reaction, 
        public_key, 
        [
            [Tag.event, post.id],
            [Tag.pubkey, post.pubkey]
        ]
    );
};

export const newContactsEvent = (
    public_key: string,
    contactList: string[]
) => {
    return genericUnsignedEvent(
        Kind.contacts, 
        "", 
        public_key, 
        [
            ...contactList
        ]
    );
};

export const newDeleteEvent = (
    public_key: string,
    deleteList: string[],
    reason = undefined
) => {
    let tags = []
    deleteList.forEach(target => {
        const tag = ["e", target]
        tags.push(tag)
    })

    return genericUnsignedEvent(
        Kind.delete, 
        reason || "", 
        public_key, 
        tags
    );
};

export const newCommentEvent = (
    comment: string,
    post_id: string,
    post_pubkey: string,
    public_key: string,
    private_key: string,
    replying_to = { id: undefined, pubkey: undefined }
) => {
    // We always use this tag in comments
    let pubkeys = [Tag.pubkey, post_pubkey]
    
    // Add the person being replied to if they exist
    if (replying_to?.pubkey) pubkeys.push(replying_to.pubkey)

    let tags = [
        [Tag.event, post_id, RELAY_URL, "root"]
    ]

    // Add the 'reply' tag if it's a reply
    if (replying_to?.id) tags.push([Tag.event, replying_to.id, RELAY_URL, "reply"])

    return genericEvent(
        Kind.post, 
        comment, 
        public_key, 
        private_key, 
        tags
    );
};

// Public Chat
export const newPubChannelEvent = (
    // TODO: Profile interface
    metadata: any,
    public_key: string,
) => {
    if (metadata.name && metadata.about) {
        return genericUnsignedEvent(Kind.channelCreate, JSON.stringify(metadata), public_key, []);
    } else {
        return { error: "invalid metadata" }
    }
};

export const newPubChannelDataEvent = (
    // TODO: Profile interface
    metadata: any,
    channel_id: string,
    public_key: string,
) => {
    if (metadata.name && metadata.about && metadata.picture) {
        return genericUnsignedEvent(Kind.channelMetadata, JSON.stringify(metadata), public_key, [["e", channel_id]]);
    } else {
        return { error: "invalid metadata" }
    }
};

export const newPubChannelMessageEvent = (
    // TODO: Profile interface
    message: string,
    channel_id: string,
    public_key: string,
    responding_to = undefined,
) => {
    let tags = [["e", channel_id, RELAY_URL, "root"]]
    if (responding_to) {
        const { r_pubkey, r_event_id } = responding_to
        tags.push(["e", r_event_id, RELAY_URL, "reply"])
        tags.push(["p", r_pubkey, RELAY_URL])
    }

    if (message !== undefined) {
        return genericUnsignedEvent(Kind.channelMessage, message, public_key, tags);
    } else {
        return { error: "invalid metadata" }
    }
};

export const newPubChannelHideEvent = (
    // TODO: Profile interface
    reason: Object,
    message_id: string,
    public_key: string,
) => {
    let tags = [["e", message_id]]

    if (message !== undefined) {
        return genericUnsignedEvent(Kind.channelHide, JSON.stringify(reason), public_key, tags);
    } else {
        return { error: "invalid metadata" }
    }
};

export const newPubChannelMuteEvent = (
    // TODO: Profile interface
    reason: Object,
    member_id: string,
    public_key: string,
) => {
    let tags = [["p", member_id]]

    if (message !== undefined) {
        return genericUnsignedEvent(Kind.channelMute, JSON.stringify(reason), public_key, tags);
    } else {
        return { error: "invalid metadata" }
    }
};

// --- Relay / Event Management ---

export const initRelay = async (url: string) => {
    const relay = relayInit(url);

    relay.on("connect", () => {
        console.log(`connected to ${relay.url}`);
    });
    relay.on("error", () => {
        console.log(`failed to connect to ${relay.url}`);
    });

    await relay.connect();

    return relay;
};

export const getEvents = async (relay: Relay, filters: any[]) => {
    const events = await relay.list(filters);
    return events;
};

interface PostsFilter {
    kinds: number[];
    author?: string[];
    limit?: number;
    since?: number;
}

// Get posts, optionally from a specific author
export const getPosts = async (relay: Relay, author = "", limit = 0, delta = 0) => {
    let filter: PostsFilter = { kinds: [1] };
    if (author) {
        filter["author"] = [author];
    }

    if (limit) {
        filter["limit"] = limit;
    }

    // delta is a measure of how far back to pull posts (in seconds)
    if (delta) {
        delta = delta * 1000;
        const now = new Date();
        filter["since"] = Math.floor(now.getTime() / 1000) - delta;
    }

    const posts = await getEvents(relay, [filter]);
    return posts;
};

export const getMembers = async (relay: Relay) => {
    const posts = await getEvents(relay, [{ kinds: [Kind.profile] }]);
    return posts;
};

export const getCollections = async (relay: Relay) => {
    const posts = await getEvents(relay, [{ kinds: [2] }]);
    return posts;
};

export const latestPosts = async (relay: Relay, latest = 10) => {
    // This is a block for getting the n latest posts (more or less)
    let found = 0;
    let posts: any[] = [];
    let default_delta = 60 * 60; // Start with 1 hour

    while (found < latest) {
        // This is a base case. If we have found some results and the
        // latest iteration did not find more, we return what we have.

        if (found && posts.length == found) {
            break;
        }

        posts = await getPosts();
        default_delta *= 10; // Multiply by 10 each iteration
        found = posts.length;
    }

    return posts;
};

export const getEvent = async (relay: Relay, id: string) => {
    const event = await getEvents(relay, [{ ids: [id] }]);
    return event;
};

export const publishEvent = async (
    relay: Relay,
    event: VerifiedEvent<number>
) => {
    if (event !== undefined) {
        await relay.publish(event);
    }
};
