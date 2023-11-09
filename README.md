# Vibes
Decentralized social media for artists and their fans.

---

Vibes is a project using Nostr protocol to build a 
platform where artists can share music and interact
with their fanbase while maintaining ownership over
their data. 

Try it out [here](https://solar.credenso.cafe/vibes/)

## Getting Started
This project is in its early stages, and not yet
designed to interact with multiple relays. That said,
if you want to run it on your computer, there's a few
steps to bootstrap it:

#### Nostr
You'll need access to a nostr relay that supports arbitrary
kinds of event. If you're running one yourself, I suggest [futr2](https://github.com/AutonomousOrganization/futr2). 

Once it's running, you'll need to replace every instance of
`relay.credenso.cafe` in the codebase with your relay's URL.

#### Solar
Vibes is designed to be one of multiple interoperable social
media sites, connected with a single identity known as a Solar
account. [Solar](https://github.com/Credenso/solar) is invite only (for now), so you'll need to run 
your own server if you want to use this page. Once it's up,
replace every `solar.credenso.cafe` in the codebase with its
URL.

#### Vibes
Finally, you'll need to get this project booted. The steps
are below:
```
git clone https://github.com/Credenso/vibes
cd vibes
npm install
npm run dev
```

## Credits
Standing on the shoulders of giants.

Specific thanks to:
- [Autonomous Organization](https://github.com/AutonomousOrganization)
- [Rich Harris](https://github.com/Rich-Harris)
- [fiatjaf](https://fiatjaf.com/)
- [Stefan Radu](https://github.com/Stefan-Radu)
- [Chris Oka](https://github.com/ChristopherOka)

## Donations
If you appreciate the work I do, please consider leaving a tip!
- bitcoin: `bc1q9xqp8ar0mylvu90qef4570jt963ymyxfhdc20c`
