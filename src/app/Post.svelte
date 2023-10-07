<script>
  import { 
    postDictionary,
    userDictionary,
    contentDictionary,
    activeSong,
    activePost 
  } from '../lib/stores'

  export let postId
  export let image
  let post = undefined
  let name
  let author
  let currentlyPlaying = false

  postDictionary.subscribe(() => {
    post = $postDictionary[postId]
    if (post) {
      author = $userDictionary[post.pubkey]
    }
  })

  activeSong.subscribe((song) => {
    if (song && song === $contentDictionary[post?.content?.audio]) {
      currentlyPlaying = true
    } else {
      currentlyPlaying = false
    }
  })

  const setActive = () => {
    activePost.set(postId)
  }

  const playSong = () => {
    if (post.content) {
      activeSong.set($contentDictionary[post.content.audio])
    }
  }
</script>

<article class="post">
  <div class="box">
    <div class="art">
      <img src="{ image }" alt="vinyl"/>
    </div>
    <div on:click={playSong} class:currentlyPlaying class="playIcon">
      <img src="play.png">
    </div>
    <section class="about" on:click={setActive}>
    <div class="name">{ post?.content?.name }</div>
    <div class="artist">{ author?.name || 'Anonymous' }</div>
    </section>
  </div>
</article> 

<style>
  img {
    object-fit: cover;
    width: 100%;
    height: 16em;
  }

  .playIcon {
    position: absolute;
    background: #EEEEEE55;
    top: 0;
    left: 0;
    width: 100%;
    opacity: 0;
    transition: all 0.2s ease-in-out;
  }

  .playIcon img {
    padding: 5em;
    object-fit: contain;
  }

  .post {
    position: relative;
    z-index: 10;
    min-width: min(70vw, 20em);
    max-width: min(70vw, 20em);
    margin: 1em auto;
    transition: all 0.2s;
    padding-left: 1.25rem;
    padding-right: 1.25rem;
    border-radius: .375rem;
  }

  .currentlyPlaying {
    transition: opacity 0.1s ease-in-out;
    opacity: 1;
  }

  .box {
    display: flex;
    position: relative;
    height: 100%;
    width: 100%;
    overflow: hidden;
    border-radius: .375rem;
    border-width: 2px;
    background-color: #FFFFFF;
    flex-direction: column;
    justify-content: space-between;
    padding-bottom: 0.5rem;
  }

  .art {
    position: relative;
    width: 100%;
    overflow: hidden;
  }

  .name {
    font-weight: bold;
  }

  .name {
    font-style: italic;
    line-height: 1;
  }

  .desc {
    flex-grow: 1;
    display: flex;
    align-items: center;
  }

  .post:hover {
    transform: scale(1.05);
  }

  .font-bold {
    line-height: 1;
  }
</style>
