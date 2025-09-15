<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { getContext } from 'svelte';
  import { commandRegistry } from '../../core/CommandRegistry';
  import type { EditorView } from 'prosemirror-view';
  import { schema } from '../../schema';

  export let view: EditorView;
  
  const boldCommand = commandRegistry.getCommand('bold');
  const italicCommand = commandRegistry.getCommand('italic');
  const codeCommand = commandRegistry.getCommand('code');
  const textColorCommand = commandRegistry.getCommand('textColor');
  const fontSizeCommand = commandRegistry.getCommand('fontSize');
  
  let currentColor = '#000000';
  let currentSize = '16px';
  
  // Available colors and sizes
  const colors = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', 
    '#ffff00', '#00ffff', '#ff00ff', '#808080', '#c0c0c0'
  ];
  
  const sizes = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];
  
  // Apply text color
  function applyColor(color: string) {
    currentColor = color;
    textColorCommand?.execute({ view, color });
  }
  
  // Apply font size
  function applySize(size: string) {
    currentSize = size;
    fontSizeCommand?.execute({ view, size });
  }
  
  // Check if a mark is active
  function isMarkActive(markType: any) {
    if (!view) return false;
    const { from, $from, to, empty } = view.state.selection;
    if (empty) {
      return !!markType.isInSet(view.state.storedMarks || $from.marks());
    } else {
      return view.state.doc.rangeHasMark(from, to, markType);
    }
  }
  
  // Update UI based on selection
  function updateUI() {
    // This will trigger a re-render
    view = view;
  }
  
  // Set up event listeners
  onMount(() => {
    if (view) {
      view.dom.addEventListener('mouseup', updateUI);
      view.dom.addEventListener('keyup', updateUI);
    }
  });
  
  onDestroy(() => {
    if (view) {
      view.dom.removeEventListener('mouseup', updateUI);
      view.dom.removeEventListener('keyup', updateUI);
    }
  });
</script>

<div class="text-format-toolbar">
  <!-- Bold -->
  <button 
    class="toolbar-button"
    class:active={isMarkActive(schema.marks.strong)}
    on:click={() => boldCommand?.execute({ view })}
    title="Bold (Ctrl+B)"
  >
    <span class="material-icons">format_bold</span>
  </button>
  
  <!-- Italic -->
  <button 
    class="toolbar-button"
    class:active={isMarkActive(schema.marks.em)}
    on:click={() => italicCommand?.execute({ view })}
    title="Italic (Ctrl+I)"
  >
    <span class="material-icons">format_italic</span>
  </button>
  
  <!-- Code -->
  <button 
    class="toolbar-button"
    class:active={isMarkActive(schema.marks.code)}
    on:click={() => codeCommand?.execute({ view })}
    title="Code (Ctrl+`)"
  >
    <span class="material-icons">code</span>
  </button>
  
  <!-- Text Color Picker -->
  <div class="dropdown">
    <button class="toolbar-button" title="Text Color">
      <span class="material-icons" style={`color: ${currentColor}`}>format_color_text</span>
    </button>
    <div class="dropdown-content color-palette">
      {#each colors as color}
        <button 
          class="color-swatch" 
          style={`background-color: ${color};`}
          on:click|stopPropagation={() => applyColor(color)}
          title={color}
        ></button>
      {/each}
    </div>
  </div>
  
  <!-- Font Size Picker -->
  <div class="dropdown">
    <button class="toolbar-button" title="Font Size">
      <span class="material-icons">format_size</span>
    </button>
    <div class="dropdown-content size-picker">
      {#each sizes as size}
        <button 
          class="size-option {currentSize === size ? 'active' : ''}"
          style={`font-size: ${size};`}
          on:click|stopPropagation={() => applySize(size)}
        >
          {size}
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .text-format-toolbar {
    display: flex;
    gap: 4px;
    padding: 4px;
    background: #f5f5f5;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  
  .toolbar-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    color: #333;
  }
  
  .toolbar-button:hover {
    background: #e0e0e0;
  }
  
  .toolbar-button.active {
    background: #e0e0e0;
    color: #1976d2;
  }
  
  .dropdown {
    position: relative;
    display: inline-block;
  }
  
  .dropdown-content {
    display: none;
    position: absolute;
    background-color: white;
    min-width: 120px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 1000;
    border-radius: 4px;
    padding: 8px;
    top: 100%;
    left: 0;
    margin-top: 4px;
  }
  
  .dropdown:hover .dropdown-content {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
  }
  
  .color-swatch {
    width: 20px;
    height: 20px;
    border: 1px solid #ddd;
    border-radius: 3px;
    cursor: pointer;
    padding: 0;
  }
  
  .color-swatch:hover {
    transform: scale(1.1);
  }
  
  .size-picker {
    grid-template-columns: repeat(3, 1fr) !important;
  }
  
  .size-option {
    padding: 4px 8px;
    border: none;
    background: none;
    cursor: pointer;
    text-align: center;
    border-radius: 3px;
  }
  
  .size-option:hover, .size-option.active {
    background: #f0f0f0;
  }
</style>
