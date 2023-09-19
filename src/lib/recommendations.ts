import { Kind } from "./nostr";

export function shuffle(array: any[]) {
    let currentIndex = array.length,
        randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex > 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
        ];
    }

    return array;
}

export const getLatestPosts: () => Promise<NostrPacket[]> = async () => {
    return shuffle([
        ...Array.from({ length: 6 }, () => ({
            kind: Kind.post,
            pubKey: "pubKey",
            timestamp: 123,
            content: "ipfs_key",
            tags: [],
            id: 123,
            sig: "sig",
        })),
        ...Array.from({ length: 6 }, () => ({
            kind: Kind.album,
            pubKey: "pubKey",
            timestamp: 123,
            content: "ipfs_key",
            tags: [],
            id: 123,
            sig: "sig",
        })),
    ]);
};

export const getRecommendedPosts: () => Promise<NostrPacket[]> = async () => {
    return shuffle([
        ...Array.from({ length: 6 }, () => ({
            kind: Kind.post,
            pubKey: "pubKey",
            timestamp: 123,
            content: "ipfs_key",
            tags: [],
            id: 123,
            sig: "sig",
        })),
        ...Array.from({ length: 6 }, () => ({
            kind: Kind.album,
            pubKey: "pubKey",
            timestamp: 123,
            content: "ipfs_key",
            tags: [],
            id: 123,
            sig: "sig",
        })),
    ]);
};
