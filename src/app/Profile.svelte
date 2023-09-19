<script>
  let modalOpen = false;
  const openProfile = () => {
    modalOpen = true;
  }

  const closeProfile = () => {
    modalOpen = false;
  }
</script>

<img on:click={openProfile} src="/profile_photo.png" alt="profile" />
<div on:click={closeProfile} class:modalOpen class="overlay"></div>
<div class:modalOpen class="modal">
  <slot />
</div>

<style>
  img {
    position: absolute;
    top: 0;
    right: 0;
    margin: 1em;
    width: 3em;
  }

  .overlay {
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: black;
    z-index: 200;

  }

  .modal {
    display: block;
    background: white;
    position: absolute;
    overflow: hidden;
    opacity: 0;
    width: 0;
    height: 0;
    border-radius: 1em;
    top: 10vh;
    left: 5vw;
    box-shadow: 0 0 10em 0.5em;
    z-index: 201;
    transition: opacity 0.2s linear;
  }

  .modalOpen.modal {
    display: block;
    opacity: 1;
    width: 90vw;
    height: 80vh;
    padding: 2em;
  }

  .modalOpen.overlay {
    display: block;
    opacity: 0.3;
  }
</style>
