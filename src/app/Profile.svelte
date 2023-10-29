<script>
  import Member from './Member.svelte'
  import b4a from 'b4a'

  import { 
    contentDictionary,
    userDictionary,
    activeUser, 
    hyper,
    keys, 
    modal
  } from '../lib/stores'

  let profile
  let avatar
  let avatarURL

  const hyperImage = async (id) => {
    const event = $contentDictionary[id]
    const mime = event.tags.find(t => t[0] === "m")[1]
    const content = await $hyper.drive.exists(event.content)
    if (await content) {
      return `data:${mime};base64,${b4a.toString(content, 'base64')}`
    } else {
      return undefined
    }
  }

  const updateAvatar = async (profile) => {
    if (profile?.avatar) {
      const address = $contentDictionary[profile.avatar]?.url
      if (address !== avatarURL) {
        avatarURL = address
        const path = avatarURL.split('/')
        const filename = path[path.length - 1]
        const hyperfile = await $hyper.drive?.exists(filename)
        if (hyperfile) {
          console.log('avatar hyperfile', hyperfile)
          avatar = await hyperImage(profile.avatar)
        } else {
          avatar = address
        }
      }
    }
  }

  const openProfile = () => {
    $activeUser = $keys.publicKey
    $modal = "member"
  }

  userDictionary.subscribe(users => {
    profile = users[$keys?.publicKey]
    if (profile) {
      updateAvatar(profile)
    }
  })

</script>

<img on:click={openProfile} src="{avatar || "profile_photo.png"}" alt="profile" />

<style>
  img {
    position: absolute;
    top: 0;
    right: 0;
    margin: 1em;
    width: 48px;
    height: 48px;
    border-radius: 50%;
  }
</style>
