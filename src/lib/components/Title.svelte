<!-- Title.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    export let value: string = '';
    export let placeholder: string = 'Untitled Document';
    export let editable: boolean = true;
    export let className: string = '';
    export let attributes: Record<string, string> = {};
    export let dark: boolean = false;
    
    const dispatch = createEventDispatcher();
    
    let titleElement: HTMLDivElement;
    let isComposing = false;
    let lastValue = value;
    let isMouseDown = false;
    
    function handleInput(event: Event) {
      if (!editable) return;
      
      // Save current cursor position
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      const cursorPosition = range?.startOffset || 0;
      const cursorNode = range?.startContainer;
      
      const target = event.target as HTMLDivElement;
      
      // Prevent <br> from being inserted when content is empty
      if (target.innerHTML === '<br>') {
        target.innerHTML = '';
        return;
      }
      
      const newValue = target.textContent || '';
      
      // Always update the value to prevent cursor jumps
      if (newValue !== value) {
        value = newValue;
        lastValue = newValue;
        dispatch('change', { value, target });
      }
      
      // Restore cursor position after a small delay to allow the DOM to update
      requestAnimationFrame(() => {
        if (!selection || !range || !titleElement) return;
        
        // If we have a cursor node and it's still in the document, try to restore position
        if (cursorNode && document.contains(cursorNode)) {
          try {
            const newRange = document.createRange();
            newRange.setStart(cursorNode, Math.min(cursorPosition, cursorNode.textContent?.length || 0));
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          } catch (e) {
            // If restoring fails, just put cursor at the end
            const newRange = document.createRange();
            newRange.selectNodeContents(titleElement);
            newRange.collapse(false);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        } else if (titleElement.firstChild) {
          // Fallback: Put cursor at the end
          const newRange = document.createRange();
          newRange.selectNodeContents(titleElement);
          newRange.collapse(false);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      });
    }
    
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Enter') {
        event.preventDefault();
        dispatch('submit', { value, event });
      }
      if (event.key === 'Escape') {
        titleElement?.blur();
      }
    }
    
    function handleFocus() {
      // Restore cursor position if needed
      if (titleElement && value) {
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(titleElement);
        range.collapse(false); // Move cursor to end
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      dispatch('focus', { value });
    }
    
    function handleBlur() {
      // Save the current cursor position
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      dispatch('blur', { value });
    }

    function handleMouseDown() {
      isMouseDown = true;
    }

    function handleMouseUp() {
      isMouseDown = false;
    }

    function handleSelect() {
      if (!isMouseDown) return;
      // Handle text selection if needed
    }

    // Handle composition events for IME input
    function handleCompositionStart() {
      isComposing = true;
    }

    function handleCompositionEnd(event: CompositionEvent) {
      isComposing = false;
      // Manually trigger input event after composition ends
      handleInput(event as unknown as Event);
    }
    
    function handlePaste(event: ClipboardEvent) {
      event.preventDefault();
      const text = event.clipboardData?.getData('text/plain') || '';
      document.execCommand('insertText', false, text);
    }
    
    // Build attributes object
    $: computedAttributes = {
      'data-placeholder': placeholder,
      'data-editable': editable.toString(),
      ...attributes
    };

    // Handle external value changes
    $: if (titleElement && value !== lastValue && !isComposing) {
      // Save current selection
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      const cursorPosition = range?.startOffset || 0;
      
      // Only update if the content is actually different
      if (titleElement.textContent !== value) {
        titleElement.textContent = value || '';
        lastValue = value || '';
        
        // Try to restore cursor position after update
        if (value && cursorPosition > 0) {
          requestAnimationFrame(() => {
            if (!titleElement.firstChild) return;
            const newRange = document.createRange();
            const textNode = titleElement.firstChild;
            const position = Math.min(cursorPosition, textNode.textContent?.length || 0);
            newRange.setStart(textNode, position);
            newRange.collapse(true);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(newRange);
          });
        }
      }
    }
  </script>
  
  <div 
    bind:this={titleElement}
    class="document-title {className}"
    class:dark
    class:editable
    on:input={handleInput}
    on:keydown={handleKeydown}
    on:focus={handleFocus}
    on:blur={handleBlur}
    on:mousedown={handleMouseDown}
    on:mouseup={handleMouseUp}
    on:select={handleSelect}
    on:compositionstart={handleCompositionStart}
    on:compositionend={handleCompositionEnd}
    on:paste={handlePaste}
    {...computedAttributes}
    contenteditable={editable ? 'plaintext-only' : false}
  >{value || ''}</div>
  
  <style lang="scss">

  
    .document-title {
      font-size: 3rem;
      font-weight: 800;
      color: map.get($light, 'text-primary');
      width: 100%;
      outline: none;
      margin: 0 0 0rem 0;
      padding: 1rem 0;
      line-height: 1.1;
      min-height: 1.2em;

      background: transparent;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: $font-family-heading;
      letter-spacing: 1px;
      position: relative;
      white-space: pre-wrap;
      word-wrap: break-word;
      -webkit-user-modify: read-write-plaintext-only;
      
      
      &.editable {
        cursor: text;
        border-radius: 8px;
        
        // &:hover {
        //   background: rgba(59, 130, 246, 0.05);
        //   transform: translateY(-1px);
        // }
        
        // &:focus {
        //   background: rgba(59, 130, 246, 0.08);
        //   box-shadow: 
        //     0 0 0 3px rgba(59, 130, 246, 0.1),
        //     0 4px 12px rgba(0, 0, 0, 0.1);
        //   transform: translateY(-2px);
        // }
        
        &:empty::before {
          content: attr(data-placeholder);
          color: map.get($light, 'text-muted');
          pointer-events: none;
          opacity: 0.8;
        }
        
        // Animated underline effect
        &::after {
          content: '';
          position: absolute;
          bottom: 0.5rem;
          left: 50%;
          width: 0;
          height: 3px;
          background:$title-underline-gradient;
          border-radius: 2px;
          transform: translateX(-50%);
          transition: width 0.3s ease;
        }
        
        &:focus::after {
          width: 100%;
        }
      }
      
      // Dark mode styles
      &.dark {
        color: map.get($dark, 'text-primary');
        
        &.editable {
      
          
          &:empty::before {
            color: #6b7280;
          }
          
          &::after {
            background: $title-underline-gradient;
          }
        }
      }
      
      // Responsive design
      @media (max-width: 768px) {
        font-size: 2.25rem;
        margin-bottom: 1.5rem;
        padding: 0.75rem 0;
      }
      
      @media (max-width: 480px) {
        font-size: 1.875rem;
        margin-bottom: 1rem;
        padding: 0.5rem 0;
      }
    }
    
    // Selection styling
    // .document-title::selection {
    //   background: rgba(59, 130, 246, 0.2);
    // }
    
    // .document-title.dark::selection {
    //   background: rgba(99, 102, 241, 0.3);
    // }
  </style>