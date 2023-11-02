import { writable } from 'svelte/store';

// This is a collection of global variables and objects
// which are updated and live-synced to all components 
// simultaneously, without being passed through the DOM
// as props

export const postDictionary = writable({});
export const memberDictionary = writable({});
export const commentsDictionary = writable({});
export const contentDictionary = writable({});
export const repliesDictionary = writable({});
export const vibesDictionary = writable({});

export const activeSong = writable(undefined);
export const activePost = writable(undefined);
export const activeMember = writable(undefined);

export const queue = writable([]);
export const members = writable({});
export const contacts = writable([]);
export const chats = writable({});
export const relay = writable(undefined);
export const modal = writable(undefined);
export const memberClass = writable("npc");
export const keys = writable({});
export const hyper = writable({});
