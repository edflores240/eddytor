<!-- Header.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    export let isDarkMode: any; // Store reference
    
    const dispatch = createEventDispatcher();
    
    function toggleTheme() {
      dispatch('toggle-theme');
    }
  </script>
  
  <header class="header" class:dark={$isDarkMode}>
    <div class="header-content">
      <div class="header-left">
        <h1 class="header-title">Eddytor</h1>
      </div>
      
      <div class="header-right">
        <button 
          class="theme-toggle"
          on:click={toggleTheme}
          aria-label="Toggle theme"
        >
          {#if $isDarkMode}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 2V4M10 16V18M18 10H16M4 10H2M15.314 4.686L13.9 6.1M6.1 13.9L4.686 15.314M15.314 15.314L13.9 13.9M6.1 6.1L4.686 4.686M10 6C12.209 6 14 7.791 14 10C14 12.209 12.209 14 10 14C7.791 14 6 12.209 6 10C6 7.791 7.791 6 10 6Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          {:else}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          {/if}
        </button>
      </div>
    </div>
  </header>
  
  <style>
    .header {
      background: white;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      padding: 0 1rem;
      position: sticky;
      top: 0;
      z-index: 100;
      transition: background-color 0.2s ease, border-color 0.2s ease;
    }
    
    .header.dark {
      background: #1a1a1a;
      border-bottom-color: rgba(255, 255, 255, 0.1);
    }
    
    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 60px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .header-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: rgba(55, 53, 47, 0.95);
      margin: 0;
      font-family: inherit;
    }
    
    .header.dark .header-title {
      color: rgba(255, 255, 255, 0.9);
    }
    
    .theme-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: none;
      background: rgba(55, 53, 47, 0.08);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      color: rgba(55, 53, 47, 0.8);
    }
    
    .theme-toggle:hover {
      background: rgba(55, 53, 47, 0.12);
      transform: scale(1.05);
    }
    
    .header.dark .theme-toggle {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
    }
    
    .header.dark .theme-toggle:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  </style>