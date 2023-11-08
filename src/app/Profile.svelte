<script>
  import Member from './Member.svelte'
  import b4a from 'b4a'

  import { 
    contentDictionary,
    memberDictionary,
    activeMember, 
    keys, 
    modal
  } from '../lib/stores'

  let profile
  let avatar
  let avatarURL

  const updateAvatar = async (profile) => {
    if (profile?.avatar) {
      const address = $contentDictionary[profile.avatar]?.url
      if (address !== avatarURL) {
        avatarURL = address
        const path = avatarURL.split('/')
        const filename = path[path.length - 1]
        avatar = address
      }
    }
  }

  const openProfile = () => {
    $activeMember = $keys.publicKey
    $modal = "member"
  }

  memberDictionary.subscribe(members => {
    profile = members[$keys?.publicKey]
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
    object-fit: cover;
    border-radius: 50%;
  }
</style>
