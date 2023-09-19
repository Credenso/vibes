import {
    genKeys,
    newPostEvent,
    initRelay,
    publishEvent,
    RELAY_URL,
} from "./nostr";

const IPFS_URL = "http://localhost:5001/api/v0";
const IPFS_FILE_BASE = "http://localhost:8080/ipfs/";

interface IpfsResponse {
    Name: string;
    Hash: string;
    Size: number;
}

const uploadFile = async (f: File) => {
    let data = new FormData();
    data.append("files", f, f.name);

    const res = await fetch(`${IPFS_URL}/add`, {
        method: "POST",
        body: data,
    });

    return ((await res.json()) as IpfsResponse).Hash;
};

//form post rqeuest
export const uploadSong = async (e: any) => {
    e.preventDefault();

    let audioElem = document.getElementById("formSong") as HTMLFormElement;
    let audioFile: File = audioElem.files[0] || null;
    let audio: IpfsId = await uploadFile(audioFile);

    let picElem = document.getElementById("formPic") as HTMLFormElement;
    let picFile: File = picElem.files[0] || null;
    let pic: IpfsId = await uploadFile(picFile);

    let nameElem = document.getElementById("formName") as HTMLFormElement;
    let name: string = nameElem.value;

    let descElem = document.getElementById("formDesc") as HTMLFormElement;
    let description: string = descElem.value;

    let ipfsSong: IpfsSong = {
        name: name,
        audio: audio,
        image: pic,
        description: description,
    };

    let data = new FormData();
    data.append("file", JSON.stringify(ipfsSong));

    const res = await fetch(`${IPFS_URL}/add`, {
        method: "POST",
        body: data,
    });

    const { sk, pk } = genKeys();
    let ipfsHash: string = ((await res.json()) as IpfsResponse).Hash;

    let event = newPostEvent(ipfsHash, pk, sk);

    let relay = await initRelay(RELAY_URL);

    if (!event) return;
    return publishEvent(relay, event);
};

export const getFile = async (id: IpfsId) => {
    try {
        let data = new FormData();
        data.append("arg", id);

        const res = await fetch(`${IPFS_URL}/get`, {
            method: "POST",
            body: data,
        });

        let str = await res.text();
        let song: IpfsSong = JSON.parse(str.match(/{.*}/g)?.[0] || "");
        song.audio = IPFS_FILE_BASE + song.audio;
        song.image = IPFS_FILE_BASE + song.image;
        return song;
    } catch (e) {
        return {};
    }
};

export const getSong = async (id: IpfsId) => {
    let song = await getFile(id);

    //return res;
    return song;
};
