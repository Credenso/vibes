<script> 
  import { onMount } from 'svelte'

  export let tags = []

  onMount(() => {
    // Get the input element from the DOM 
    const input = document.getElementById('input-tag'); 

    // Add an event listener for keydown on the input element 
    input.addEventListener('keydown', function (event) { 

      // Check if the key pressed is 'Enter' 
      if (event.key === 'Enter') { 

        // Prevent the default action of the keypress 
        // event (submitting the form) 
        event.preventDefault(); 

        // Get the trimmed value of the input element 
        const tagContent = input.value.trim().replaceAll(/[^a-z,A-Z,0-9.]/g,''); 

        // If the trimmed value is not an empty string 
        if (tagContent !== '') { 

          // Add the tag to the list
          tags = [...tags, tagContent]

          // Clear the input element's value 
          input.value = ''; 
        } 
      } 
    }); 
  })

  const remove = (tag) => {
    tags = tags.filter(t => t !== tag)
  }
</script> 

<h1>Tags</h1>
<div class="tags-input"> 
  <ul id="tagList">
    {#each tags as tag (tag)}
      <li>{tag}<button on:click={() => remove(tag)} class="delete-button">x</button></li>
    {/each}
    <input type="text" id="input-tag" placeholder="What's the vibe" /> 
  </ul> 
</div> 
  
<style> 
  h1 {
    font-size: 1.2em;
    font-weight: bold;
    text-align: center;
    padding: 1em;
    padding-bottom: 0.5em;
    width: 100%;
  }

  .tags-input { 
    position: relative; 
    display: flex;
    flex-direction: row;
    background-color: #EEEEEE;
    border-radius: 1em;
    padding: 0.5em;
  } 

  .tags-input ul { 
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    list-style: none; 
    padding: 0; 
    margin: 0; 
  } 

  .tags-input li { 
    display: inline-block; 
    background-color: #FFFFFF; 
    color: #333; 
    border-radius: 20px; 
    padding: 5px 10px; 
    margin-right: 5px; 
    margin-bottom: 5px; 
  } 

  .tags-input li:before {
    content: '~';
  }

  .tags-input input[type="text"] { 
    border: none; 
    outline: none; 
    padding: 5px; 
    font-size: 14px; 
    background-color: transparent;
  } 

  .tags-input input[type="text"]:focus { 
    outline: none; 
  } 

  .delete-button { 
    background-color: transparent; 
    border: none; 
    color: #999; 
    cursor: pointer; 
    margin-left: 1em; 
  } 
</style> 
