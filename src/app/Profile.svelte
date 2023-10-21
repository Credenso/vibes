<script>
  import Member from './Member.svelte'

  import { 
    activeUser, 
    keys, 
    modal
  } from '../lib/stores'

  const openProfile = () => {
    $activeUser = $keys.publicKey
    $modal = "member"
  }
</script>

<img on:click={openProfile} src="profile_photo.png" alt="profile" />

<style>
  img {
    position: absolute;
    top: 0;
    right: 0;
    margin: 1em;
    width: 3em;
  }
</style>
