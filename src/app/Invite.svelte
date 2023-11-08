<script>
  import qrcode from 'qrcode-generator'
  import { 
    keys,
    members,
  } from '../lib/stores'

  import b4a from 'b4a'
  import { schnorr } from '@noble/curves/secp256k1';
  import { bytesToHex } from '@noble/hashes/utils';
  import { sha256 } from '@noble/hashes/sha256';


  let ruleUnderstander = false
  let code

  const makeInvite = async () => {
    const name = Object.keys($members.names).find(key => $members.names[key] === $keys.publicKey)
    const nonceRequest = await fetch(`http://solar.credenso.cafe/nonce?name=${name}`)
    const nonce = await nonceRequest.text()
    const pubKey = $keys.publicKey
    const signedNonce = schnorr.sign(bytesToHex(sha256(nonce)), $keys.privateKey)
    const hexSig = b4a.toString(signedNonce, 'hex')

    const inviteCode = await fetch(`http://solar.credenso.cafe/invite?name=${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain"
      },
      body: JSON.stringify({ pubKey, hexSig })
    })

    code = await inviteCode.text()

    //const domain = "http://solar.credenso.cafe/vibes/"
    const domain = "http://localhost:5173/"
    const url = `${domain}?invite=${code}&member=${name}` 
    console.log(url)
    generateQR(url)
    const container = document.querySelector('main')
    container.scrollTo(0,0)
  }


  const generateQR = (url) => {
    const qr = qrcode(0, 'L');
    qr.addData(url)
    qr.make()
    document.getElementById('qr').innerHTML = qr.createImgTag(10)
    const elem = document.getElementById('qr').querySelector('img')
    elem.style.borderRadius = "1em";
    elem.style.margin = "auto";
  }
</script>

<div id="qr"></div>
{#if code}
  <small>{code}</small>
{/if}
<h1 class="title">Invite</h1>
<p>
  You are inviting someone to the Solar system. 
  Their account will be given full posting access 
  to Vibes, in addition to all future planets in 
  this system.
</p>
<p>
  It is your responsibility to make sure that anyone
  you invite is like, generally chill and stuff.
  If they turn out to be a square then we'll probably
  boot them and maybe you for lowering the collective
  vibe of the system. We might even boot your whole
  family tree if the energy been thrown off in a major 
  way. So... make sure everyone follows the rules.
</p>
<h1 class="title">The Rules</h1>
<ol>
  <li>1. Don't be a dingus.</li>
  <li>2. Don't make us make more rules.</li>
</ol>
<p>
</p>
{#if code === undefined}
<label id='ok' for="IGetIt">ya mom I get it</label>
<input type="checkbox" id="IGetIt" bind:checked={ruleUnderstander}>
<br>
<br>
<button on:click={makeInvite} disabled={!ruleUnderstander}>Generate!</button>
<br>
{/if}

<style>
  .title {
    font-size: 1.5em;
    font-family: "Comfortaa", Inter, sans-serif;
    font-weight: bold;
    margin: 0.5em;

  }

  button:disabled {
    color: grey;
    border-color: grey;
  }

  p, ol {
    text-align: left;
    margin: 1em;
  }

  #qr {
    margin: 1em;
    margin-bottom: 0;
    background-color: #EEEEEE;
  }

  #qr * {
    border-radius: 1em;
    margin: auto;
  }

  small {
    margin-bottom: 0;
  }

  hr {
    margin: 0.5em;
  }

  textarea {
    width: 100%;
    border-radius: 0.5em;
    margin-right: 0.5em;
    padding: 0.25em;
  }

  @keyframes fadeBlue {
    0%   { background-color: #028A9B; }
    100% { background-color: #FFFFFF; }
  }

  button {
    border: 1px solid #213547;
    padding: 0.25em;
    margin-bottom: 1em;
    align-self: end;
  }

  button.cancel {
    width: 2em;
  }

  .chat {
    margin-top: 2em;
    margin-bottom: 4em;
    height: 58vh;
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
  }

  .me {
    align-self: end;
  }

  .chatBox {
    border: 2px solid;
    border-radius: 1em;
    margin: 0.5em;
    padding: 0.5em;
    width: fit-content;
    border-color: #445566;
    background-color: #EEEEEE;
  }

  form.chatBox {
    position: fixed;
    bottom: 0;
  }

  .actions {
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: end;
    gap: 1em;
  }

  .actionButton {
    padding-right: 0.5em;
    cursor: pointer;
  }

  .me:nth-child(3n) {
    border-color: #de5a5a;
    background-color: #de5a5a33;
  }

  .me:nth-child(3n+1) {
    border-color: #f8a147;
    background-color: #f8a14733;
  }

  .me:nth-child(3n+2) {
    border-color: #028a9b;
    background-color: #028a9b33;
  }

  .header {
    font-size: 1.5em;
  }

  .deets {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9em;
  }

  .deets hr {
    border-color: #213547;
    margin: 0.5em;
    flex-grow: 1
  }

  .comment {
    text-align: left;
    font-size: 1.1;
  }

  img {
    border-radius: 1em;
  }
</style>
