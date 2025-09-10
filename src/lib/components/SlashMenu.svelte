<!-- SlashMenu.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy, tick } from 'svelte';
  import { EditorView } from 'prosemirror-view';
  import { computePosition, flip, shift, offset } from '@floating-ui/dom';
  import itemGroups from './slash-menu/config';

  export let view: EditorView;
  export let query: string = '';
  export let dark: boolean = false;

  const dispatch = createEventDispatcher();

  let selectedIndex = 0;
  let menuElement: HTMLDivElement;
  let isVisible = false;

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
    const matches = cmd.keywords.some(keyword => keyword.toLowerCase().startsWith(searchText)) ||
                   cmd.title.toLowerCase().includes(searchText) ||
                   (cmd.subtitle && cmd.subtitle.toLowerCase().includes(searchText));
    
    return matches;
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

  // Show/hide menu based on query
  $: {
    if (query && query.length > 0) {
      showMenu();
    } else {
      hideMenu();
    }
  }

  // Handle command selection
  function handleCommand(command: any) {
    if (!command) return;
    dispatch('select', command.command);
    hideMenu();
  }

  // Handle click on menu item
  function handleClick(event: MouseEvent, command: any) {
    event.preventDefault();
    event.stopPropagation();
    handleCommand(command);
  }

  // Handle keyboard navigation
  function handleKeydown(event: KeyboardEvent) {
    if (!isVisible) return;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, filteredCommands.length - 1);
        scrollSelectedIntoView();
        break;
      case 'ArrowUp':
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        scrollSelectedIntoView();
        break;
      case 'Enter':
        event.preventDefault();
        if (filteredCommands[selectedIndex]) {
          handleCommand(filteredCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        hideMenu();
        dispatch('close');
        break;
    }
  }

  // Scroll selected item into view
  function scrollSelectedIntoView() {
    if (!menuElement) return;
    
    const selectedElement = menuElement.querySelector('.command-item.selected');
    if (selectedElement) {
      selectedElement.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
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
  $: if (filteredCommands && isVisible) {
    updateIcons();
  }

  // Create virtual element at slash position
  function createVirtualElement() {
    if (!view) return { getBoundingClientRect: () => new DOMRect() };
    
    const { state } = view;
    const { selection } = state;
    const { $from } = selection;

    // Search for the last slash before the cursor in the parent node
    let slashOffset = -1;
    for (let i = $from.parentOffset - 1; i >= 0; i--) {
      if ($from.parent.textBetween(i, i + 1) === '/') {
        slashOffset = i;
        break;
      }
    }

    // If no slash found, use cursor position
    let targetPos = selection.from;
    if (slashOffset !== -1) {
      targetPos = $from.start() + slashOffset;
    }

    const coords = view.coordsAtPos(targetPos);
    if (!coords) return { getBoundingClientRect: () => new DOMRect() };

    // Return a virtual element at the target position
    return {
      getBoundingClientRect: () => ({
        width: 1,
        height: coords.bottom - coords.top,
        x: coords.left,
        y: coords.top,
        left: coords.left,
        right: coords.left + 1,
        top: coords.top,
        bottom: coords.bottom,
        toJSON: () => ({
          x: coords.left,
          y: coords.top,
          width: 1,
          height: coords.bottom - coords.top,
          top: coords.top,
          right: coords.left + 1,
          bottom: coords.bottom,
          left: coords.left
        })
      })
    };
  }

  // Position menu using Floating UI
  async function positionMenu() {
    if (!view || !menuElement || !isVisible) return;
    
    // Wait for DOM to be ready
    await tick();
    
    if (!menuElement) return;
    
    const virtualEl = createVirtualElement();
    
    try {
      const { x, y } = await computePosition(virtualEl, menuElement, {
        placement: 'bottom-start',
        middleware: [
          offset(8), // 8px offset from the cursor
          flip({
            fallbackPlacements: ['top-start', 'bottom-end', 'top-end'],
            padding: 8
          }),
          shift({ 
            padding: 8,
            crossAxis: true // Allow shifting on cross axis too
          })
        ]
      });
      
      Object.assign(menuElement.style, {
        left: `${Math.round(x)}px`,
        top: `${Math.round(y)}px`,
      });
      
    } catch (error) {
      console.error('Error positioning slash menu:', error);
    }
  }

  async function showMenu() {
    if (!isVisible) {
      isVisible = true;
      // Wait for the menu to be rendered before positioning
      await tick();
      positionMenu();
    }
  }

  function hideMenu() {
    isVisible = false;
  }

  onMount(() => {
    // Set up keyboard listener
    const handleGlobalKeydown = (event: KeyboardEvent) => {
      // Only handle if the editor is focused
      if (document.activeElement === view.dom || view.dom.contains(document.activeElement)) {
        handleKeydown(event);
      }
    };

    document.addEventListener('keydown', handleGlobalKeydown);
    
    return () => {
      document.removeEventListener('keydown', handleGlobalKeydown);
    };
  });

  // Reset selected index when filtered commands change
  $: if (filteredCommands) {
    selectedIndex = 0;
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

{#if isVisible}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="slash-menu"
    class:dark
    bind:this={menuElement}
    on:click|stopPropagation
    role="menu"
    aria-label="Slash commands"
    tabindex="-1"
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
                on:click={(e) => handleClick(e, command)}
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
{/if}

<style lang="scss">
  .slash-menu {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
    min-width: 280px;
    max-width: 320px;
    max-height: 400px;
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

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: map.get($light, 'border-light');
      border-radius: 3px;
    }

    .dark &::-webkit-scrollbar-thumb {
      background: map.get($dark, 'border-light');
    }
  }

  .no-results {
    padding: 16px 20px;
    text-align: center;
    color: map.get($light, 'text-tertiary');

    .dark & {
      color: map.get($dark, 'text-tertiary');
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
      background: map.get($light, 'bg-tertiary');
    }

    .dark &:hover,
    .dark &.selected {
      background: map.get($dark, 'bg-tertiary');
    }

    &.selected {
      background: map.get($light, 'bg-tertiary');

      .command-title {
        color: map.get($light, 'text-primary');
      }

      .dark & {
        background: map.get($dark, 'bg-tertiary');
        
        .command-title {
          color: map.get($dark, 'text-primary');
        }
      }
    }
  }

  .command-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    color: map.get($light, 'text-tertiary');
    flex-shrink: 0;

    .dark & {
      color: map.get($dark, 'text-tertiary');
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
    line-height: 1.2;
    margin-bottom: 2px;
    font-family: $font-family-primary;

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