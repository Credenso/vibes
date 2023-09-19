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

// TODO: Refactor this to accord to NIPs
// Likes are Kind 7 (NIP-25)
// Profile is extended by NIP-39
// Auth is important! NIP-42
// Kind 30078 for Vibes data (NIP-78)
// Kind 1063 for linked content/files (NIP-94)
export enum Kind {
    "profile" = 0,
    "post" = 1,
    "album" = 2,
    "like" = 3,
    "comment" = 4,
    "follow" = 5,
}

// TODO: Refactor this to accord to NIPs
export enum Tag {
    "replying_to" = "e",
    "users" = "p"
}

export const newPostEvent = (
    ipfs_link: string,
    public_key: string,
    private_key: string
) => {
    return genericEvent(Kind.post, ipfs_link, public_key, private_key, []);
};

export const newCollectionEvent = (
    ipfs_link: string,
    public_key: string,
    private_key: string
) => {
    return genericEvent(Kind.album, ipfs_link, public_key, private_key, []);
};

export const newLikeEvent = (
    post_id: string,
    public_key: string,
    private_key: string
) => {
    return genericEvent(Kind.like, "", public_key, private_key, [
        ["post", post_id],
    ]);
};

export const newCommentEvent = (
    comment: string,
    post_id: string,
    public_key: string,
    private_key: string,
    replying_to = ""
) => {
    return genericEvent(Kind.comment, comment, public_key, private_key, [
        [Tag.replying_to, post_id],
        [Tag.users, public_key],
    ]);
};

// --- Relay / Event Management ---

export const initRelay = async (url: string) => {
    // const relay = relayInit('ws://10.33.141.120/relay')

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

const getEvents = async (relay: Relay, filters: any[]) => {
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
const _getPosts = async (relay: Relay, author = "", limit = 0, delta = 0) => {
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

export const getPosts = async () => {
    let relay = await initRelay(RELAY_URL);
    return _getPosts(relay);
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
    if (event) {
        await relay.publish(event);
    }
};
