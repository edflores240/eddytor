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
  
  // Font size options
  const fontSizes = [
    { label: 'Small', value: '12px' },
    { label: 'Normal', value: '16px' },
    { label: 'Large', value: '20px' },
    { label: 'Extra Large', value: '24px' },
    { label: 'Huge', value: '32px' }
  ];
  
  // Color palette
  const colorPalette = [
    '#000000', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6',
    '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6',
    '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#8B5CF6', '#F43F5E'
  ];
  
  function updateIcons() {
    iconVersion++;
    requestAnimationFrame(() => {
      import('lucide').then(({ createIcons, icons }) => {
        createIcons({
          icons,
          attrs: {
            class: 'w-4 h-4',
            'stroke-width': 2.5
          },
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
    } else {
      toggleModal();
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
      dispatch('command', { command, value: color });
    }
    closeModal();
  }
  
  function handleFontSizeSelect(size: string) {
    selectedFontSize = size;
    if (command) {
      dispatch('command', { command, value: size });
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
    {:else if type === 'dropdown'}
      <div class="dropdown-modal">
        <div class="dropdown-options">
          {#each fontSizes as size}
            <button
              class:selected={selectedFontSize === size.value}
              class="dropdown-option"
              on:click|stopPropagation={() => handleFontSizeSelect(size.value)}
            >
              <span class="option-label">{size.label}</span>
              <span class="option-value">{size.value}</span>
            </button>
          {/each}
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
      width: 20px;
      height: 20px;
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
    min-width: 180px;
    
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