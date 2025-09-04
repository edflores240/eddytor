<script lang="ts">
  import { onMount } from 'svelte';
  
  onMount(() => {
    console.log('TestFloatingToolbar mounted!');
  });
</script>

<div style="position: fixed; top: 50px; left: 50%; transform: translateX(-50%); background: #4CAF50; color: white; padding: 10px 20px; border-radius: 4px; z-index: 9999;">
  Test Floating Toolbar is working!
</div>
