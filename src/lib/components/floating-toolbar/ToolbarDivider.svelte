<!-- src/lib/components/floating-toolbar/ToolbarDivider.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  
  export let dark = false;
</script>

<!-- svelte-ignore element_invalid_self_closing_tag -->
<div class="toolbar-divider" class:dark={dark} />

<style lang="scss">
 
  
  .toolbar-divider {
    width: 1px;
    height: 24px;
    background: map.get($light, 'border-medium');
    margin: 0 3px;
    transition: background-color $transition-base;
    
    &.dark {
      background: map.get($dark, 'border-strong');
    }
  }
</style>