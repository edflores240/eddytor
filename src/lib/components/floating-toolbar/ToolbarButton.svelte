<!-- src/lib/components/floating-toolbar/ToolbarButton.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { computePosition, flip, shift, offset, autoUpdate } from '@floating-ui/dom';
  
  export let icon: string;
  export let title: string;
  export let shortcut: string | undefined;
  export let active = false;
  export let dark = false;
  export let type: 'button' | 'color-picker' | 'dropdown' | 'button-link' = 'button';
  export let command: string;
  
  const dispatch = createEventDispatcher();
  let iconVersion = 0;
  let buttonElement: HTMLElement;
  let modalElement: HTMLElement;
  let isModalOpen = false;
  let cleanup: (() => void) | null = null;
  
  // Modal content states
  let selectedColor = '#000000';
  let selectedFontSize = '16px';
  let linkUrl = '';
  let linkText = '';
  
  // Update selected values when active state changes
  $: if (active && type === 'color-picker') {
    // Get the current text color from the selection if available
    const { state } = window.editorView || {};
    if (state) {
      const mark = state.schema.marks.textColor;
      if (mark) {
        const markInSelection = mark.isInSet(state.selection.$from.marks());
        if (markInSelection?.attrs?.color) {
          selectedColor = markInSelection.attrs.color;
        }
      }
    }
  }
  
  $: if (active && type === 'dropdown' && command === 'font-size') {
    // Get the current font size from the selection if available
    const { state } = window.editorView || {};
    if (state) {
      const mark = state.schema.marks.fontSize;
      if (mark) {
        const markInSelection = mark.isInSet(state.selection.$from.marks());
        if (markInSelection?.attrs?.size) {
          selectedFontSize = markInSelection.attrs.size;
        }
      }
    }
  }
  
  // Text formatting options
  const headingOptions = [
    { label: 'Paragraph', value: 'paragraph', icon: 'type' },
    { label: 'Heading 1', value: 'heading1', icon: 'heading-1' },
    { label: 'Heading 2', value: 'heading2', icon: 'heading-2' },
    { label: 'Heading 3', value: 'heading3', icon: 'heading-3' },
  ];

  const listOptions = [
    { label: 'Bullet List', value: 'bullet_list', icon: 'list' },
    { label: 'Numbered List', value: 'ordered_list', icon: 'list-ordered' },
    { label: 'Task List', value: 'task_list', icon: 'list-checks' },
  ];

  const fontSizes = [
    { label: 'Small', value: '14px' },
    { label: 'Normal', value: '16px' },
    { label: 'Large', value: '18px' },
    { label: 'Extra Large', value: '20px' },
    { label: 'Huge', value: '24px' },
    { label: 'Custom...', value: 'custom' }
  ];
  
  // Color palette
  const colorPalette = [
    '#000000', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6',
    '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6',
    '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#8B5CF6', '#F43F5E'
  ];

  let customFontSize = '16px';
  let showCustomSizeInput = false;
  
  // Computed property for numeric font size value
  $: numericFontSize = parseInt(customFontSize.replace('px', '')) || 16;
  
  function updateIcons() {
    iconVersion++;
    console.log(iconVersion);
    requestAnimationFrame(() => {
      import('lucide').then(({ createIcons, icons }) => {
        createIcons({
          icons,
          nameAttr: 'data-lucide'
        });
      });
    });
  }
  
  onMount(() => {
    updateIcons();
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
  });
  
  function handleClick() {
    if (type === 'button') {
      dispatch('command', { command, value: null });
    } else if (type === 'color-picker') {
      const { state } = window.editorView || {};
      if (state) {
        const mark = state.schema.marks.textColor;
        if (mark) {
          const markInSelection = mark.isInSet(state.selection.$from.marks());
          if (markInSelection?.attrs?.color) {
            selectedColor = markInSelection.attrs.color;
          }
        }
      }
      toggleModal();
    } else if (type === 'dropdown' && command === 'text-format') {
      // For text format dropdown, open the text formatting modal
      toggleModal();
    } else if (type === 'dropdown' && command === 'font-size') {
      const { state } = window.editorView || {};
      if (state) {
        const mark = state.schema.marks.fontSize;
        if (mark) {
          const markInSelection = mark.isInSet(state.selection.$from.marks());
          if (markInSelection?.attrs?.size) {
            selectedFontSize = markInSelection.attrs.size;
          }
        }
      }
      toggleModal();
    } else {
      toggleModal();
    }
    
  }

  function handleTextFormatSelect(format: string) {
    if (format === 'custom') {
      showCustomSizeInput = true;
      return;
    }
    
    // Handle heading and list commands
    if (['heading1', 'heading2', 'heading3', 'paragraph'].includes(format)) {
      dispatch('command', { command: format, value: null });
    } else {
      dispatch('command', { command: format, value: null });
    }
    closeModal();
  }

  function applyCustomFontSize() {
    if (customFontSize) {
      dispatch('command', { command: 'font-size', value: customFontSize });
      showCustomSizeInput = false;
      closeModal();
    }
  }
  
  function toggleModal() {
    if (isModalOpen) {
      closeModal();
    } else {
      openModal();
    }
  }
  
  async function openModal() {
    isModalOpen = true;
    
    // Wait for modal to render
    await new Promise(resolve => setTimeout(resolve, 10));
    
    if (!modalElement || !buttonElement) return;
    
    // Update icons after modal is rendered
    updateIcons();
    
    // Position modal using Floating UI
    if (cleanup) cleanup();
    
    cleanup = autoUpdate(buttonElement, modalElement, async () => {
      const { x, y } = await computePosition(buttonElement, modalElement, {
        placement: 'bottom-start',
        middleware: [
          offset(8),
          flip(),
          shift({ padding: 8 })
        ]
      });
      
      Object.assign(modalElement.style, {
        left: `${x}px`,
        top: `${y}px`
      });
    });
  }
  
  function closeModal() {
    isModalOpen = false;
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
  }
  
  function handleColorSelect(color: string) {
    selectedColor = color;
    if (command) {
      // For color picker, use the command name (baseline) with the selected color
      dispatch('command', { command: 'baseline', value: color });
    }
    closeModal();
  }
  
  function handleFontSizeSelect(size: string) {
    selectedFontSize = size;
    if (command) {
      // For font size, use the command name (font-size) with the selected size
      dispatch('command', { command: 'font-size', value: size });
    }
    closeModal();
  }
  
  function handleLinkSubmit() {
    if (linkUrl.trim() && command) {
      dispatch('command', { 
        command, 
        value: { 
          url: linkUrl.trim(), 
          text: linkText.trim() || linkUrl.trim() 
        } 
      });
      linkUrl = '';
      linkText = '';
      closeModal();
    }
  }
  
  function handleClickOutside(event: MouseEvent) {
    if (isModalOpen && modalElement && !modalElement.contains(event.target as Node) && !buttonElement.contains(event.target as Node)) {
      closeModal();
    }
  }
  
  function handleEscape(event: KeyboardEvent) {
    if (event.key === 'Escape' && isModalOpen) {
      closeModal();
    }
  }
  
  onDestroy(() => {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('keydown', handleEscape);
    if (cleanup) cleanup();
  });
</script>

<button
  class:active
  class:dark
  class:has-modal={type !== 'button'}
  class="toolbar-button"
  on:click={handleClick}
  on:keydown={(e) => e.key === 'Enter' && handleClick()}
  bind:this={buttonElement}
  aria-label={title}
  aria-expanded={type !== 'button' ? isModalOpen : undefined}
  aria-haspopup={type !== 'button' ? 'dialog' : undefined}
  type="button"
>
  <i data-lucide={icon} class="icon" style:opacity={active ? 1 : 0.8}></i>
  {#if type !== 'button'}
    <i data-lucide="chevron-down" class="chevron"></i>
  {/if}
</button>

{#if isModalOpen && type !== 'button'}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div 
    class="modal"
    class:dark
    bind:this={modalElement}
    on:click|stopPropagation
    role="dialog"
    aria-modal="true"
    aria-label="Toolbar menu"
    tabindex="-1"
  >
    {#if type === 'color-picker'}
      <div class="color-picker-modal">
        <div class="modal-header">
          <div class="modal-title">Select Color</div>
        </div>
        <div class="color-grid">
          {#each colorPalette as color}
            <button
              class="color-swatch {selectedColor === color ? 'selected' : ''}"
              style="background: {color}"
              on:click|stopPropagation={() => handleColorSelect(color)}
              aria-label="Color {color}"
            >
              {#if selectedColor === color}
                <div class="check-icon" data-lucide="check"></div>
              {/if}
            </button>
          {/each}
        </div>
        <div class="custom-color">
          <input
            type="color"
            class="color-input"
            bind:value={selectedColor}
            on:change|stopPropagation={(e) => handleColorSelect((e.target as HTMLInputElement).value)}
          />
          <span class="color-value">{selectedColor}</span>
        </div>
      </div>
    {:else if type === 'dropdown' && command === 'font-size'}
      <div class="dropdown-modal">
        <div class="dropdown-options">
          {#if showCustomSizeInput}
            <div class="custom-size-input">
              <input
                type="number"
                bind:value={numericFontSize}
                on:input={(e) => customFontSize = `${e.target.value}px`}
                min="8"
                max="72"
                class="size-input"
                placeholder="Enter font size (px)"
              />
              <button 
                class="apply-btn"
                on:click|stopPropagation={applyCustomFontSize}
              >
                Apply
              </button>
            </div>
          {:else}
            {#each fontSizes as size}
              <button
                class:selected={selectedFontSize === size.value}
                class="dropdown-option"
                on:click|stopPropagation={() => 
                  size.value === 'custom' 
                    ? showCustomSizeInput = true 
                    : handleFontSizeSelect(size.value)
                }
              >
                <span class="option-label">{size.label}</span>
                {#if size.value !== 'custom'}
                  <span class="option-value">{size.value}</span>
                {/if}
              </button>
            {/each}
          {/if}
        </div>
      </div>
    {:else if type === 'dropdown' && command === 'text-format'}
      <div class="text-format-modal">
        <div class="format-section">
          <div class="section-title">Text Style</div>
          <div class="format-options">
            {#each headingOptions as option}
              <button
                class="format-option {active && command === option.value ? 'active' : ''}"
                on:click|stopPropagation={() => handleTextFormatSelect(option.value)}
                aria-label={option.label}
                title={option.label}
              >
                <i data-lucide={option.icon} class="format-icon"></i>
              </button>
            {/each}
          </div>
        </div>

        <div class="divider"></div>

        <div class="format-section">
          <div class="section-title">Lists</div>
          <div class="format-options">
            {#each listOptions as option}
              <button
                class="format-option {active && command === option.value ? 'active' : ''}"
                on:click|stopPropagation={() => handleTextFormatSelect(option.value)}
                aria-label={option.label}
                title={option.label}
              >
                <i data-lucide={option.icon} class="format-icon"></i>
              </button>
            {/each}
          </div>
        </div>

        <div class="divider"></div>

        <div class="format-section">
          <div class="section-title">Font Size</div>
          <div class="font-size-dropdown">
            {#if showCustomSizeInput}
              <div class="custom-size-input">
                <input
                  type="number"
                  bind:value={numericFontSize}
                  on:input={(e) => customFontSize = `${e.target.value}px`}
                  min="8"
                  max="72"
                  class="size-input"
                  placeholder="Size"
                />
                <button 
                  class="apply-btn"
                  on:click|stopPropagation={applyCustomFontSize}
                >
                  <i data-lucide="check" class="apply-icon"></i>
                </button>
              </div>
            {:else}
              {#each fontSizes as size}
                <button
                  class:selected={selectedFontSize === size.value}
                  class="font-size-option"
                  on:click|stopPropagation={() => 
                    size.value === 'custom' 
                      ? showCustomSizeInput = true 
                      : handleFontSizeSelect(size.value)
                  }
                >
                  <span class="size-label">{size.label}</span>
                  {#if size.value !== 'custom'}
                    <span class="size-value">{size.value}</span>
                  {/if}
                </button>
              {/each}
            {/if}
          </div>
        </div>
      </div>
    {:else if type === 'button-link'}
      <div class="link-modal">
        <div class="link-form">
          <div class="input-group">
            <label for="link-url">Link URL</label>
            <input
              id="link-url"
              type="url"
              bind:value={linkUrl}
              placeholder="https://example.com"
              class="link-input"
              on:keydown|stopPropagation
              on:keyup|stopPropagation
              on:keypress|stopPropagation
              on:keyup|preventDefault={(e) => e.key === 'Enter' && handleLinkSubmit()}
            />
          </div>
          <div class="input-group">
            <label for="link-text">Text (optional)</label>
            <input
              id="link-text"
              type="text"
              bind:value={linkText}
              placeholder="Link text"
              class="link-input"
              on:keydown|stopPropagation
              on:keyup|stopPropagation
              on:keypress|stopPropagation
              on:keyup|preventDefault={(e) => e.key === 'Enter' && handleLinkSubmit()}
            />
          </div>
          <div class="link-actions">
            <button type="button" class="cancel-btn" on:click|stopPropagation={closeModal}>Cancel</button>
            <button 
              type="button"
              class="submit-btn" 
              class:disabled={!linkUrl.trim()}
              on:click|stopPropagation={handleLinkSubmit}
              disabled={!linkUrl.trim()}
            >
              Add Link
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style lang="scss">
  .toolbar-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-1;
    height: 32px;
    font-size: 1.5rem;
    padding: 0 $spacing-3;
    border-radius: $radius-md;
    background: transparent;
    border: none;
    color: map.get($light, 'text-secondary');
    font-family: $font-family-primary;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    line-height: $line-height-tight;
    cursor: pointer;
    transition: all $transition-base;
    white-space: nowrap;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    
    &:hover {
      background: map.get($light, 'bg-hover');
      color: map.get($light, 'text-primary');
    }
    
    &:active {
      transform: scale(0.98);
    }
    
    &.active {
      background: map.get($light, 'bg-active');
      color: map.get($light, 'accent-primary');
      font-weight: $font-weight-semibold;
    }
    
    &.has-modal {
      padding-right: $spacing-2;
    }
    
    .icon {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      :global(svg) {
        width: 100%;
        height: 100%;
        stroke: currentColor;
      }
    }
    
    .chevron {
      width: 12px;
      height: 12px;
      opacity: 0.6;
      
      :global(svg) {
        width: 100%;
        height: 100%;
        stroke: currentColor;
      }
    }
    
    // Dark theme
    &.dark {
      color: map.get($dark, 'text-secondary');
      
      &:hover {
        background: map.get($dark, 'bg-hover');
        color: map.get($dark, 'text-primary');
      }
      
      &.active {
        background: map.get($dark, 'bg-active');
        color: map.get($dark, 'accent-primary');
      }
    }
  }

  .font-size-dropdown {
  display: flex;
  flex-direction: column;
  gap: $spacing-1;
  margin-top: $spacing-2;
  
  .font-size-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: $spacing-2 $spacing-3;
    border: none;
    background: transparent;
    border-radius: $radius-md;
    cursor: pointer;
    transition: all $transition-base;
    color: map.get($light, 'text-primary');
    text-align: left;
    
    &:hover {
      background: map.get($light, 'bg-hover');
    }
    
    &.selected {
      background: map.get($light, 'bg-active');
      color: map.get($light, 'accent-primary');
      font-weight: $font-weight-semibold;
    }
    
    .size-label {
      font-size: $font-size-sm;
      color: map.get($light, 'text-primary');
    }
    
    
    .size-value {
      font-size: $font-size-xs;
      color: map.get($light, 'text-secondary');
      font-family: monospace;
    }
  }

  
  
  .custom-size-input {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    
    .size-input {
      flex: 1;
      padding: $spacing-2 $spacing-3;
      border: 1px solid map.get($light, 'border-light');
      border-radius: $radius-md;
      background: map.get($light, 'bg-primary');
      color: map.get($light, 'text-primary');
      font-size: $font-size-sm;
      
      &:focus {
        outline: none;
        border-color: map.get($light, 'accent-primary');
      }
    }
    
    .apply-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: map.get($light, 'accent-primary');
      color: white;
      border: none;
      border-radius: $radius-md;
      cursor: pointer;
      transition: background $transition-base;
      
      &:hover {
        background: map.get($light, 'accent-hover');
      }
      
      .apply-icon {
        width: 14px;
        height: 14px;
        
        :global(svg) {
          width: 100%;
          height: 100%;
          stroke: currentColor;
        }
      }
    }
  }
}

  .modal {
    position: fixed;
    background: map.get($light, 'bg-secondary');
    border-radius: $radius-lg;
    box-shadow: map.get($light, 'modal-shadow');
    border: 1px solid map.get($light, 'border-light');
    z-index: $z-modal;
    min-width: 200px;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    
    &.dark {
      background: map.get($dark, 'bg-secondary');
      border-color: map.get($dark, 'border-strong');
      box-shadow: map.get($dark, 'modal-shadow');

      .size-label {
        color: map.get($dark, 'text-primary');
      }

      .size-value {
        color: map.get($dark, 'text-secondary');
      }
    }
  }

  .modal-header {
    padding: $spacing-3 $spacing-4 $spacing-2;
    border-bottom: 1px solid map.get($light, 'border-light');
    
    .modal-title {
      font-weight: $font-weight-semibold;
      color: map.get($light, 'text-primary');
      font-size: $font-size-sm;
    }
    
    .dark & {
      border-color: map.get($dark, 'border-light');
      
      .modal-title {
        color: map.get($dark, 'text-primary');
      }
    }
  }

  // Color Picker Modal
  .color-picker-modal {
    padding: 0;
    
    .color-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: $spacing-2;
      padding: $spacing-3;
    }
    
    .color-swatch {
      width: 32px;
      height: 32px;
      border-radius: $radius-md;
      border: 2px solid transparent;
      cursor: pointer;
      transition: all $transition-base;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        transform: scale(1.1);
        border-color: map.get($light, 'border-strong');
      }
      
      &.selected {
        border-color: map.get($light, 'accent-primary');
        transform: scale(1.1);
      }
      
      .check-icon {
        width: 12px;
        height: 12px;
        color: white;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
        
        :global(svg) {
          width: 100%;
          height: 100%;
          stroke: currentColor;
          stroke-width: 3;
        }
      }
    }
    
    .custom-color {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      padding: $spacing-3;
      border-top: 1px solid map.get($light, 'border-light');
      
      .color-input {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: $radius-md;
        cursor: pointer;
      }
      
      .color-value {
        font-family: monospace;
        font-size: $font-size-xs;
        color: map.get($light, 'text-secondary');
      }
      
      .dark & {
        border-color: map.get($dark, 'border-light');
        
        .color-value {
          color: map.get($dark, 'text-secondary');
        }
      }
    }
  }

  // Dropdown Modal
  .dropdown-modal {
    padding: 0;
    min-width: 200px;
    
    .dropdown-options {
      padding: $spacing-2;
    }
    
    .dropdown-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: $spacing-2 $spacing-3;
      border: none;
      background: transparent;
      border-radius: $radius-md;
      cursor: pointer;
      transition: all $transition-base;
      color: map.get($light, 'text-primary');
      text-align: left;
      
      &:hover {
        background: map.get($light, 'bg-hover');
      }
      
      &.selected {
        background: map.get($light, 'bg-active');
        color: map.get($light, 'accent-primary');
        font-weight: $font-weight-semibold;
      }
      
      .option-label {
        font-size: $font-size-sm;
      }
      
      .option-value {
        font-size: $font-size-xs;
        color: map.get($light, 'text-secondary');
        font-family: monospace;
      }
      
      .dark & {
        color: map.get($dark, 'text-primary');
        
        &:hover {
          background: map.get($dark, 'bg-hover');
        }
        
        &.selected {
          background: map.get($dark, 'bg-active');
          color: map.get($dark, 'accent-primary');
        }
        
        .option-value {
          color: map.get($dark, 'text-secondary');
        }
      }
    }
  }

  // Custom size input
  .custom-size-input {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    padding: $spacing-3;
    
    .size-input {
      flex: 1;
      padding: $spacing-2 $spacing-3;
      border: 1px solid map.get($light, 'border-light');
      border-radius: $radius-md;
      background: map.get($light, 'bg-primary');
      color: map.get($light, 'text-primary');
      font-size: $font-size-sm;
      
      &:focus {
        outline: none;
        border-color: map.get($light, 'accent-primary');
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
      }
      
      &::placeholder {
        color: map.get($light, 'text-tertiary');
      }
    }
    
    .apply-btn {
      padding: $spacing-2 $spacing-3;
      background: map.get($light, 'accent-primary');
      color: white;
      border: none;
      border-radius: $radius-md;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
      cursor: pointer;
      transition: background $transition-base;
      
      &:hover {
        background: map.get($light, 'accent-hover');
      }
    }
    
    .dark & {
      .size-input {
        background: map.get($dark, 'bg-primary');
        border-color: map.get($dark, 'border-light');
        color: map.get($dark, 'text-primary');
        
        &::placeholder {
          color: map.get($dark, 'text-tertiary');
        }
      }
      
      .apply-btn {
        background: map.get($dark, 'accent-primary');
        
        &:hover {
          background: map.get($dark, 'accent-hover');
        }
      }
    }
  }

  // Text Format Modal
  .text-format-modal {
    padding: $spacing-3 0;
    
    .format-section {
      padding: 0 $spacing-4 $spacing-3;
      margin-bottom: $spacing-3;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .section-title {
        font-size: $font-size-xs;
        font-weight: $font-weight-medium;
        color: map.get($light, 'text-secondary');
        margin-bottom: $spacing-2;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .format-options {
        display: flex;
        gap: $spacing-1;
        flex-wrap: wrap;
      }
      
      .format-option {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        padding: 0;
        border-radius: $radius-md;
        background: transparent;
        border: 1px solid map.get($light, 'border-light');
        color: map.get($light, 'text-primary');
        cursor: pointer;
        transition: all $transition-base;
        
        &:hover {
          background: map.get($light, 'bg-hover');
          border-color: map.get($light, 'border-medium');
        }
        
        &.active {
          background: map.get($light, 'bg-active');
          border-color: map.get($light, 'accent-primary');
          color: map.get($light, 'accent-primary');
        }
        
        .format-icon {
          width: 16px;
          height: 16px;
          
          :global(svg) {
            width: 100%;
            height: 100%;
            stroke: currentColor;
          }
        }
      }
      
      .font-size-controls {
        display: flex;
        align-items: center;
        gap: $spacing-3;
        margin-top: $spacing-2;
        
        .size-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: $radius-md;
          border: 1px solid map.get($light, 'border-light');
          background: transparent;
          color: map.get($light, 'text-primary');
          cursor: pointer;
          transition: all $transition-base;
          
          &:hover {
            background: map.get($light, 'bg-hover');
            border-color: map.get($light, 'border-medium');
          }
          
          .size-icon {
            width: 14px;
            height: 14px;
            
            :global(svg) {
              width: 100%;
              height: 100%;
              stroke: currentColor;
            }
          }
        }
        
        .font-size-display {
          flex: 1;
          text-align: center;
          font-weight: $font-weight-medium;
          color: map.get($light, 'text-primary');
          font-size: $font-size-sm;
          padding: $spacing-2;
          background: map.get($light, 'bg-hover');
          border-radius: $radius-md;
          border: 1px solid map.get($light, 'border-light');
        }
      }
    }
    
    .divider {
      height: 1px;
      background: map.get($light, 'border-light');
      margin: $spacing-3 0;
    }
    
    // Dark theme
    .dark & {
      .section-title {
        color: map.get($dark, 'text-secondary');
      }
      
      .format-option {
        border-color: map.get($dark, 'border-light');
        color: map.get($dark, 'text-primary');
        
        &:hover {
          background: map.get($dark, 'bg-hover');
          border-color: map.get($dark, 'border-medium');
        }
        
        &.active {
          background: map.get($dark, 'bg-active');
          border-color: map.get($dark, 'accent-primary');
          color: map.get($dark, 'accent-primary');
        }
      }
      
      .font-size-controls {
        .size-btn {
          border-color: map.get($dark, 'border-light');
          color: map.get($dark, 'text-primary');
          
          &:hover {
            background: map.get($dark, 'bg-hover');
            border-color: map.get($dark, 'border-medium');
          }
        }
        
        .font-size-display {
          background: map.get($dark, 'bg-hover');
          border-color: map.get($dark, 'border-light');
          color: map.get($dark, 'text-primary');
        }
      }
      
      .divider {
        background: map.get($dark, 'border-light');
      }
    }
  }

  // Link Modal
  .link-modal {
    padding: 0;
    min-width: 300px;
    
    .link-form {
      padding: $spacing-4;
    }
    
    .input-group {
      margin-bottom: $spacing-3;
      
      label {
        display: block;
        margin-bottom: $spacing-1;
        font-size: $font-size-xs;
        font-weight: $font-weight-medium;
        color: map.get($light, 'text-secondary');
      }
      
      .link-input {
        width: 100%;
        padding: $spacing-2 $spacing-3;
        border: 1px solid map.get($light, 'border-light');
        border-radius: $radius-md;
        background: map.get($light, 'bg-primary');
        color: map.get($light, 'text-primary');
        font-size: $font-size-sm;
        transition: all $transition-base;
        
        &:focus {
          outline: none;
          border-color: map.get($light, 'accent-primary');
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        &::placeholder {
          color: map.get($light, 'text-tertiary');
        }
      }
      
      .dark & {
        label {
          color: map.get($dark, 'text-secondary');
        }
        
        .link-input {
          border-color: map.get($dark, 'border-light');
          background: map.get($dark, 'bg-primary');
          color: map.get($dark, 'text-primary');
          
          &:focus {
            border-color: map.get($dark, 'accent-primary');
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          
          &::placeholder {
            color: map.get($dark, 'text-tertiary');
          }
        }
      }
    }
    
    .link-actions {
      display: flex;
      gap: $spacing-2;
      justify-content: flex-end;
      margin-top: $spacing-4;
      
      button {
        padding: $spacing-2 $spacing-4;
        border-radius: $radius-md;
        font-size: $font-size-sm;
        font-weight: $font-weight-medium;
        cursor: pointer;
        transition: all $transition-base;
        border: 1px solid transparent;
        
        &.cancel-btn {
          background: transparent;
          color: map.get($light, 'text-secondary');
          border-color: map.get($light, 'border-light');
          
          &:hover {
            background: map.get($light, 'bg-hover');
            color: map.get($light, 'text-primary');
          }
        }
        
        &.submit-btn {
          background: map.get($light, 'accent-primary');
          color: white;
          
          &:hover:not(.disabled) {
            background: map.get($light, 'accent-hover');
          }
          
          &.disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }
        
        .dark & {
          &.cancel-btn {
            color: map.get($dark, 'text-secondary');
            border-color: map.get($dark, 'border-light');
            
            &:hover {
              background: map.get($dark, 'bg-hover');
              color: map.get($dark, 'text-primary');
            }
          }
          
          &.submit-btn {
            background: map.get($dark, 'accent-primary');
            
            &:hover:not(.disabled) {
              background: map.get($dark, 'accent-hover');
            }
          }
        }
      }
    }
  }
</style>