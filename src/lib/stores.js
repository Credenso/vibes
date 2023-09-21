import { writable } from 'svelte/store';

export const postDictionary = writable({});
export const userDictionary = writable({});
export const commentsDictionary = writable({});
export const activePost = writable(undefined);
export const relay = writable(undefined);
export const keys = writable({});
