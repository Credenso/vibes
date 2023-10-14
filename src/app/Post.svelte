<script>
  import { 
    postDictionary,
    userDictionary,
    contentDictionary,
    activeSong,
    activePost,
    queue
  } from '../lib/stores'

  export let postId
  export let image
  let post = undefined
  let name
  let author
  let currentlyPlaying = false
  let postType

  // This is a list of all the audio contents specified by the post
  let tracks = undefined

  // So, in my silliness, I decided to mix together IDs for
  // File Posts and Single posts. If it's a collection, we need
  // to figure out which one it is.
  const getTracks = () => {
    tracks = []
    post.content.audio.forEach((id,i) => {
      // If there's a matching post for the ID, pull its audio file
      if ($postDictionary[id]) {
        tracks.push($postDictionary[id]?.content.audio)
      } else {
        tracks.push(id)
      }
    })
  }

  postDictionary.subscribe(() => {
    post = $postDictionary[postId]

    // We only want to update this once
    if (post && postType === undefined) {
      author = $userDictionary[post.pubkey]
      postType = post.content.type
      if (postType === "collection") {
        getTracks()
      }
    }
  })

  activeSong.subscribe((song) => {
    if (postType === "single") {
      if (song && song === $contentDictionary[post?.content?.audio]) {
        currentlyPlaying = true
      } else {
        currentlyPlaying = false
      }

    } else if (postType === "collection") {
      currentlyPlaying = false
      tracks.forEach((id) => {
        if (song === $contentDictionary[id]) {
          currentlyPlaying = true
        }
      })
    }
  })

  const setActive = () => {
    activePost.set(postId)
  }

  const addToQueue = (song_id) => {
  }

  const play = () => {
    console.log('clicked!', post.content)
    if (postType === "collection") {
      tracks.forEach((id,i) => {
        // If it's the first song, play it. Otherwise, queue it.
        if (i === 0) {
          activeSong.set($contentDictionary[id])
        } else {
          $queue.push($contentDictionary[id])
        }
      })
    } else if (postType === "single") {
      // otherwise it's a single, we don't have to worry about
      // Any of these strange shenannies
      activeSong.set($contentDictionary[post.content.audio])
    }
  }

</script>

<article class="post">
  <div class="box" class:collection={postType === "collection"}>
    <div class="art">
      <img src="{ image }" alt="vinyl"/>
    </div>
    <div on:click={play} class:currentlyPlaying class="playIcon">
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
    border: 3px solid #f8a147;
  }

  .collection {
    border: 3px solid #028a9b;
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
