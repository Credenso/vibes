# Needs to be done before publishing
- [x] Plug in the backend
- [x] Add profile modal
- [x] finish upload
- [x] Make it a PWA
- [x] add profile support
- [x] song modal
- [x] comments
- [x] song modal date
- [x] remove tailwind (okay, it can stick around a bit)
- [x] fix alternative logins
- [x] add music player
- [x] live updates
- [x] Investigate Sonar
- [x] Integrate Hypercore
- [x] add music controls - M
    - [x] fix menu open/close - S
    - [x] sync pause/play - S
    - [x] hide controls on load - S
    - [x] add seeking - M

- [x] Button QoL - S
- [x] comment replies - M

- [x] file sanitize - S

- [x] implement searching - L
    - [x] Add custom NIPs to allow multi-apps - M
    - [x] Add "votes" - M
    - [x] Vibe cloud - M 
    - [x] Show results - S

- [x] add Collections support - M
    - [x] customize upload - S
    - [x] Display collection differently - S
    - [x] Allow for playing of all the songs - S
    - [x] show tracklist - M
        - [x] Add song names - S

- [x] Queue songs / Play Now - S

- [ ] Profile Page - M
    - [x] Edit Profile - M
    - [x] Profile Pictures - S
    - [ ] NIP-24 compliance - S

- [x] User Registration - M
    - [x] Update Profile screen
    - [x] NIP-05 compatibility
    - [x] Username validation

- [ ] Following artists
    - [x] Create list of follows
    - [ ] Create list of blocks

- [x] Direct Messages - L

- [ ] Delete Posts - M
- [ ] Reposts - M

- [ ] upgrade upload screen - M
    - [ ] resize uploaded images - S
    - [x] upload preview - S 
    - [ ] post preview - S 
    - [ ] overhaul UI - S

- [ ] Other categories - M
    - [ ] Most popular (unique votes in last 30 days) - S
    - [ ] artists you follow - S

# Hypercore Integration
- [x] Pull events from Hypercore
- [x] Login flow with Solar

- [ ] Hypercore Chats

- [ ] Download followed Hypercores

- [x] User classes (Admin, creator, NPC)
    - [x] Registration 
    - [x] permissions for
        - [x] commenting
        - [x] chatting
        - [x] following
        - [x] voting
        - [x] uploading
        - [x] inviting

- [x] Basic groupchat - S

# Next Steps - Polish
- [ ] Better Image Loading - L
    - [ ] Remote Solar Signing?
    - [ ] Blurhash images - M

- [x] figure out why subscription is sketchy
- [x] investigate howler.js lib / siriwave
- [ ] try again with the wave-generator
- [ ] integrate blurhash
- [ ] password protection (w/ keypear?)
- [x] sanitize filenames (#, ?)
- [ ] better fonts

- [ ] videos (can this be v1.1?)
- [ ] Currently listening to (NIP-38)

# Next Steps - Decentralization
- [ ] manually configure relay and ipfs address
- [ ] reconsider IPFS vs torrents / .magnet links vs dat protocol
- [x] fix nostr compatibility
- [ ] Allow for offline collections - listening & download https://web.dev/learn/pwa/offline-data/
- [x] refactor Modal (there should just be one)
- [ ] nostr lib typescript
- [ ] interop with iris (Nostr client)
- [ ] Reposting? - M (NIP-18)
