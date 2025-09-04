<!-- SlashMenu.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { createIcons } from 'lucide';

  export let x: number;
  export let y: number;
  export let query: string = '';
  export let dark: boolean = false;

  const dispatch = createEventDispatcher();

  let selectedIndex = 0;
  let menuElement: HTMLDivElement;
  
  // Track if we're in slash command mode
  let isSlashCommand = false;

  const commandGroups = [
    {
      id: 'text',
      title: 'Text & Layout',
      commands: [
        {
          id: 'heading1',
          title: 'Large heading',
          // subtitle: 'H₁',
          icon: 'heading-1',
          keywords: ['heading', 'h1', 'title', 'large'],
          command: { type: 'heading', level: 1, content: '' }
        },
        {
          id: 'heading2',
          title: 'Medium heading', 
          // subtitle: 'H₂',
          icon: 'heading-2',
          keywords: ['heading', 'h2', 'subtitle', 'medium'],
          command: { type: 'heading', level: 2, content: '' }
        },
        {
          id: 'heading3',
          title: 'Small heading',
          // subtitle: 'H₃', 
          icon: 'heading-3',
          keywords: ['heading', 'h3', 'small'],
          command: { type: 'heading', level: 3, content: '' }
        },
        {
          id: 'numbered-list',
          title: 'Numbered list',
          subtitle: '',
          icon: 'list-ordered',
          keywords: ['list', 'number', 'ordered', 'numbered'],
          command: { type: 'orderedList', content: '1. ' }
        },
        {
          id: 'bulleted-list',
          title: 'Bulleted list',
          subtitle: '',
          icon: 'list',
          keywords: ['list', 'bullet', 'bulleted', 'unordered'],
          command: { type: 'bulletList', content: '• ' }
        },
        {
          id: 'checklist',
          title: 'Checklist',
          subtitle: '',
          icon: 'check-square',
          keywords: ['checklist', 'todo', 'task', 'checkbox'],
          command: { type: 'taskList', content: '- [ ] ' }
        },
        {
          id: 'quote',
          title: 'Quote',
          subtitle: '',
          icon: 'quote',
          keywords: ['quote', 'blockquote', 'citation'],
          command: { type: 'quote', content: '> ' }
        },
        {
          id: 'code-block',
          title: 'Code block',
          subtitle: '',
          icon: 'code',
          keywords: ['code', 'snippet', 'programming', 'block'],
          command: { type: 'codeBlock', content: '```\n' }
        },
        {
          id: 'line-separator',
          title: 'Line separator',
          subtitle: '',
          icon: 'minus',
          keywords: ['divider', 'separator', 'line', 'break', 'hr'],
          command: { type: 'divider', content: '---' }
        },
        {
          id: 'hyperlink',
          title: 'Hyperlink',
          subtitle: '',
          icon: 'link',
          keywords: ['link', 'url', 'hyperlink', 'external'],
          command: { type: 'link', content: '[Link text](URL)' }
        },
        {
          id: 'clear-formatting',
          title: 'Clear formatting',
          subtitle: '',
          icon: 'eraser',
          keywords: ['clear', 'remove', 'formatting', 'plain'],
          command: { type: 'clearFormatting', content: '' }
        }
      ]
    },
    {
      id: 'display',
      title: 'Display',
      commands: [
        {
          id: 'table',
          title: 'Table',
          subtitle: '',
          icon: 'table',
          keywords: ['table', 'grid', 'data'],
          command: { type: 'table', content: '' }
        },
        {
          id: 'chart',
          title: 'Chart',
          subtitle: '',
          icon: 'bar-chart-3',
          keywords: ['chart', 'graph', 'data', 'visualization'],
          command: { type: 'chart', content: '' }
        }
      ]
    },
    {
      id: 'callout',
      title: 'Callout',
      commands: [
        {
          id: 'info-callout',
          title: 'Info callout',
          subtitle: '',
          icon: 'info',
          color: '#3b82f6',
          keywords: ['info', 'information', 'callout', 'blue'],
          command: { type: 'callout', variant: 'info', content: '' }
        },
        {
          id: 'tip-callout',
          title: 'Tip callout',
          subtitle: '',
          icon: 'check-circle',
          color: '#10b981',
          keywords: ['tip', 'success', 'callout', 'green'],
          command: { type: 'callout', variant: 'tip', content: '' }
        },
        {
          id: 'warning-callout',
          title: 'Warning callout',
          subtitle: '',
          icon: 'triangle-alert',
          color: '#f59e0b',
          keywords: ['warning', 'caution', 'callout', 'yellow'],
          command: { type: 'callout', variant: 'warning', content: '' }
        },
        {
          id: 'critical-callout',
          title: 'Critical callout',
          subtitle: '',
          icon: 'circle-x',
          color: '#ef4444',
          keywords: ['critical', 'error', 'danger', 'callout', 'red'],
          command: { type: 'callout', variant: 'critical', content: '' }
        }
      ]
    },
    {
      id: 'media',
      title: 'Media',
      commands: [
        {
          id: 'image',
          title: 'Image',
          subtitle: '',
          icon: 'image',
          keywords: ['image', 'picture', 'photo', 'upload'],
          command: { type: 'image', content: '' }
        },
        {
          id: 'video',
          title: 'Video',
          subtitle: '',
          icon: 'video',
          keywords: ['video', 'embed', 'youtube', 'media'],
          command: { type: 'video', content: '' }
        },
        {
          id: 'page-embed',
          title: 'Page embed',
          subtitle: '',
          icon: 'square',
          keywords: ['embed', 'page', 'iframe', 'external'],
          command: { type: 'embed', content: '' }
        }
      ]
    },
    {
      id: 'import',
      title: 'Import',
      commands: [
        {
          id: 'confluence',
          title: 'Confluence',
          subtitle: '',
          icon: 'download',
          color: '#0052cc',
          keywords: ['confluence', 'import', 'atlassian'],
          command: { type: 'import', source: 'confluence' }
        },
        {
          id: 'google-docs',
          title: 'Google docs',
          subtitle: '',
          icon: 'file-text',
          color: '#4285f4',
          keywords: ['google', 'docs', 'import', 'document'],
          command: { type: 'import', source: 'google-docs' }
        },
        {
          id: 'ms-word',
          title: 'MS Word',
          subtitle: '',
          icon: 'file-text',
          color: '#2b579a',
          keywords: ['microsoft', 'word', 'import', 'document'],
          command: { type: 'import', source: 'ms-word' }
        }
      ]
    },
    {
      id: 'export',
      title: 'Export',
      commands: [
        {
          id: 'export-pdf',
          title: 'Export to PDF',
          subtitle: '',
          icon: 'file-text',
          color: '#dc2626',
          keywords: ['export', 'pdf', 'download', 'save'],
          command: { type: 'export', format: 'pdf' }
        }
      ]
    }
  ];

  // Flatten all commands for filtering
  $: allCommands = commandGroups.reduce((acc, group) => {
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
  $: filteredGroups = commandGroups.map(group => ({
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
    handleCommand(command);
  }

  function handleKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, filteredCommands.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        break;
      case 'Enter':
        event.preventDefault();
        if (filteredCommands[selectedIndex]) {
          handleCommand(filteredCommands[selectedIndex].command);
        }
        break;
      case 'Escape':
        event.preventDefault();
        dispatch('close');
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

  onMount(() => {
    // Initial icon setup
    updateIcons();

    const handleGlobalKeydown = (event: KeyboardEvent) => {
      handleKeydown(event);
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

  // Handle query changes to detect slash command
  $: if (query && query.startsWith('/')) {
    isSlashCommand = true;
  } else if (query === '') {
    isSlashCommand = false;
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

<div 
  class="command-menu" 
  class:dark
  style="transform: translate({x}px, {y}px)"
  bind:this={menuElement}
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
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(0, 0, 0, 0.06);
    overflow: hidden;
    animation: fadeInScale 0.15s ease-out;

    &.dark {
      background: #2d3748;
      border-color: #4a5568;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3);
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
      background: rgba(0, 0, 0, 0.1);
      border-radius: 3px;
    }

    .dark &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
    }
  }

  .no-results {
    padding: 16px 20px;
    text-align: center;
    color: rgba(55, 53, 47, 0.6);

    .dark & {
      color: rgba(255, 255, 255, 0.6);
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
    color: rgba(55, 53, 47, 0.65);
    text-transform: uppercase;
    letter-spacing: 0.5px;

    .dark & {
      color: rgba(255, 255, 255, 0.65);
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
      background: rgba(55, 53, 47, 0.08);
    }

    .dark &:hover,
    .dark &.selected {
      background: rgba(255, 255, 255, 0.08);
    }

    &.selected {
      background: rgba(46, 170, 220, 0.1);

      .command-title {
        color: #2eaadc;
      }
    }
  }

  .command-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    color: rgba(55, 53, 47, 0.8);
    flex-shrink: 0;

    .dark & {
      color: rgba(255, 255, 255, 0.8);
    }
  }

  .command-content {
    flex: 1;
    min-width: 0;
  }

  .command-title {
    font-size: 14px;
    font-weight: 400;
    color: rgba(55, 53, 47, 0.95);
    line-height: 1.2;
    margin-bottom: 2px;

    .dark & {
      color: rgba(255, 255, 255, 0.9);
    }
  }

  .command-subtitle {
    font-size: 12px;
    color: rgba(55, 53, 47, 0.6);
    line-height: 1.3;

    .dark & {
      color: rgba(255, 255, 255, 0.6);
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