<!-- PlusButton.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let x: number;
  export let y: number;
  export let dark: boolean = false;

  const dispatch = createEventDispatcher();

  function handleClick() {
    dispatch('click');
  }
</script>

<button 
aria-label="Click to add a block, or type / for commands"
  class="plus-button"
  class:dark
  style="left: {x}px; top: {y + 4}px"
  on:click={handleClick}
>
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path 
      d="M8 3V13M3 8H13" 
      stroke="currentColor" 
      stroke-width="2" 
      stroke-linecap="round"
    />
  </svg>
</button>

<style lang="scss">
  .plus-button {
    position: absolute;
    width: 28px;
    height: 28px;
    background: map.get($light, 'bg-primary');
    border: 1.5px solid map.get($light, 'border-light');
    border-radius: $radius-lg;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: map.get($light, 'text-tertiary');
    transition: all $transition-base;
    z-index: $z-dropdown;
    opacity: 0;
    animation: fadeInScale 0.15s ease-out forwards;
    box-shadow: $shadow-sm;
    
    // Notion-like styling
    &:before {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: $radius-lg;
      background: transparent;
      transition: background $transition-fast;
    }

    &.dark {
      background: map.get($dark, 'bg-secondary');
      border-color: map.get($dark, 'border-light');
      color: map.get($dark, 'text-tertiary');
    }

    &:hover {
      background: map.get($light, 'bg-secondary');
      border-color: map.get($light, 'border-medium');
      color: map.get($light, 'text-secondary');
      transform: scale(1.05);
      box-shadow: $shadow-base;
      
      &:before {
        background: map.get($light, 'bg-hover');
      }

      &.dark {
        background: map.get($dark, 'bg-tertiary');
        border-color: map.get($dark, 'border-medium');
        color: map.get($dark, 'text-secondary');
        
        &:before {
          background: map.get($dark, 'bg-hover');
        }
      }
    }

    &:active {
      transform: scale(0.95);
      transition: transform 0.05s;
    }

    svg {
      transition: transform $transition-fast;
      pointer-events: none;
    }

    &:hover svg {
      transform: scale(1.1);
    }
  }

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>