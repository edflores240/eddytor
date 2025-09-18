<!-- App.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { EditorState, Plugin } from 'prosemirror-state';
  import { EditorView, Decoration, DecorationSet } from 'prosemirror-view';
  import { schema } from './lib/schema';
  import { paragraphNodeViewFactory } from './lib/utils/ParagraphNodeView';
  import { codeBlockHighlightPlugin } from './lib/plugins/CodeBlockHighlightPlugin';
  import { selectAllCodePlugin } from './lib/plugins/code_block/selectAllCode';
  import { exitCodeBlockAfterTripleEnter } from './lib/plugins/code_block/exitCodeBlock';
  import { preserveNonEmptyCodeBlockPlugin } from './lib/plugins/code_block/preserveEmptyCodeBlockPlugin';
  import { createLineSeparatorShortcut } from './lib/plugins/shortcuts/LineSeparatorShortcut';
  import { createClearFormattingShortcut } from './lib/plugins/shortcuts/ClearFormattingShortcut';
  import { createTablePlugins } from './lib/plugins/table/TablePlugin';

  import { history, redo, undo } from 'prosemirror-history';
  import { keymap } from 'prosemirror-keymap';
  import { baseKeymap } from 'prosemirror-commands';
  import { DOMParser, Node } from 'prosemirror-model';
  import { writable } from 'svelte/store';
  import { commandRegistry } from './lib/core/CommandRegistry';
  import { createEditorKeymap, createTabHandlingPlugin, setupEditorTabHandling } from './lib/commands/lists/ListCommands';

  export let initialContent: string = '';

  export let titleConfig: {
    enabled?: boolean;
    placeholder?: string;
    editable?: boolean;
    className?: string;
    attributes?: Record<string, string>;
    initialValue?: string;
  } = { enabled: false };
  
  import { PlaceholderConfig } from './lib/types';
  
  export let placeholderConfig: PlaceholderConfig = {};




  let editorContainer: HTMLDivElement | null = null;
  let view: EditorView | null = null;
  let showFloatingToolbar = false;
  let showSlashMenu = false;
  let showPlusButton = false;
  let floatingToolbar: { isHovered: boolean } | null = null;
  let plusButtonPos = { x: 0, y: 0 };
  let slashQuery = '';
  let currentLineNode: Node | null = null;

  // Title state
  let titleValue = titleConfig.initialValue || '';

  // Theme store
  const isDarkMode = writable(true);

  let FloatingToolbar;
  let SlashMenu;
  let PlusButton;
  let Title;
  let TableToolbar;




  onMount(async () => {
    FloatingToolbar = (await import('./lib/components/FloatingToolbar.svelte')).default;
    SlashMenu = (await import('./lib/components/SlashMenu.svelte')).default;
    PlusButton = (await import('./lib/components/PlusButton.svelte')).default;
    Title = (await import('./lib/components/Title.svelte')).default;
    TableToolbar = (await import('./lib/components/TableToolbar.svelte')).default;
  });

  // Plugin to handle plus button positioning
  const plusButtonPlugin = new Plugin({
    state: {
      init() { return DecorationSet.empty; },
      apply(tr, old) { return old.map(tr.mapping, tr.doc); }
    },
    view(editorView) {
      return {
        update: (view, prevState) => {
          const { state } = view;
          const { selection } = state;
          
          if (selection.empty) {
            const { $from } = selection;
            const node = $from.parent;
            
            // Show plus button for empty paragraphs or at start of line
            if (node.type.name === 'paragraph' &&
                (node.textContent.trim() === '' || $from.parentOffset === 0)) {
              
              const coords = view.coordsAtPos(selection.from);
              
              if (coords) {
                const editorTop = editorContainer?.getBoundingClientRect()?.top || 0;
                const centerY = ((coords.top + coords.bottom) / 2) - editorTop - 18;

                plusButtonPos = {
                  x: 10, // fixed distance from content
                  y: centerY
                };

                showPlusButton = true;
                currentLineNode = node;
              }
            } else {
              showPlusButton = false;
            }

          } else {
            showPlusButton = false;
          }
        }
      };
    }
  });

  // Plugin to handle slash commands and insert a marker for menu positioning

const slashCommandPlugin = new Plugin({
  state: {
    init() { return { match: null, decorations: DecorationSet.empty }; },
    apply(tr, prev, oldState, newState) {
      const { selection } = newState;
      if (!selection.empty) return { match: null, decorations: DecorationSet.empty };
      const { $from } = selection;
      const textBefore = $from.parent.textBetween(
        Math.max(0, $from.parentOffset - 20),
        $from.parentOffset,
        undefined,
        '\ufffc'
      );
      const match = /\/(\w*)$/.exec(textBefore);
      if (match) {
        const newQuery = '/' + match[1];
        slashQuery = newQuery;
        showSlashMenu = true;
        // Find slash position in parent
        const slashOffset = $from.parentOffset - match[0].length;
        const deco = DecorationSet.create(newState.doc, [
          Decoration.inline(
            $from.start() + slashOffset,
            $from.start() + slashOffset + 1,
            { class: 'slash-marker' },
            { inclusiveStart: false, inclusiveEnd: false }
          )
        ]);
        return { match, decorations: deco };
      }
      slashQuery = '';
      showSlashMenu = false;
      return { match: null, decorations: DecorationSet.empty };
    }
  },
  props: {
    decorations(state) {
      return this.getState(state)?.decorations;
    }
  }
});

  // Plugin to handle text selection toolbar
 // Plugin to handle text selection toolbar
 const selectionPlugin = new Plugin({
    view(editorView) {
      return {
        update: (view, prevState) => {
          const { state } = view;
          const { selection } = state;

          // The original logic is good for handling selection changes.
          if (!selection.empty && selection.from !== selection.to) {
            showFloatingToolbar = true;
          } else {
            showFloatingToolbar = false;
          }
        }
      };
    },
    props: {
      handleDOMEvents: {
        // This handles clicks outside the editor.
        blur: (view, event) => {
          // Only hide the toolbar if not hovering over it
          if (!floatingToolbar || !floatingToolbar.isHovered) {
            showFloatingToolbar = false;
          }
          return false; // Allow other event handlers to run.
        },
        // This handles re-focusing the editor when a selection already exists.
        focus: (view, event) => {
          const { state } = view;
          if (!state.selection.empty && state.selection.from !== state.selection.to) {
            showFloatingToolbar = true;
          }
          return false; // Allow other event handlers to run.
        }
      }
    }
  });

  const parseContent = (content: string) => {
    const contentElement = document.createElement('div');
    contentElement.innerHTML = content || '<p></p>';
    return DOMParser.fromSchema(schema).parse(contentElement);
  };

  const createEditorState = (initialContent: string) => {
  // Create editor keymap for Enter key only
  const editorKeymap = createEditorKeymap(schema);
  
  // Create tab handling plugin
  const tabPlugin = createTabHandlingPlugin(schema);
  
  return EditorState.create({
    doc: initialContent ? parseContent(initialContent) : undefined,
    plugins: [
      history(),
      // Add the tab handling plugin FIRST for highest priority
      tabPlugin,

      // codeblock_plugins
      exitCodeBlockAfterTripleEnter(schema),
      preserveNonEmptyCodeBlockPlugin,
      selectAllCodePlugin,
      
      // table plugins - enable column resizing, cell selection, table editing
      ...createTablePlugins(),
      
      // shortcuts
      createLineSeparatorShortcut(),
      createClearFormattingShortcut(),
      keymap(editorKeymap),
      keymap({
        ...baseKeymap,
        'Mod-z': undo,
        'Mod-y': redo,
        'Mod-Shift-z': redo,
      }),
    
      plusButtonPlugin,
      slashCommandPlugin,
      selectionPlugin,
      codeBlockHighlightPlugin,
      
    ]
  });
};

  async function executeCommand(commandId: string) {
    if (!view) return;

    const result = await commandRegistry.executeCommand(commandId, {
      view: view,
      // Add any additional context needed by commands
    });

    if (!result.success) {
      console.error('Command execution failed:', result.message);
    }

    // Close the slash menu after command execution
    showSlashMenu = false;
  }

  // Update the slash command handler
  function handleSlashCommand(command: { id?: string }) {
    if (!command || !command.id) {
      console.error('Invalid command received:', command);
      return;
    }
    console.log('Executing command:', command.id);
    executeCommand(command.id);
  }

  function handlePlusClick() {
    console.log('Plus button clicked - showing slash menu');
    showSlashMenu = true;
    slashQuery = '/'; // Start with just slash when clicking plus button
  }

  function handleTitleChange(event) {
    titleValue = event.detail.value;
    // You can dispatch this to parent or handle it as needed
  }

  function handleTitleSubmit() {
    // Focus the editor when user presses Enter in title
    if (view) {
      view.focus();
      // Move cursor to start of document
      const tr = view.state.tr.setSelection(
        view.state.selection.constructor.atStart(view.state.doc)
      );
      view.dispatch(tr);
    }
  }


  function toggleDarkMode() {
    isDarkMode.update(dark => {
      const newValue = !dark;
      if (typeof window !== 'undefined') {
        localStorage.setItem('eddytor-theme', newValue ? 'dark' : 'light');
      }
      return newValue;
    });
  }

  onMount(() => {
    if (!editorContainer) return;
    
    // Check for saved theme preference
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('eddytor-theme');
      if (savedTheme === 'dark') {
        isDarkMode.set(true);
      } else if (savedTheme === 'light') {
        isDarkMode.set(false);
      } else {
        // Use system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        isDarkMode.set(prefersDark);
      }
    }
    
    let localView: EditorView | null = null;
  let cleanupTabHandling: (() => void) | null = null;
    
  try {
    const state = createEditorState(initialContent);
    
    localView = new EditorView(editorContainer, {
      state,
      dispatchTransaction: (transaction) => {
        if (!localView) return;
        const newState = localView.state.apply(transaction);
        localView.updateState(newState);
      },
      attributes: {
        class: 'pm-root',
        spellcheck: 'true',
        autocorrect: 'on',
        autocomplete: 'on',
      },
      nodeViews: {
        paragraph: paragraphNodeViewFactory(localView, placeholderConfig)
      }
    });

    // Set up DOM-level tab handling as backup
    cleanupTabHandling = setupEditorTabHandling(localView);
    view = localView;
      
  } catch (error) {
    console.error('Error initializing editor:', error);
  }
  
  return () => {
    if (cleanupTabHandling) {
      cleanupTabHandling(); // Clean up tab handlers
    }
    if (localView) {
      localView.destroy();
      if (view === localView) {
        view = null;
      }
    }
  };
  });
      
  // Save theme preference
  $: if (typeof window !== 'undefined') {
    localStorage.setItem('eddytor-theme', $isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', $isDarkMode);
  }

  // Debug reactive statement
  $: console.log('SlashMenu state changed:', { showSlashMenu, slashQuery });

  if (import.meta?.hot) {
    import.meta.hot.accept(() => {
      if (view) {
        const newState = createEditorState(initialContent);
        view.updateState(newState);
      }
    });
  }
</script>

<div class="eddytor-app" class:dark={$isDarkMode}>
  {#if $isDarkMode}
    <button class="theme-toggle-btn" on:click={toggleDarkMode}>
      <span class="toggle-icon">☀️</span>
      Light Mode
    </button>
  {:else}
    <button class="theme-toggle-btn" on:click={toggleDarkMode}>
      <span class="toggle-icon">🌙</span>
      Dark Mode
    </button>
  {/if}
  
  <main class="editor-main">
    <div class="editor-container">
      <div class="editor-wrapper">
        {#if titleConfig.enabled && Title}
          <div class="title-section">
            <svelte:component 
              this={Title}
              bind:value={titleValue}
              placeholder={titleConfig.placeholder || 'Untitled Document'}
              editable={titleConfig.editable !== false}
              className={titleConfig.className || ''}
              attributes={titleConfig.attributes || {}}
              dark={$isDarkMode}
              on:change={handleTitleChange}
              on:submit={handleTitleSubmit}
            />
          </div>
        {/if}
        
        <div class="editor-section">
          <div bind:this={editorContainer} class="editor" />
          
          {#if showPlusButton && PlusButton}
            <PlusButton 
              x={plusButtonPos.x} 
              y={plusButtonPos.y} 
              dark={$isDarkMode}
              on:click={handlePlusClick} 
            />
          {/if}
          
          {#if showFloatingToolbar && view && FloatingToolbar}
            <FloatingToolbar 
              bind:this={floatingToolbar}
              {view}
              dark={$isDarkMode}
            />
          {/if}
          
          {#if showSlashMenu && view && SlashMenu}
            <SlashMenu 
              {view}
              query={slashQuery}
              dark={$isDarkMode}
              on:select={(e) => handleSlashCommand(e.detail)}
              on:close={() => showSlashMenu = false}
            />
          {/if}
          
          {#if view && TableToolbar}
            <TableToolbar
              {view}
              dark={$isDarkMode}
            />
          {/if}
        </div>
      </div>
    </div>
  </main>
</div>

<style lang="scss">
  
  /* Global accessibility styles for checklists */
  :global(.checklist-checkbox),
  :global(.checklist-item),
  :global(.checklist-content) {
    transition: all 0.2s ease;
  }
  
  @media (prefers-reduced-motion: reduce) {
    :global(.checklist-checkbox),
    :global(.checklist-item),
    :global(.checklist-content) {
      transition: none;
    }
    
    :global(.checklist-checkbox.checking::after),
    :global(.checklist-checkbox.unchecking::after) {
      animation: none;
    }
  }
  
  @media (prefers-contrast: high) {
    :global(.checklist-checkbox) {
      border-width: 3px;
    }
    
    :global(.checklist-checkbox.checked) {
      background: black;
      border-color: black;
    }
    
    :global(.dark) :global(.checklist-checkbox.checked) {
      background: white;
      border-color: white;
    }
    
    :global(.dark) :global(.checklist-checkbox.checked::after) {
      border-color: black;
    }
  }
</style>