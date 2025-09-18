<!-- LinkModal.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { computePosition, flip, shift, offset, arrow } from '@floating-ui/dom';
  import { EditorView } from 'prosemirror-view';
  
  export let view: EditorView;
  export let dark: boolean = false;
  export let initialText: string = '';
  export let initialUrl: string = '';
  export let onSave: (text: string, url: string) => void;
  export let onCancel: () => void;
  
  const dispatch = createEventDispatcher();
  
  let modalElement: HTMLDivElement;
  let arrowElement: HTMLDivElement;
  let urlInput: HTMLInputElement;
  let textInput: HTMLInputElement;
  
  let linkText = initialText;
  let linkUrl = initialUrl || 'https://';
  let isValidUrl = true;
  
  function validateUrl(url: string): boolean {
    if (!url || url === 'https://') return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  function handleSave() {
    if (!validateUrl(linkUrl)) {
      isValidUrl = false;
      return;
    }
    
    onSave(linkText, linkUrl);
    dispatch('close');
  }
  
  function handleCancel() {
    onCancel();
    dispatch('close');
  }
  
  function handleUrlInput() {
    isValidUrl = true;
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      handleCancel();
    } else if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      handleSave();
    }
  }
  
  onMount(() => {
    // Position the modal
    const editorRect = view.dom.getBoundingClientRect();
    
    if (modalElement) {
      // Find position for the modal
      const { selection } = view.state;
      const { from } = selection;
      const coords = view.coordsAtPos(from);
      
      const virtualReference = {
        getBoundingClientRect() {
          return {
            width: 0,
            height: 0,
            x: coords.left,
            y: coords.top,
            top: coords.top,
            left: coords.left,
            right: coords.left,
            bottom: coords.top,
            toJSON() {
              return this;
            }
          };
        }
      };
      
      computePosition(virtualReference, modalElement, {
        placement: 'bottom',
        middleware: [
          offset(12),
          flip({
            fallbackPlacements: ['top', 'right', 'left'],
            padding: 12,
          }),
          shift({
            padding: 12,
          }),
          arrow({ element: arrowElement }),
        ],
      }).then(({ x, y, placement, middlewareData }) => {
        Object.assign(modalElement.style, {
          left: `${x}px`,
          top: `${y}px`,
        });
        
        // Position the arrow
        if (middlewareData.arrow && arrowElement) {
          const { x: arrowX, y: arrowY } = middlewareData.arrow;
          const staticSide = {
            top: 'bottom',
            right: 'left',
            bottom: 'top',
            left: 'right',
          }[placement.split('-')[0]];
          
          if (staticSide) {
            Object.assign(arrowElement.style, {
              left: arrowX != null ? `${arrowX}px` : '',
              top: arrowY != null ? `${arrowY}px` : '',
              [staticSide]: '-4px',
            });
          }
        }
      });
      
      // Auto focus the appropriate input
      if (textInput && !linkText) {
        textInput.focus();
      } else if (urlInput) {
        urlInput.focus();
        urlInput.select();
      }
      
      document.addEventListener('keydown', handleKeydown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });
  
  // Handle click outside to close
  function handleClickOutside(event: MouseEvent) {
    if (modalElement && !modalElement.contains(event.target as Node) && event.target !== modalElement) {
      handleCancel();
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div 
  class="link-modal" 
  class:dark
  bind:this={modalElement}
  role="dialog"
  aria-labelledby="linkModalTitle"
>
  <div class="link-modal-arrow" bind:this={arrowElement}></div>
  <div class="link-modal-header">
    <h3 id="linkModalTitle">Insert Link</h3>
    <button class="close-button" on:click={handleCancel} aria-label="Close">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6 6 18"></path>
        <path d="m6 6 12 12"></path>
      </svg>
    </button>
  </div>
  
  <div class="link-modal-content">
    <div class="form-group">
      <label for="linkText">Text</label>
      <input 
        id="linkText"
        type="text"
        bind:this={textInput} 
        bind:value={linkText} 
        placeholder="Link text"
      />
    </div>
    <div class="form-group">
      <label for="linkUrl">URL</label>
      <input 
        id="linkUrl"
        type="url"
        class:error={!isValidUrl}
        bind:this={urlInput} 
        bind:value={linkUrl} 
        placeholder="https://example.com"
        on:input={handleUrlInput}
      />
      {#if !isValidUrl}
        <div class="error-message">Please enter a valid URL</div>
      {/if}
    </div>
  </div>
  
  <div class="link-modal-footer">
    <button class="cancel-button" on:click={handleCancel}>Cancel</button>
    <button class="save-button" on:click={handleSave}>Insert Link</button>
  </div>
</div>

<style lang="scss">
  @use '../styles/_variables' as *;

  .link-modal {
    position: absolute;
    z-index: $z-modal;
    width: 320px;
    background: map.get($light, 'bg-secondary');
    border-radius: $radius-xl;
    box-shadow: $shadow-xl;

    overflow: hidden;
    animation: fadeIn 0.15s ease-out;
    display: flex;
    flex-direction: column;
    transition: all 0.2s ease;
    
    &.dark {
      background: map.get($dark, 'bg-secondary');
     
      color: map.get($dark, 'text-primary');
    }
  }

  .link-modal-arrow {
    position: absolute;
    width: 8px;
    height: 8px;
    background: inherit;
    border: inherit;
    z-index: -1;
    transform: rotate(45deg);
    
    .dark & {
      background: map.get($dark, 'bg-secondary');
      border-color: map.get($dark, 'border-medium');
    }
  }

  .link-modal-header {
    padding: $spacing-4;
  
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    h3 {
      margin: 0;
      font-size: $font-size-lg;
      font-weight: $font-weight-medium;
      color: map.get($light, 'text-primary');
      font-family: $font-family-primary;
    }
    
    .dark & {
      
      
      h3 {
        color: map.get($dark, 'text-primary');
      }
    }
  }
  
  .close-button {
    background: none;
    border: none;
    cursor: pointer;
    color: map.get($light, 'text-tertiary');
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-1;
    border-radius: $radius-xl;
    transition: all $transition-base;
    
    &:hover {
      color: map.get($light, 'text-primary');
      background: map.get($light, 'bg-hover');
    }
    
    .dark & {
      color: map.get($dark, 'text-tertiary');
      
      &:hover {
        color: map.get($dark, 'text-primary');
        background: map.get($dark, 'bg-hover');
      }
    }
  }

  .link-modal-content {
    padding: $spacing-4;
  }
  
  .form-group {
    margin-bottom: $spacing-3;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    label {
      display: block;
      margin-bottom: $spacing-1;
      font-size: $font-size-sm;
      color: map.get($light, 'text-tertiary');
      font-weight: $font-weight-medium;
      
      .dark & {
        color: map.get($dark, 'text-tertiary');
      }
    }
    
    input {
      width: 100%;
      padding: $spacing-2 $spacing-3;
      font-size: $font-size-sm;
      border: 1px solid map.get($light, 'border-medium');
      border-radius: $radius-xl;
      background: map.get($light, 'bg-secondary');
      color: map.get($light, 'text-primary');
      transition: all $transition-base;
      font-family: $font-family-primary;
      
      &:focus {
        outline: none;
        border-color: map.get($light, 'accent-primary');
        box-shadow: 0 0 0 2px rgba(map.get($light, 'accent-primary'), 0.15);
      }
      
      &.error {
        border-color: map.get($light, 'error');
        background-color: rgba(map.get($light, 'error'), 0.05);
      }
      
      .dark & {
        background: map.get($dark, 'bg-tertiary');
        border-color: map.get($dark, 'border-medium');
        color: map.get($dark, 'text-primary');
        
        &:focus {
          border-color: map.get($dark, 'accent-primary');
          box-shadow: 0 0 0 2px rgba(map.get($dark, 'accent-primary'), 0.25);
        }
        
        &.error {
          border-color: map.get($dark, 'error');
          background-color: rgba(map.get($dark, 'error'), 0.1);
        }
      }
    }
    
    .error-message {
      color: map.get($light, 'error');
      font-size: $font-size-xs;
      margin-top: $spacing-1;
      
      .dark & {
        color: map.get($dark, 'error');
      }
    }
  }
  
  .link-modal-footer {
    padding: $spacing-4;
  
    display: flex;
    justify-content: flex-end;
    gap: $spacing-2;
    

  }
  
  .cancel-button {
    padding: $spacing-2 $spacing-3;
    font-size: $font-size-sm;
    border-radius: $radius-xl;
    background: map.get($light, 'bg-secondary');
    color: map.get($light, 'text-secondary');
    border: 1px solid map.get($light, 'border-medium');
    cursor: pointer;
    font-weight: $font-weight-medium;
    font-family: $font-family-primary;
    transition: all $transition-base;
    
    &:hover {
      background: map.get($light, 'bg-hover');
    }
    
    .dark & {
      background: map.get($dark, 'bg-tertiary');
      color: map.get($dark, 'text-secondary');
      border-color: map.get($dark, 'border-medium');
      
      &:hover {
        background: map.get($dark, 'bg-hover');
      }
    }
  }
  
  .save-button {
    padding: $spacing-2 $spacing-3;
    font-size: $font-size-sm;
    border-radius: $radius-xl;
    background: map.get($light, 'accent-primary');
    color: white;
    border: 1px solid transparent;
    cursor: pointer;
    font-weight: $font-weight-medium;
    font-family: $font-family-primary;
    transition: all $transition-base;
    
    &:hover {
      background: darken(map.get($light, 'accent-primary'), 5%);
      transform: translateY(-1px);
      box-shadow: $shadow-md;
    }
    
    .dark & {
      background: map.get($dark, 'accent-primary');
      
      &:hover {
        background: lighten(map.get($dark, 'accent-primary'), 5%);
      }
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
</style>
