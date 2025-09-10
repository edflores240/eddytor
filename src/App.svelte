<!-- App.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { EditorState, Plugin } from 'prosemirror-state';
  import { EditorView, Decoration, DecorationSet } from 'prosemirror-view';
  import { schema } from 'prosemirror-schema-basic';
  import { paragraphNodeViewFactory } from './lib/utils/ParagraphNodeView';
  import { history, redo, undo } from 'prosemirror-history';
  import { keymap } from 'prosemirror-keymap';
  import { baseKeymap } from 'prosemirror-commands';
  import { DOMParser, Node } from 'prosemirror-model';
  import { writable } from 'svelte/store';

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




  onMount(async () => {
    FloatingToolbar = (await import('./lib/components/FloatingToolbar.svelte')).default;
    SlashMenu = (await import('./lib/components/SlashMenu.svelte')).default;
    PlusButton = (await import('./lib/components/PlusButton.svelte')).default;
    Title = (await import('./lib/components/Title.svelte')).default;
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
  const selectionPlugin = new Plugin({
    view(editorView) {
      return {
        update: (view, prevState) => {
          const { state } = view;
          const { selection } = state;
          
          if (!selection.empty && selection.from !== selection.to) {
            showFloatingToolbar = true;
          } else {
            showFloatingToolbar = false;
          }
        }
      };
    }
  });

  const parseContent = (content: string) => {
    const contentElement = document.createElement('div');
    contentElement.innerHTML = content || '<p></p>';
    return DOMParser.fromSchema(schema).parse(contentElement);
  };

  const createEditorState = (initialContent: string) => {
    return EditorState.create({
      doc: initialContent ? parseContent(initialContent) : undefined,
      plugins: [
        history(),
        keymap({
          ...baseKeymap,
          'Mod-z': undo,
          'Mod-y': redo,
          'Mod-Shift-z': redo,
        }),
        plusButtonPlugin,
        slashCommandPlugin,
        selectionPlugin,
      ]
    });
  };

  function handleSlashCommand(command: string) {
    if (!view) return;
    
    const { state, dispatch } = view;
    const { selection } = state;
    const { $from } = selection;
    
    // Remove the slash and query text
    const textBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, '\ufffc');
    const match = /\/\w*$/.exec(textBefore);
    
    if (match) {
      const from = selection.from - match[0].length;
      const to = selection.from;
      
      let tr = state.tr.delete(from, to);
      
      if (command === 'heading1') {
        tr = tr.setBlockType(from, from, state.schema.nodes.heading, { level: 1 });
      } else if (command === 'heading2') {
        tr = tr.setBlockType(from, from, state.schema.nodes.heading, { level: 2 });
      } else if (command === 'heading3') {
        tr = tr.setBlockType(from, from, state.schema.nodes.heading, { level: 3 });
      }
      
      dispatch(tr);
    }
    
    showSlashMenu = false;
    view.focus();
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
    
    // Create a local view variable to avoid stale closures
    let localView: EditorView | null = null;
      
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

      view = localView;
    } catch (error) {
      console.error('Error initializing editor:', error);
    }

    return () => {
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
        </div>
      </div>
    </div>
  </main>
</div>

<!-- Keep the existing styles exactly the same -->
<style lang="scss">
  :global(html) {
    height: 100%;
    font-family: $font-family-primary;
  }

  :global(body) {
    margin: 0;
    height: 100%;
    background: map.get($light, 'bg-primary');
    color: map.get($light, 'text-primary');
    transition: all $transition-slower;
    font-family: $font-family-primary;
    line-height: $line-height-normal;
  }

  :global(body.dark) {
    background: map.get($dark, 'bg-primary');
    color: map.get($dark, 'text-primary');
  }

  :global(*) {
    box-sizing: border-box;
  }




 
  .eddytor-app {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: map.get($light, 'bg-primary');
    transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);





&.dark {
    background: map.get($dark, 'bg-primary');
}


   

    .theme-toggle-btn {
      position: fixed;
      top: $spacing-6;
      right: $spacing-6;
      z-index: $z-tooltip;
      display: flex;
      align-items: center;
      gap: $spacing-2;
      padding: $spacing-3 $spacing-5;
      background: rgba(map.get($light, 'bg-primary'), 0.9);
      color: map.get($light, 'text-primary');
      border: 1px solid map.get($light, 'border-medium');
      border-radius: $radius-xl;
      cursor: pointer;
      font-weight: $font-weight-medium;
      font-size: $font-size-sm;
      font-family: $font-family-primary;
      backdrop-filter: blur(8px);
      box-shadow: $shadow-md;
      transition: all $transition-base;
      
      &:hover {
        background: map.get($light, 'bg-primary');
        transform: translateY(-1px);
        box-shadow: $shadow-lg;
      }

      .toggle-icon {
        font-size: 1rem;
      }
    }

    &.dark .theme-toggle-btn {
      background: rgba(map.get($dark, 'bg-tertiary'), 0.9);
      color: map.get($dark, 'text-primary');
      border-color: map.get($dark, 'border-strong');

      &:hover {
        background: map.get($dark, 'bg-tertiary');
      }
    }
  }

  .editor-main {
    flex: 1;
    display: flex;
    justify-content: center;
    overflow: auto;
    min-height: 100vh;
    padding: 0;
    margin: 0;
  }

  .editor-container {
    width: 100%;
    min-height: 100%;
    
    margin: 0;
    padding: 0;
  }

  .editor-wrapper {
    position: relative;
   
  
    height: 100%;
    min-height: 100vh;
    transition: all $transition-slower;
    overflow: hidden;

  

    @media (min-width: 768px) {
      margin: 2rem 1rem;
      min-height: calc(100vh - 4rem);
    }

    @media (max-width: 767px) {
      border-radius: 0;
      box-shadow: none;
      .dark & {
        box-shadow: none;
      }
    }
  }

  .title-section {
    padding: $spacing-12 $spacing-16 0;
  
    transition: border-color $transition-base;

    .dark & {
      border-bottom-color: map.get($dark, 'border-medium');
    }

    @media (max-width: 768px) {
      padding: 2rem 2rem 0;
    }
  }

  .editor-section {
    position: relative;
    padding-left: 60px; // Space for plus button
  }

  .editor {
    height: 100%;
    min-height: 60vh;
    outline: none;
    line-height: $line-height-relaxed;
    color: map.get($light, 'text-primary');
    font-size: $font-size-lg;
    font-family: $font-family-primary;
    transition: color $transition-base;
    padding: $spacing-12 $spacing-16;
    box-sizing: border-box;
    padding-left: 0; // Remove left padding since wrapper has it

    .dark & {
      color: map.get($dark, 'text-primary');
    }

    @media (max-width: 768px) {
      padding: 2rem 2rem;
      padding-left: 0;
      font-size: 1rem;
    }
    
    :global(.ProseMirror) {
      min-height: calc(60vh - 6rem);
      outline: none;
    }

    // Enhanced typography styles
    :global(p) {
      margin: $spacing-4 0;
      min-height: 1.75rem;
      transition: all $transition-fast;
      position: relative;
      
      &:first-child {
        margin-top: 0;
      }
      
      &:last-child {
        margin-bottom: 0;
      }
      
      &:empty::before {
        content: '';
        display: inline-block;
        width: 0;
        height: 1.75rem;
      }

      &:hover {
        border-radius: $radius-lg;
        margin-left: -$spacing-4;
        margin-right: -$spacing-4;
        padding-left: $spacing-4;
        padding-right: $spacing-4;
      }
    }

    :global(h1) {
      font-size: $font-size-4xl;
      font-weight: $font-weight-bold;
      line-height: $line-height-tight;
      margin: $spacing-8 0 $spacing-6 0;
      color: map.get($light, 'text-primary');
      font-family: $font-family-heading;
      position: relative;
      
      .dark & {
        color: map.get($dark, 'text-primary');
      }
      
      &:first-child {
        margin-top: 0;
      }

      &:hover {
        border-radius: $radius-lg;
        margin-left: -$spacing-4;
        margin-right: -$spacing-4;
        padding-left: $spacing-4;
        padding-right: $spacing-4;
      }
    }

    :global(h2) {
      font-size: $font-size-3xl;
      font-weight: $font-weight-semibold;
      line-height: 1.3;
      margin: $spacing-6 0 $spacing-4 0;
      color: map.get($light, 'text-primary');
      font-family: $font-family-heading;
      position: relative;

      &:hover {
        border-radius: $radius-lg;
        margin-left: -$spacing-4;
        margin-right: -$spacing-4;
        padding-left: $spacing-4;
        padding-right: $spacing-4;
      }
    }

    :global(h3) {
      font-size: $font-size-2xl;
      font-weight: $font-weight-semibold;
      line-height: 1.4;
      margin: $spacing-5 0 $spacing-3 0;
      color: map.get($light, 'text-secondary');
      font-family: $font-family-heading;
      position: relative;

      &:hover {
        border-radius: $radius-lg;
        margin-left: -$spacing-4;
        margin-right: -$spacing-4;
        padding-left: $spacing-4;
        padding-right: $spacing-4;
      }
    }

    :global(strong) {
      font-weight: $font-weight-semibold;
      color: map.get($light, 'text-primary');

      .dark & {
        color: map.get($dark, 'text-primary');
      }
    }

    :global(em) {
      font-style: italic;
      color: map.get($light, 'text-muted');

      .dark & {
        color: map.get($dark, 'text-muted');
      }
    }

    :global(code) {
      font-family: $font-family-mono;
      font-size: 0.875em;
      background: map.get($light, 'bg-tertiary');
      padding: $spacing-1 $spacing-2;
      border-radius: $radius-md;
      color: map.get($light, 'error');
      border: 1px solid map.get($light, 'border-medium');

      .dark & {
        background: map.get($dark, 'bg-secondary');
        color: map.get($dark, 'error');
        border-color: map.get($dark, 'border-strong');
      }
    }

    :global(blockquote) {
      margin: $spacing-6 0;
      padding: 0 $spacing-6;
      border-left: 4px solid map.get($light, 'accent-primary');
      color: map.get($light, 'text-muted');
      font-style: italic;
      position: relative;
      background: rgba(map.get($light, 'accent-primary'), 0.05);
      border-radius: 0 $radius-lg $radius-lg 0;
      padding: $spacing-4 $spacing-6;

      .dark & {
        border-left-color: map.get($dark, 'accent-primary');
        color: map.get($dark, 'text-muted');
        background: rgba(map.get($dark, 'accent-primary'), 0.1);
      }
    }

    :global(ul), :global(ol) {
      padding-left: $spacing-6;
      margin: $spacing-4 0;
      position: relative;
    }

    :global(li) {
      margin: $spacing-2 0;
    }

    // Enhanced selection styling
    :global(::selection) {
      background: rgba(map.get($light, 'accent-primary'), 0.2);
    }

    .dark & :global(::selection) {
      background: rgba(map.get($dark, 'accent-primary'), 0.3);
    }
  }
</style>