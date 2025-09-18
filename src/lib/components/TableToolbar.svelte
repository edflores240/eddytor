<!-- TableToolbar.svelte -->
<script lang="ts">
  import { onMount, createEventDispatcher, onDestroy } from 'svelte';
  import { tableMenuItems, canExecuteTableCommand } from '../plugins/table/TablePlugin';
  import { EditorView } from 'prosemirror-view';
  import { get } from 'svelte/store';
  import { computePosition, flip, shift, offset, autoUpdate } from '@floating-ui/dom';
  import { mergeCells, splitCell } from "prosemirror-tables";

  export let view: EditorView;
  export let dark: boolean = false;
  
  const dispatch = createEventDispatcher();
  
  let toolbarElement: HTMLElement;
  let referenceElement: HTMLElement | null = null;
  let isVisible = false;
  let cleanup: (() => void) | null = null;
  let iconVersion = 0;

  // Track command states
  let canAddRowBefore = false;
  let canAddRowAfter = false;
  let canDeleteRow = false;
  let canAddColumnBefore = false;
  let canAddColumnAfter = false;
  let canDeleteColumn = false;
  let canMergeCells = false;
  let canSplitCell = false;
  let inHeaderRow = false;

  // Update derived state on every editor update
  function updateTableState() {
    if (!view) return;

    inHeaderRow = isInHeaderRow(view);

    canAddRowBefore = canExecuteTableCommand(
      tableMenuItems.addRowBefore.command,
      view.state
    ) && !inHeaderRow;

    canAddRowAfter = canExecuteTableCommand(tableMenuItems.addRowAfter.command, view.state);
    canDeleteRow = canExecuteTableCommand(tableMenuItems.deleteRow.command, view.state);
    canAddColumnBefore = canExecuteTableCommand(tableMenuItems.addColumnBefore.command, view.state);
    canAddColumnAfter = canExecuteTableCommand(tableMenuItems.addColumnAfter.command, view.state);
    canDeleteColumn = canExecuteTableCommand(tableMenuItems.deleteColumn.command, view.state);
    canMergeCells = canExecuteTableCommand(mergeCells, view.state);
    canSplitCell = canExecuteTableCommand(splitCell, view.state);
  }

  // Function to check if user is inside a table
  function isInTable(view: EditorView): boolean {
    if (!view) return false;
    
    const { state } = view;
    const { selection } = state;
    const { $from } = selection;
    
    // Check if the cursor is inside a table
    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.type.name === 'table') {
        return true;
      }
    }
    
    return false;
  }
  
  // Function to check if user is in a header row
  function isInHeaderRow(view: EditorView): boolean {
    if (!view) return false;
    
    const { state } = view;
    const { selection } = state;
    const { $from } = selection;
    
    // Check if the cursor is inside a table header cell
    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.type.name === 'table_header') {
        return true;
      }
    }

    // alert($from.node().type.name);
    
    return false;
  }
  
  // Function to check if the current cell is a merged cell (has colspan or rowspan > 1)
  function isMergedCell(view: EditorView): boolean {
    if (!view) return false;
    
    const { state } = view;
    const { selection } = state;
    const { $from } = selection;
    
    // Find the cell node
    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.type.name === 'table_cell' || node.type.name === 'table_header') {
        // Check if the cell has colspan or rowspan > 1
        const colspan = node.attrs.colspan || 1;
        const rowspan = node.attrs.rowspan || 1;
        return colspan > 1 || rowspan > 1;
      }
    }
    
    return false;
  }
  
  // Function to check if there is a cell selection (multiple cells selected)
  function hasCellSelection(view: EditorView): boolean {
    if (!view) return false;
    
    const { state } = view;
    const { selection } = state;
    
    // Check if the selection is a CellSelection
    if (selection.constructor.name !== 'CellSelection') return false;
    
    // Check if multiple cells are selected
    const anchorCell = (selection as any).$anchorCell;
    const headCell = (selection as any).$headCell;
    
    if (!anchorCell || !headCell) return false;
    
    // Check if the selection spans multiple cells
    const anchorPos = anchorCell.pos;
    const headPos = headCell.pos;
    
    return anchorPos !== headPos;
  }
  
  // Get the reference element for positioning
  function getTableReferenceElement(): HTMLElement | null {
    if (!view || !isInTable(view)) {
      return null;
    }
    
    const { state } = view;
    const { selection } = state;
    const { $from } = selection;
    
    // Find the table node
    let tablePos = $from.pos;
    let tableNode = $from.node();
    
    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.type.name === 'table') {
        tableNode = node;
        tablePos = $from.before(depth);
        break;
      }
    }
    
    // Get table DOM node
    const tableDOM = view.nodeDOM(tablePos) as HTMLElement;
    return tableDOM;
  }
  
  // Update toolbar position using Floating UI
  function updateToolbarPosition() {
    const tableElement = getTableReferenceElement();
    
    if (!tableElement) {
      isVisible = false;
      if (cleanup) {
        cleanup();
        cleanup = null;
      }
      return;
    }
    
    referenceElement = tableElement;
    isVisible = true;
    
    // Set up Floating UI positioning
    if (toolbarElement && referenceElement) {
      if (cleanup) {
        cleanup();
      }
      
      cleanup = autoUpdate(referenceElement, toolbarElement, () => {
        computePosition(referenceElement!, toolbarElement, {
          placement: 'top',
          middleware: [
            offset(8),
            flip(),
            shift({ padding: 8 })
          ]
        }).then(({ x, y }) => {
          Object.assign(toolbarElement.style, {
            left: `${x}px`,
            top: `${y}px`
          });
        });
      });
    }
  }
  
  // Execute a table command
  function executeCommand(commandName: string) {
    if (!view) return;
    
    const command = tableMenuItems[commandName]?.command;
    if (!command) {
      console.error(`Table command not found: ${commandName}`);
      return;
    }
    
    try {
      // Execute the command
      const result = command(view.state, view.dispatch, view);
      
      // Log success or failure
      if (result === false) {
        console.warn(`Table command ${commandName} could not be executed in current context`);
      }
      
      // Update toolbar position after command execution
      setTimeout(() => {
        updateToolbarPosition();
        updateIcons();
      }, 10);
      
      // Focus the editor again
      view.focus();
    } catch (error) {
      console.error(`Error executing table command ${commandName}:`, error);
    }
  }
  
  // Update Lucide icons
  function updateIcons() {
    iconVersion++;
    requestAnimationFrame(() => {
      import('lucide').then(({ createIcons }) => {
        createIcons({
          attrs: {
            stroke: 'currentColor',
            'stroke-width': '2',
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
          },
          nameAttr: 'data-lucide'
        });
      });
    });
  }
  
  // Function to handle when editor loses focus
  function handleEditorBlur() {
    isVisible = false;
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
  }

  // Patch updateState and handle focus
  onMount(() => {
    if (!view) return;

    const originalUpdate = view.updateState;
    view.updateState = (state) => {
      originalUpdate.call(view, state);
      updateTableState();
      updateToolbarPosition();
    };

    // Add focus and blur event listeners to the editor DOM element
    const editorDOM = view.dom;
    editorDOM.addEventListener('blur', handleEditorBlur);
    
    // Also listen for window clicks to detect clicks outside the editor
    window.addEventListener('click', (event) => {
      // Check if click is outside the editor
      if (!editorDOM.contains(event.target as Node)) {
        handleEditorBlur();
      }
    });

    // initial run
    updateTableState();
    updateToolbarPosition();
    updateIcons();

    return () => {
      if (view) view.updateState = originalUpdate;
      editorDOM.removeEventListener('blur', handleEditorBlur);
      window.removeEventListener('click', handleEditorBlur);
    };
  });
  
  onDestroy(() => {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
  });
</script>

<div 
  bind:this={toolbarElement}
  class="table-toolbar"
  class:dark={dark}
  class:visible={isVisible}
  role="toolbar"
  aria-label="Table formatting options"
>
  <div class="toolbar-group">
    <button 
      class="toolbar-button" 
      disabled={!canAddRowBefore}
      title="Insert row before (Alt+↑)" 
      on:click={() => executeCommand('addRowBefore')}
      aria-label="Insert row before"
    >
      <i data-lucide="arrow-up" class="icon"></i>
      <span class="tooltip">Insert row before (Alt+↑)</span>
    </button>
    <button 
      class="toolbar-button" 
      disabled={!canAddRowAfter}
      title="Insert row after (Alt+↓)" 
      on:click={() => executeCommand('addRowAfter')}
      aria-label="Insert row after"
    >
      <i data-lucide="arrow-down" class="icon"></i>
      <span class="tooltip">Insert row after (Alt+↓)</span>
    </button>
    <button 
      class="toolbar-button danger" 
      disabled={!canDeleteRow}
      title="Delete row (Alt+Delete)" 
      on:click={() => executeCommand('deleteRow')}
      aria-label="Delete row"
    >
      <i data-lucide="trash-2" class="icon"></i>
      <span class="tooltip">Delete row (Alt+Delete)</span>
    </button>
  </div>

  
  <div class="toolbar-group">
    <button 
      class="toolbar-button" 
      disabled={!canAddColumnBefore}
      title="Insert column before (Alt+←)" 
      on:click={() => executeCommand('addColumnBefore')}
      aria-label="Insert column before"
    >
      <i data-lucide="arrow-left" class="icon"></i>
      <span class="tooltip">Insert column before (Alt+←)</span>
    </button>
    <button 
      class="toolbar-button" 
      disabled={!canAddColumnAfter}
      title="Insert column after (Alt+→)" 
      on:click={() => executeCommand('addColumnAfter')}
      aria-label="Insert column after"
    >
      <i data-lucide="arrow-right" class="icon"></i>
      <span class="tooltip">Insert column after (Alt+→)</span>
    </button>
    <button 
      class="toolbar-button danger" 
      disabled={!canDeleteColumn}
      title="Delete column (Alt+Backspace)" 
      on:click={() => executeCommand('deleteColumn')}
      aria-label="Delete column"
    >
      <i data-lucide="trash-2" class="icon"></i>
      <span class="tooltip">Delete column (Alt+Backspace)</span>
    </button>
  </div>
  
  
  
  <div class="toolbar-group">
    <button 
      class="toolbar-button" 
      disabled={!canMergeCells}
      title="Merge cells (Alt+M)" 
      on:click={() => executeCommand('mergeCells')}
      aria-label="Merge cells"
    >
      <i data-lucide="combine" class="icon"></i>
      <span class="tooltip">Merge cells (Alt+M)</span>
    </button>
    <button 
      class="toolbar-button" 
      disabled={!canSplitCell}
      title="Split cell (Alt+S)" 
      on:click={() => executeCommand('splitCell')}
      aria-label="Split cell"
    >
      <i data-lucide="split" class="icon"></i>
      <span class="tooltip">Split cell (Alt+S)</span>
    </button>
  </div>
  
</div>

<style lang="scss">
  .table-toolbar {
    position: fixed;
    z-index: 100;
    display: flex;
    align-items: center;
    background-color: white;
    border-radius: $radius-md;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.05);
    padding: $spacing-1;
    opacity: 0;
    pointer-events: none;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    border: 1px solid rgba(map.get($light, 'border-light'), 0.15);
    transform-origin: center top;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    gap: $spacing-1;
    
    &.visible {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }
    
    &.dark {
      background-color: map.get($dark, 'bg-secondary');
      border-color: rgba(map.get($dark, 'border-medium'), 0.2);
      color: map.get($dark, 'text-primary');
      box-shadow: 0 3px 12px rgba(0, 0, 0, 0.2), 0 0 1px rgba(0, 0, 0, 0.1);
    }
  }
  

  
  .toolbar-group {
    display: flex;
    gap: $spacing-1;
  }
  
  .toolbar-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background-color: transparent;
    color: map.get($light, 'text-secondary');
    border-radius: $radius-sm;
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;
    padding: 0;
    
    &:hover {
      background-color: map.get($light, 'bg-hover');
      color: map.get($light, 'text-primary');
      
      .tooltip {
        opacity: 1;
        transform: translateY(0);
        visibility: visible;
      }
    }
    
    &:active {
      transform: scale(0.92);
      background-color: map.get($light, 'bg-active');
    }
    
    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }
    
    &.danger:hover {
      background-color: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }
    
    .icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      
      :global(svg) {
        width: 100%;
        height: 100%;
        stroke: currentColor;
      }
    }
    
    .tooltip {
      position: absolute;
      bottom: -24px;
      left: 50%;
      transform: translateX(-50%) translateY(4px);
      background-color: rgba(0, 0, 0, 0.75);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition: all 0.2s ease;
      z-index: 10;
      font-weight: 500;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
  }
  
  // Dark theme styles for table toolbar buttons
  :global(.dark) .table-toolbar .toolbar-button {
    color: map.get($dark, 'text-secondary');
    
    &:hover {
      background-color: map.get($dark, 'bg-hover');
      color: map.get($dark, 'text-primary');
      
      .tooltip {
        background-color: rgba(15, 15, 15, 0.9);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
      }
    }
    
    &:active {
      background-color: map.get($dark, 'bg-active');
    }
    
    &.danger:hover {
      background-color: rgba(239, 68, 68, 0.2);
      color: #f87171;
    }
  }
</style>
