<!-- SlashMenu.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { EditorView } from 'prosemirror-view';
  import { computePosition, flip, shift, offset, autoUpdate } from '@floating-ui/dom';
  import itemGroups from './slash-menu/config';

  export let view: EditorView;
  export let query: string = '';
  export let dark: boolean = false;

  const dispatch = createEventDispatcher();

  let selectedIndex = 0;
  let menuElement: HTMLDivElement;
  let isVisible = false;
  let cleanup: (() => void) | null = null;
  let isSlashCommand = false;



  // Flatten all commands for filtering
  $: allCommands = itemGroups.reduce((acc, group) => {
    return [...acc, ...group.commands.map(cmd => ({ ...cmd, groupTitle: group.title }))];
  }, []);

  // Filter commands based on slash command
  $: filteredCommands = allCommands.filter(cmd => {
    if (!query) return true;
    
    // Remove the leading slash if present
    const searchText = query.startsWith('/') ? query.slice(1).toLowerCase() : query.toLowerCase();
    
    // Check if any keyword starts with the search text
    return cmd.keywords.some(keyword => keyword.toLowerCase().startsWith(searchText)) ||
           cmd.title.toLowerCase().includes(searchText) ||
           (cmd.subtitle && cmd.subtitle.toLowerCase().includes(searchText));
  });

  // Group filtered commands
  $: filteredGroups = itemGroups.map(group => ({
    ...group,
    commands: group.commands.filter(cmd => 
      filteredCommands.some(filtered => filtered.id === cmd.id)
    )
  })).filter(group => group.commands.length > 0);
  
  // Auto-select the first command when filtered results change
  $: if (filteredCommands.length > 0) {
    selectedIndex = 0;
  }

  // Handle command selection
  function handleCommand(command: any) {
    if (!command) return;
    dispatch('select', command);
    dispatch('close');
  }

  // Handle click on menu item
  function handleClick(event: MouseEvent, command: any) {
    event.preventDefault();
    event.stopPropagation();
  }

  // Handle keyboard navigation
  function handleKeydown(event: KeyboardEvent) {
    if (!isSlashCommand) return;
    
    switch (event.key) {
      case 'ArrowDown':
        if (!isVisible) return;
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, filteredCommands.length - 1);
        break;
      case 'ArrowUp':
        if (!isVisible) return;
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        break;
      case 'Enter':
        if (!isVisible) return;
        event.preventDefault();
        if (filteredCommands[selectedIndex]) {
          handleCommand(filteredCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        dispatch('close');
        break;
      case '/':
        // Only handle slash if it's the first character
        if (query === '') {
          event.preventDefault();
          isSlashCommand = true;
          scheduleUpdate();
        }
        break;
    }
  }

  // Track a version number to force re-renders
  let iconVersion = 0;
  
  // Function to update Lucide icons
  function updateIcons() {
    iconVersion++;
    requestAnimationFrame(() => {
      import('lucide').then(({ createIcons, icons }) => {
        createIcons({
          icons,
          attrs: {
            class: 'w-4 h-4',
            'stroke-width': 2
          },
          nameAttr: 'data-lucide'
        });
      });
    });
  }

  // Update icons when filtered commands change
  $: if (filteredCommands) {
    updateIcons();
  }

  function createVirtualElement() {
    if (!view) return { getBoundingClientRect: () => new DOMRect() };
    
    const { state } = view;
    const { selection } = state;
    
    // Get cursor position
    const pos = selection.$from.pos;
    const coords = view.coordsAtPos(pos);
    
    if (!coords) return { getBoundingClientRect: () => new DOMRect() };
    
    // Create a small rectangle at cursor position
    return {
      getBoundingClientRect: () => new DOMRect(
        coords.left,
        coords.bottom + 5, // Position below cursor
        1,  // Minimal width
        1   // Minimal height
      )
    };
  }

  async function updatePosition() {
    if (!view || !menuElement) {
      isVisible = false;
      return;
    }

    if (!isSlashCommand || !query) {
      isVisible = false;
      if (cleanup) {
        cleanup();
        cleanup = null;
      }
      return;
    }

    // Show menu first so it can be measured
    isVisible = true;
    
    // Wait for next tick to ensure menu is rendered
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    if (!menuElement) return;
    
    const virtualEl = createVirtualElement();
    
    // Set up auto-updating position
    if (cleanup) cleanup();
    
    cleanup = autoUpdate(virtualEl, menuElement, async () => {
      try {
        const { x, y } = await computePosition(virtualEl, menuElement, {
          placement: 'bottom-start',
          middleware: [
            offset(8),
            flip({
              fallbackPlacements: ['top-start', 'bottom-end', 'top-end']
            }),
            shift({ padding: 8 })
          ]
        });
        
        Object.assign(menuElement.style, {
          left: `${Math.round(x)}px`,
          top: `${Math.round(y)}px`,
          opacity: '1',
          pointerEvents: 'auto'
        });
      } catch (error) {
        console.error('Error positioning slash menu:', error);
      }
    });
  }

  // Set up event listeners
  let updateTimeout: number;
  let isUpdating = false;

  function scheduleUpdate() {
    if (updateTimeout) {
      cancelAnimationFrame(updateTimeout);
    }
    
    if (isUpdating) return;
    
    updateTimeout = requestAnimationFrame(async () => {
      isUpdating = true;
      try {
        await updatePosition();
      } catch (error) {
        console.error('Error updating slash menu position:', error);
      } finally {
        isUpdating = false;
      }
    });
  }

  onMount(() => {
    // Initial setup
    updateIcons();
    
    // Set up listeners
    view.dom.addEventListener('keyup', scheduleUpdate);
    view.dom.addEventListener('keydown', handleKeydown);
    window.addEventListener('resize', scheduleUpdate);
    
    // Initial position update
    scheduleUpdate();
    
    return () => {
      if (updateTimeout) {
        cancelAnimationFrame(updateTimeout);
      }
      
      if (cleanup) {
        cleanup();
      }
      
      view.dom.removeEventListener('keyup', scheduleUpdate);
      view.dom.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('resize', scheduleUpdate);
    };
  });

  // Reset selected index when filtered commands change
  $: if (filteredCommands) {
    selectedIndex = 0;
    if (isSlashCommand) {
      scheduleUpdate();
    }
  }

  // Handle query changes to detect slash command
  $: if (query && query.startsWith('/')) {
    isSlashCommand = true;
    scheduleUpdate();
  } else if (query === '') {
    isSlashCommand = false;
    isVisible = false;
  }

  // Get current selected command index within filtered commands
  function getGlobalIndex(groupIndex: number, commandIndex: number): number {
    let globalIndex = 0;
    for (let i = 0; i < groupIndex; i++) {
      globalIndex += filteredGroups[i].commands.length;
    }
    return globalIndex + commandIndex;
  }
</script>


<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  class="slash-menu"
  class:dark
  class:visible={isVisible}
  bind:this={menuElement}
  on:click|stopPropagation
  role="menu"
  aria-label="Slash commands"
  tabindex="-1"
  style="opacity: 0; pointer-events: none;"
>
  <div class="command-list">
    {#if filteredCommands.length === 0}
      <div class="no-results">
        <span class="no-results-text">No matching blocks</span>
      </div>
    {:else}
      {#each filteredGroups as group, groupIndex}
        <div class="command-group">
          <div class="command-group-heading">{group.title}</div>
          {#each group.commands as command, commandIndex}
            {@const globalIndex = getGlobalIndex(groupIndex, commandIndex)}
            <button
              class="command-item"
              class:selected={globalIndex === selectedIndex}
              on:click={(e) => handleClick(e, command.command)}
              on:mouseenter={() => selectedIndex = globalIndex}
            >
              <div class="command-icon" style={command.color ? `color: ${command.color}` : ''}>
                <i data-lucide={command.icon} class="w-4 h-4" data-version={iconVersion}></i>
              </div>
              <div class="command-content">
                <div class="command-title">{command.title}</div>
                {#if command.subtitle}
                  <div class="command-subtitle">{command.subtitle}</div>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      {/each}
    {/if}
  </div>
</div>

<style lang="scss">
  .command-menu {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1000;
    min-width: 280px;
    max-width: 320px;
    background: map.get($light, 'bg-secondary');
    border-radius: 12px;
    box-shadow: map.get($light, 'modal-shadow');
    
    overflow: hidden;
    animation: fadeInScale 0.15s ease-out;
    

    &.dark {
      background: map.get($dark, 'bg-secondary');
    
      box-shadow: map.get($dark, 'modal-shadow');
    }
  }


  .command-list {
    max-height: 400px;
    overflow-y: auto;
    padding: 8px 0;
    font-family: $font-family-primary;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: map.get($light, 'bg-hover');
      border-radius: 3px;
    }

    .dark &::-webkit-scrollbar-thumb {
      background: map.get($dark, 'bg-hover');
    }
  }

  .no-results {
    padding: 16px 20px;
    text-align: center;
    color: map.get($light, 'text-muted');

    .dark & {
      color: map.get($dark, 'text-muted');
    }
  }

  .no-results-text {
    font-size: 14px;
  }

  .command-group {
    &:not(:first-child) {
      margin-top: 16px;
    }
  }

  .command-group-heading {
    padding: 8px 16px 4px;
    font-size: 11px;
    font-weight: 600;
    color: map.get($light, 'text-tertiary');
    text-transform: uppercase;
    letter-spacing: 0.5px;

    .dark & {
      color: map.get($dark, 'text-tertiary');
    }
  }

  .command-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 8px 16px;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.1s ease;
    gap: 12px;

    &:hover,
    &.selected {
      background: map.get($light, 'bg-hover');
    }

    .dark &:hover,
    .dark &.selected {
      background: map.get($dark, 'bg-hover');
    }

    &.selected {
      background: map.get($light, 'bg-active');

      .command-title {
        color: map.get($light, 'accent-primary');
      }
    }
  }

  .command-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    color: map.get($light, 'text-secondary');
    flex-shrink: 0;

    .dark & {
      color: map.get($dark, 'text-secondary');
    }
  }

  .command-content {
    flex: 1;
    min-width: 0;
  }

  .command-title {
    font-size: 14px;
    font-weight: 400;
    color: map.get($light, 'text-primary');
    font-family: $font-family-primary;
    line-height: 1.2;
    margin-bottom: 2px;

    .dark & {
      color: map.get($dark, 'text-primary');
    }
  }

  .command-subtitle {
    font-size: 12px;
    color: map.get($light, 'text-tertiary');
    line-height: 1.3;

    .dark & {
      color: map.get($dark, 'text-tertiary');
    }
  }

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-8px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
</style>