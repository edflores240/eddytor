<!-- src/lib/components/FloatingToolbar.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { EditorView } from 'prosemirror-view';
  import { createEventDispatcher } from 'svelte';
  import { isMarkActive, isNodeActive } from './floating-toolbar/utils/selection';
  import { executeCommand } from './floating-toolbar/commands';
  import { computePosition, flip, shift, offset, autoUpdate } from '@floating-ui/dom';
  import type { ToolbarItem } from './floating-toolbar/types';

  export let view: EditorView;
  export let dark: boolean = false;
  export let isHovered = false;

  const dispatch = createEventDispatcher();
  let toolbarElement: HTMLElement;
  let isVisible = false;
  
  // Reset hover state when visibility changes
  $: if (!isVisible) {
    isHovered = false;
  }
  let ToolbarButton;
  let ToolbarDivider;
  let cleanup: (() => void) | null = null;

  onMount(async () => {
    ToolbarButton = (await import('./floating-toolbar/ToolbarButton.svelte')).default;
    ToolbarDivider = (await import('./floating-toolbar/ToolbarDivider.svelte')).default;
  });

const toolbarItems = [
    { command: 'text-format', icon: 'type', title: 'Text Format', type: 'dropdown' },
    { command: 'text-color', icon: 'baseline', title: 'Text Color', type: 'color-picker' },
    { type: 'separator' },
    { command: 'strong', icon: 'bold', title: 'Bold', shortcut: '⌘B', type: 'button' },
    { command: 'em', icon: 'italic', title: 'Italic', shortcut: '⌘I', type: 'button' },
    { command: 'underline', icon: 'underline', title: 'Underline', shortcut: '⌘U', type: 'button' },
    { command: 'strikethrough', icon: 'strikethrough', title: 'Strikethrough', shortcut: '⌘⇧X', type: 'button' },
    { type: 'separator' },
    { command: 'align-left', icon: 'align-left', title: 'Align Left', type: 'button' },
    { command: 'align-center', icon: 'align-center', title: 'Align Center', type: 'button' },
    { command: 'align-right', icon: 'align-right', title: 'Align Right', type: 'button' },
    { type: 'separator' },
    { command: 'link', icon: 'link', title: 'Add Link', shortcut: '⌘K', type: 'button-link' },
    { command: 'brush', icon: 'paintbrush', title: 'Brush Tool', type: 'button' }
  ] as const;

  function isItemActive(item: ToolbarItem): boolean {
    if (item.type !== 'button') return false;
    
    const { state } = view;
    const { selection } = state;
    
    // Handle heading levels
    if (item.command.startsWith('heading')) {
      const level = parseInt(item.command.replace('heading', ''));
      return isNodeActive(state, 'heading', { level });
    }
    
    // Handle list types
    if (item.command === 'bulletList') {
      return isNodeActive(state, 'bullet_list');
    }
    
    if (item.command === 'orderedList') {
      return isNodeActive(state, 'ordered_list');
    }
    
    // Handle text color
    if (item.command === 'baseline' || item.command === 'textColor') {
      const mark = state.schema.marks.textColor;
      if (!mark) return false;
      
      // Check if any text color mark is active
      return isMarkActive(state, 'textColor');
    }
    
    // Handle font size
    if (item.command === 'font-size' || item.command === 'fontSize') {
      const mark = state.schema.marks.fontSize;
      if (!mark) return false;
      
      // Check if any font size mark is active
      return isMarkActive(state, 'fontSize');
    }
    
    // Default mark check
    return isMarkActive(state, item.command);
  }

  interface CommandEventDetail {
    command: string;
    value?: any;
  }

// Add this function to your FloatingToolbar.svelte script section
function handleToolbarInteraction() {
  dispatch('toolbar-interaction');
}

  function handleCommand(event: CustomEvent<CommandEventDetail>) {
    event.stopPropagation();
    const { command, value } = event.detail;
    
    // Execute the command and check if it was handled
    const commandHandled = executeCommand(view, command, value);
    
    if (commandHandled) {
      // Command was handled successfully
      dispatch('command', { command, value });
      
      // Update the toolbar state after command execution
      updatePosition();
    } else {
      // Command was not handled, dispatch error event
      dispatch('error', { 
        message: `Command '${command}' not handled`,
        command,
        value
      });
    }
  }

  function createVirtualElement() {
  if (!view) return { getBoundingClientRect: () => new DOMRect() };
  
  return {
    getBoundingClientRect: (): DOMRect => {
      const { state } = view;
      const { selection } = state;
      
      if (selection.empty) {
        return new DOMRect(0, 0, 0, 0);
      }

      // Determine selection direction
      const isRTL = selection.from > selection.to;
      const from = Math.min(selection.from, selection.to);
      const to = Math.max(selection.from, selection.to);
      
      // Get coordinates for selection edges
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to, -1);
      
      if (!start || !end) {
        return new DOMRect(0, 0, 0, 0);
      }

      // Handle multi-line selections
      if (start.top !== end.top) {
        const editorRect = view.dom.getBoundingClientRect();
        return new DOMRect(
          editorRect.left,
          start.top,
          editorRect.width,
          end.bottom - start.top
        );
      }

      // For single-line selections, use the correct coordinates based on direction
      const left = isRTL ? end.left : start.left;
      const right = isRTL ? start.right : end.right;
      const width = right - left;
      const height = start.bottom - start.top;

      return new DOMRect(
        left,
        start.top,
        width,
        height
      );
    }
  };
}
async function updatePosition() {
  if (!view || !toolbarElement) {
    isVisible = false;
    return;
  }

  const { state } = view;
  const { selection } = state;
  
  // Check for valid selection
  if (selection.empty || selection.from === selection.to) {
    isVisible = false;
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
    return;
  }
  
  // Get selection coordinates
  const start = view.coordsAtPos(selection.from);
  const end = view.coordsAtPos(selection.to, -1);
  
  // Only require that we can get coordinates, not that they're visible
  if (!start || !end) {
    isVisible = false;
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
    return;
  }
  
  const virtualEl = createVirtualElement();
  
  // Show toolbar first so it can be measured
  isVisible = true;
  
  // Wait for next tick to ensure toolbar is rendered
  await new Promise(resolve => requestAnimationFrame(resolve));
  
  if (!toolbarElement) return;
  
  // Set up auto-updating position
  if (cleanup) cleanup();
  
  cleanup = autoUpdate(virtualEl, toolbarElement, async () => {
    try {
      const { x, y } = await computePosition(virtualEl, toolbarElement, {
        placement: 'top',
        middleware: [
          offset(8),
          flip({
            fallbackPlacements: ['bottom', 'top']
          }),
          shift({ padding: 8 })
        ]
      });
      
      Object.assign(toolbarElement.style, {
        left: `${Math.round(x)}px`,
        top: `${Math.round(y)}px`,
        opacity: '1',
        pointerEvents: 'auto'
      });
    } catch (error) {
      console.error('Error positioning toolbar:', error);
    }
  });
}
  // Set up event listeners
  let updateTimeout: number;
  let isUpdating = false;
  let documentMouseUpHandler: (() => void) | null = null;

  async function scheduleUpdate() {
    if (updateTimeout) {
      cancelAnimationFrame(updateTimeout);
    }
    
    // Throttle updates to prevent jank
    if (isUpdating) return;
    
    updateTimeout = requestAnimationFrame(async () => {
      isUpdating = true;
      try {
        await updatePosition();
      } catch (error) {
        console.error('Error updating toolbar position:', error);
      } finally {
        isUpdating = false;
      }
    });
  }

   // Handle mouse up events on document to catch selections that end outside editor
   function handleDocumentMouseUp(event: MouseEvent) {
    // Small delay to ensure selection is finalized
    setTimeout(() => {
      scheduleUpdate();
    }, 50);
  }

  onMount(() => {
    view.dom.addEventListener('mouseup', scheduleUpdate);
    view.dom.addEventListener('keyup', scheduleUpdate);
    view.dom.addEventListener('scroll', scheduleUpdate);
    window.addEventListener('resize', scheduleUpdate);
    
    // Add document mouseup handler to catch selections ending outside editor
    documentMouseUpHandler = handleDocumentMouseUp;
    document.addEventListener('mouseup', documentMouseUpHandler);
  });

  onDestroy(() => {
    if (updateTimeout) {
      cancelAnimationFrame(updateTimeout);
    }
    
    if (cleanup) {
      cleanup();
    }
    
    view.dom.removeEventListener('mouseup', scheduleUpdate);
    view.dom.removeEventListener('keyup', scheduleUpdate);
    view.dom.removeEventListener('scroll', scheduleUpdate);
    window.removeEventListener('resize', scheduleUpdate);
    
    // Clean up document mouseup handler
    if (documentMouseUpHandler) {
      document.removeEventListener('mouseup', documentMouseUpHandler);
    }
  });
</script>

<div 
  class="floating-toolbar"
  class:dark
  class:visible={isVisible}
  bind:this={toolbarElement}
  role="toolbar"
  aria-orientation="horizontal"
  aria-label="Text formatting"
  tabindex="0"
  on:mousedown|stopPropagation={handleToolbarInteraction}
  on:click|stopPropagation={handleToolbarInteraction}
  on:touchstart|stopPropagation={handleToolbarInteraction}
  on:mouseenter={() => isHovered = true}
  on:mouseleave={() => isHovered = false}
  on:blur={() => isHovered = false}
>
  {#if ToolbarButton && ToolbarDivider}
    {#each toolbarItems as item}
      {#if item.type === 'separator'}
        <ToolbarDivider />
      {:else}
        <div 
          role="none"
          on:click|stopPropagation 
          on:keydown|stopPropagation
        >
          <ToolbarButton
            on:command={handleCommand}
            {dark}
            {...item}
            active={isItemActive(item)}
          />
        </div>
      {/if}
    {/each}
  {/if}
</div>

<style lang="scss">
  .floating-toolbar {
    position: absolute;
    display: flex;
    align-items: center;
    background: map.get($light, 'bg-secondary');
    border-radius: $radius-lg;
    padding: $spacing-1;
    box-shadow: map.get($light, 'modal-shadow');
    z-index: $z-popover;
    pointer-events: auto;
    gap: $spacing-1;
   
    opacity: 0;
    transform: scale(0.95);
    transition: all 0.15s ease;
    
    &.visible {
      opacity: 1;
      transform: scale(1);
    }
    
    &.dark {
      background: map.get($dark, 'bg-secondary');
      border-color: map.get($dark, 'border-strong');
      box-shadow: map.get($dark, 'modal-shadow');
    }
  }
</style>