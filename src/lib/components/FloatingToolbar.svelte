<!-- FloatingToolbar.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { toggleMark } from 'prosemirror-commands';
  import { EditorView } from 'prosemirror-view';
  import { 
    createIcons, 
    Bold, 
    Italic, 
    Code, 
    Underline, 
    Strikethrough, 
    Link, 
    Highlighter, 
    MessageCircle,
    Triangle,
    Paintbrush,
    AlignLeft,
    AlignCenter,
    AlignRight,
    List,
    ListOrdered,
    Image
  } from 'lucide';

  export let view: EditorView;
  export let x: number;
  export let y: number;
  export let dark: boolean = false;

  const dispatch = createEventDispatcher();

  let fontSize = 28;

  onMount(() => {
    // Initialize Lucide icons
    createIcons({
      icons: {
        Bold,
        Italic,
        Code,
        Underline,
        Strikethrough,
        Link,
        Highlighter,
        MessageCircle,
        Triangle,
        Paintbrush,
        AlignLeft,
        AlignCenter,
        AlignRight,
        List,
        ListOrdered,
        Image
      },
      attrs: {
        class: 'w-full h-full',
        'stroke-width': 2
      },
      nameAttr: 'data-lucide'
    });
  });

  const tools = [
    { command: 'triangle', icon: 'triangle', title: 'Shape Tool' },
    { command: 'brush', icon: 'paintbrush', title: 'Brush Tool' },
    { type: 'separator' },
    { command: 'strong', icon: 'bold', title: 'Bold', shortcut: '⌘B' },
    { command: 'em', icon: 'italic', title: 'Italic', shortcut: '⌘I' },
    { command: 'underline', icon: 'underline', title: 'Underline', shortcut: '⌘U' },
    { command: 'strikethrough', icon: 'strikethrough', title: 'Strikethrough', shortcut: '⌘⇧X' },
    { type: 'separator' },
    { type: 'font-size' },
    { type: 'separator' },
    { command: 'align-left', icon: 'align-left', title: 'Align Left' },
    { command: 'align-center', icon: 'align-center', title: 'Align Center' },
    { command: 'align-right', icon: 'align-right', title: 'Align Right' },
    { type: 'separator' },
    { type: 'headings' },
    { type: 'separator' },
    { command: 'bulletList', icon: 'list', title: 'Bullet List' },
    { command: 'orderedList', icon: 'list-ordered', title: 'Numbered List' },
    { type: 'separator' },
    { command: 'link', icon: 'link', title: 'Add Link', shortcut: '⌘K' },
    { command: 'image', icon: 'image', title: 'Insert Image' },
  ];

  function execCommand(command: string) {
    if (!view) return;
    
    const { state, dispatch } = view;
    
    // Handle different commands
    switch (command) {
      case 'link':
        const linkType = state.schema.marks.link;
        if (linkType) {
          const href = prompt('Enter URL:');
          if (href) {
            const { from, to } = state.selection;
            const tr = state.tr.addMark(from, to, linkType.create({ href }));
            dispatch(tr);
          }
        }
        break;
        
      case 'image':
        const src = prompt('Enter image URL:');
        if (src) {
          // Handle image insertion
          console.log('Insert image:', src);
        }
        break;
        
      case 'triangle':
      case 'brush':
      case 'align-left':
      case 'align-center':
      case 'align-right':
      case 'bulletList':
      case 'orderedList':
        // Placeholder for these commands
        console.log('Execute command:', command);
        break;
        
      default: {
        const markType = state.schema.marks[command];
        if (markType) {
          toggleMark(markType)(state, dispatch);
        }
      }
    }
    
    view.focus();
  }

  function isActive(command: string): boolean {
    if (!view) return false;
    
    const { state } = view;
    const markType = state.schema.marks[command];
    if (!markType) return false;
    
    const { from, to, empty } = state.selection;
    if (empty) {
      return !!state.selection.$from.marks().some(mark => mark.type === markType);
    }
    
    return state.doc.rangeHasMark(from, to, markType);
  }

  function handleFontSizeChange(event) {
    fontSize = parseInt(event.target.value);
  }
</script>

<div 
  class="floating-toolbar" 
  class:dark
  style="transform: translate({x}px, {y}px)"
>
  {#each tools as tool}
    {#if tool.type === 'separator'}
      <div class="separator"></div>
    {:else if tool.type === 'font-size'}
      <div class="font-size-container">
        <select 
          bind:value={fontSize} 
          on:change={handleFontSizeChange}
          class="font-size-select"
        >
          <option value="12">12</option>
          <option value="14">14</option>
          <option value="16">16</option>
          <option value="18">18</option>
          <option value="20">20</option>
          <option value="24">24</option>
          <option value="28">28</option>
          <option value="32">32</option>
          <option value="36">36</option>
          <option value="48">48</option>
        </select>
        <span class="font-size-arrow">
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </div>
    {:else if tool.type === 'headings'}
      <div class="headings-container">
        <button class="heading-btn" on:mousedown|preventDefault={() => execCommand('heading1')}>H₁</button>
        <button class="heading-btn" on:mousedown|preventDefault={() => execCommand('heading2')}>H₂</button>
        <button class="heading-btn" on:mousedown|preventDefault={() => execCommand('heading3')}>H₃</button>
      </div>
    {:else}
      <button
        class="tool-button"
        aria-label={tool.title}
        class:active={isActive(tool.command)}
        on:mousedown|preventDefault={() => execCommand(tool.command)}
        title={tool.shortcut ? `${tool.title} (${tool.shortcut})` : tool.title}
      >
        <span class="icon">
          <i data-lucide={tool.icon} class="w-4 h-4"></i>
        </span>
      </button>
    {/if}
  {/each}
</div>

<style lang="scss">
  .floating-toolbar {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 16px;
    padding: 8px 12px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05);
    z-index: 1000;
    animation: slideInUp 0.2s ease-out;
    transform-origin: bottom center;
    gap: 2px;
    backdrop-filter: blur(20px);

    &.dark {
      background: #0f172a;
      border-color: #1e293b;
    }
  }

  .separator {
    width: 1px;
    height: 24px;
    background: #475569;
    margin: 0 6px;
    opacity: 0.6;

    .dark & {
      background: #334155;
    }
  }

  .tool-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: #cbd5e1;
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;

    &:hover {
      background: rgba(148, 163, 184, 0.1);
      color: #f1f5f9;
      transform: scale(1.02);
    }

    &:active {
      transform: scale(0.98);
    }

    &.active {
      background: rgba(99, 102, 241, 0.2);
      color: #a5b4fc;
    }

    .icon {
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;

      :global(svg) {
        flex-shrink: 0;
      }
    }
  }

  .font-size-container {
    position: relative;
    display: flex;
    align-items: center;
    
    .font-size-select {
      appearance: none;
      background: transparent;
      border: none;
      color: #cbd5e1;
      font-size: 14px;
      font-weight: 500;
      padding: 6px 24px 6px 8px;
      border-radius: 6px;
      cursor: pointer;
      min-width: 50px;
      
      &:hover {
        background: rgba(148, 163, 184, 0.1);
        color: #f1f5f9;
      }
      
      &:focus {
        outline: none;
        background: rgba(148, 163, 184, 0.1);
      }
    }
    
    .font-size-arrow {
      position: absolute;
      right: 6px;
      top: 50%;
      transform: translateY(-50%);
      color: #64748b;
      pointer-events: none;
    }
  }

  .headings-container {
    display: flex;
    align-items: center;
    gap: 2px;
    
    .heading-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      background: transparent;
      border: none;
      border-radius: 6px;
      color: #a855f7;
      cursor: pointer;
      transition: all 0.15s ease;
      font-size: 12px;
      font-weight: 600;
      
      &:hover {
        background: rgba(168, 85, 247, 0.1);
        color: #c084fc;
      }
      
      &:active {
        transform: scale(0.95);
      }
    }
  }

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(12px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
</style>