import { writable } from 'svelte/store';

// This is a collection of global variables and objects
// which are updated and live-synced to all components 
// simultaneously, without being passed through the DOM
// as props

export const postDictionary = writable({});
export const userDictionary = writable({});
export const commentsDictionary = writable({});
export const contentDictionary = writable({});
export const repliesDictionary = writable({});
export const vibesDictionary = writable({});

export const activeSong = writable(undefined);
export const activePost = writable(undefined);
export const activeUser = writable(undefined);

export const queue = writable([]);
export const relay = writable(undefined);
export const modal = writable(undefined);
export const keys = writable({});
export const hyper = writable({});
