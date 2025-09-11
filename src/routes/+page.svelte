<script lang="ts">
  import { onMount } from 'svelte';
  import { EditorView } from 'prosemirror-view';
  import { schema } from 'prosemirror-schema-basic';
  import { EditorWithSlashMenu } from '$lib/components/EditorWithSlashMenu.svelte';
  import { commandRegistry } from '$lib/commands';
  
  let editorView: EditorView;
  let darkMode = false;
  
  // Handle editor view initialization
  function handleEditorView(event: CustomEvent<{ view: EditorView }>) {
    editorView = event.detail.view;
    console.log('Editor initialized', editorView);
  }
  
  // Toggle dark mode
  function toggleDarkMode() {
    darkMode = !darkMode;
    document.documentElement.classList.toggle('dark', darkMode);
  }
  
  // Initialize dark mode based on system preference
  onMount(() => {
    darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', darkMode);
    
    // Add keyboard shortcut for toggling dark mode (Ctrl+Shift+D)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        toggleDarkMode();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });
</script>

<main class:dark-mode={darkMode}>
  <div class="container">
    <header class="header">
      <h1>Eddytor</h1>
      <div class="controls">
        <button 
          class="dark-mode-toggle" 
          on:click={toggleDarkMode}
          aria-label="Toggle dark mode"
          title="Toggle dark mode (Ctrl+Shift+D)"
        >
          {#if darkMode}
            <i data-lucide="sun"></i>
          {:else}
            <i data-lucide="moon"></i>
          {/if}
        </button>
      </div>
    </header>
    
    <div class="editor-wrapper">
      <div class="editor-container">
        <EditorWithSlashMenu 
          bind:view={editorView} 
          dark={darkMode}
          on:editorView={handleEditorView}
        />
      </div>
      
      <div class="help-text">
        <p>Type <kbd>/</kbd> to open the slash menu</p>
        <p>Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate, <kbd>Enter</kbd> to select, <kbd>Esc</kbd> to close</p>
      </div>
    </div>
    
    <footer class="footer">
      <p>Powered by ProseMirror and Svelte</p>
    </footer>
  </div>
</main>

<style>
  :global(:root) {
    --bg-color: #ffffff;
    --text-color: #1a202c;
    --border-color: #e2e8f0;
    --primary-color: #3b82f6;
    --primary-hover: #2563eb;
    --secondary-bg: #f8fafc;
    --code-bg: #f1f5f9;
    --code-color: #1e293b;
  }
  
  :global(.dark) {
    --bg-color: #0f172a;
    --text-color: #f8fafc;
    --border-color: #334155;
    --primary-color: #60a5fa;
    --primary-hover: #3b82f6;
    --secondary-bg: #1e293b;
    --code-bg: #1e293b;
    --code-color: #e2e8f0;
  }
  
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: var(--bg-color);
    color: var(--text-color);
    line-height: 1.6;
    transition: background-color 0.2s ease, color 0.2s ease;
  }
  
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
  }
  
  h1 {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
  }
  
  .controls {
    display: flex;
    gap: 0.5rem;
  }
  
  .dark-mode-toggle {
    background: none;
    border: none;
    color: var(--text-color);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
  }
  
  .dark-mode-toggle:hover {
    background-color: var(--secondary-bg);
  }
  
  .editor-wrapper {
    background: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  
  .editor-container {
    min-height: 300px;
  }
  
  .help-text {
    padding: 1rem;
    font-size: 0.875rem;
    color: var(--text-color);
    opacity: 0.7;
    text-align: center;
    border-top: 1px solid var(--border-color);
  }
  
  .help-text p {
    margin: 0.25rem 0;
  }
  
  kbd {
    background-color: var(--secondary-bg);
    border: 1px solid var(--border-color);
    border-radius: 0.25rem;
    padding: 0.125rem 0.375rem;
    font-family: 'Fira Code', 'Courier New', monospace;
    font-size: 0.8em;
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
  }
  
  .footer {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
    text-align: center;
    font-size: 0.875rem;
    color: var(--text-color);
    opacity: 0.7;
  }
  
  /* Make sure the editor fills its container */
  :global(.ProseMirror) {
    min-height: 300px;
    padding: 1rem;
    outline: none;
  }
  
  /* Style the slash menu */
  :global(.slash-menu) {
    z-index: 1000;
  }
</style>
