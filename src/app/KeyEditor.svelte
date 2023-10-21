<script>
    import { keys } from '../lib/stores.js'
    import { genKeys } from '../lib/nostr.ts'

    let pro = false;

    const newKeys = () => {
        let { sk, pk } = genKeys();
        $keys.publicKey = pk
        $keys.privateKey = sk
    }

    const saveKeys = () => {
        if ($keys.publicKey && $keys.privateKey) {
            window.localStorage.setItem('vibes_public_key', $keys.publicKey)
            window.localStorage.setItem('vibes_private_key', $keys.privateKey)
        }
    }
</script>

<div class="editor">
  <b>Nostr Keys</b>
  <br>
  <input type="checkbox" id="pro" bind:checked={pro} />
  <label for="pro">I know what I'm doing.</label>
  <br>
    {#if pro}
      <div class="formEntry">
        <label for="pk">Public Key</label>
        <input type="text" id="pk" value="{$keys.publicKey}" />
        <br>
      </div>
      <div class="formEntry">
        <label for="sk">Private Key</label>
        <input type="text" id="sk" value="{$keys.privateKey}" />
      </div>
      <div class="actions">
        <button on:click={newKeys}>Generate New Keys</button>
        <button on:click={saveKeys}>Save</button>
      </div>
    {:else}
      <div class="formEntry">
        <label for="pk">Public Key</label>
        <input type="text" id="pk" value="{$keys.publicKey}" disabled/>
        <br>
      </div>
      <div class="formEntry">
        <label for="sk">Private Key</label>
        <input type="text" id="sk" value="{$keys.privateKey}" disabled/>
      </div>
    {/if}
</div>

<style>
  .editor {
    border: 2px solid #112233;
    border-radius: 0.5em;
  }

  .formEntry {
    display: flex;
    align-items: center;
    justify-content: space-around;
  }

  .formEntry * {
    flex-grow: 1;
  }

  .formEntry label {
    font-weight: bold;
  }

  .formEntry input {
    background-color: #EEEEEE;
    border-radius: 1em;
    padding: 0.5em;
    margin: 0.5em;
  } 

  .formEntry input:disabled {
    background-color: #EEEEEE;
    color: grey;
  } 

  .actions {
    display: flex;
    flex-direction: row;
    justify-content: center;
    gap: 1em;
    margin-bottom: 0.5em;
  }

  .actions button {
    border: 1px solid black;
    border-radius: 0.5em;
    padding: 1em;
    padding-top: 0.5em;
    padding-bottom: 0.5em;
  }
</style>

