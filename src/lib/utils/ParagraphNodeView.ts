import { Node as ProseMirrorNode } from 'prosemirror-model';
import { EditorView, NodeView, Decoration } from 'prosemirror-view';
import { PlaceholderConfig, mergePlaceholderConfig } from '../types/placeholder';

/**
 * ParagraphNodeView wraps each paragraph in a div for block-level UI (Notion-style).
 * Handles placeholder display and menu injection points.
 */
export class ParagraphNodeView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;
  menuContainer: HTMLElement | null = null;
  placeholderElement: HTMLElement | null = null;
  private config: ReturnType<typeof mergePlaceholderConfig>;
  private view: EditorView;
  private getPos: () => number;
  private node: ProseMirrorNode; // Store the current node

  constructor(
    node: ProseMirrorNode,
    view: EditorView,
    getPos: () => number,
    placeholderConfig?: PlaceholderConfig,
  ) {
    this.view = view;
    this.getPos = getPos;
    this.node = node; // Store the node
    this.config = mergePlaceholderConfig(placeholderConfig);

    // Create main container
    this.dom = document.createElement('div');
    this.dom.className = 'pm-block';
    this.dom.style.position = 'relative';

    // Create content container
    const p = document.createElement('p');
    this.contentDOM = p;
    this.dom.appendChild(p);

    // Create menu container for slash commands
    this.menuContainer = document.createElement('span');
    this.menuContainer.className = 'slash-menu-anchor';
    this.dom.appendChild(this.menuContainer);

    // Set up placeholder
    this.setupPlaceholder();
    this.updatePlaceholder(node);

    // Set up event listeners
    this.setupEventListeners();
  }

  update(node: ProseMirrorNode, decorations: readonly Decoration[]) {
    if (node.type.name !== 'paragraph') return false;
    this.node = node; // Update stored node
    this.updatePlaceholder(node);
    return true;
  }

  private setupPlaceholder() {
    this.placeholderElement = document.createElement('span');
    this.placeholderElement.className = this.config.className;
    
    // Prevent text selection and highlighting
    this.placeholderElement.style.userSelect = 'none';
    this.placeholderElement.style.webkitUserSelect = 'none';
  
    this.placeholderElement.style.pointerEvents = 'none';
    
    // Apply styles
    Object.entries(this.config.style).forEach(([key, value]) => {
      if (value) {
        this.placeholderElement!.style[key as any] = value as string;
      }
    });
    
    // Apply attributes
    Object.entries(this.config.attributes).forEach(([key, value]) => {
      this.placeholderElement!.setAttribute(key, value);
    });

    this.dom.appendChild(this.placeholderElement);
  }

  private updatePlaceholder(node: ProseMirrorNode) {
    if (!this.placeholderElement) return;

    const isEmpty = node.textContent.trim() === '';
    const shouldShow = this.shouldShowPlaceholder(isEmpty);

    if (shouldShow) {
      this.placeholderElement.style.display = '';
      
      // Clear previous content
      this.placeholderElement.innerHTML = '';
      
      // Get the content
      let content = this.config.text;
      if (typeof content === 'function') {
        content = content();
      } 
      
      // Handle different content types
      if (typeof content === 'string') {
        // For string content, use innerHTML to support HTML tags
        this.placeholderElement.innerHTML = content;
      } else if (content && typeof content === 'object') {
        // Handle { __html: string } pattern
        if ('__html' in content && typeof content.__html === 'string') {
          this.placeholderElement.innerHTML = content.__html;
        }
        // Handle HTMLElement
        else if (content instanceof HTMLElement) {
          this.placeholderElement.appendChild(content);
        }
        // Handle other objects that might have innerHTML property
        else if ('innerHTML' in content && typeof content.innerHTML === 'string') {
          this.placeholderElement.innerHTML = content.innerHTML;
        }
      }
      
      // Ensure placeholder styling is applied
      this.placeholderElement.style.userSelect = 'none';
      this.placeholderElement.style.pointerEvents = 'none';
    } else {
      this.placeholderElement.style.display = 'none';
    }
  }

  private shouldShowPlaceholder(isEmpty: boolean): boolean {
    // Debug: Log getPos value
    let pos = -1;
    try {
      pos = this.getPos();
    } catch (e) {
      console.warn('getPos() failed:', e);
    }
    const isFirstBlock = pos === 0;
    console.log('[Placeholder Debug]', { pos, isFirstBlock, isEmpty, showForEmptyBlocks: this.config.showForEmptyBlocks });
    
    // Use setTimeout to ensure DOM is fully rendered before querying
    setTimeout(() => {
      // Query using the actual className from config
      const placeholderSelector = `.${this.config.className}`;
      
      // Get all placeholders in the entire document
      const allPlaceholders = Array.from(document.querySelectorAll(placeholderSelector));
      
      // Get placeholders within the current view's DOM
      const viewPlaceholders = Array.from(this.dom.querySelectorAll(placeholderSelector));
      

     
      // Also check if this specific placeholder is in the DOM
      const thisPlaceholderInDOM = this.placeholderElement && document.contains(this.placeholderElement);
      
      console.log('All placeholders in document:', allPlaceholders.length, allPlaceholders);
      console.log('Placeholders in current view:', viewPlaceholders.length, viewPlaceholders);
      console.log('This placeholder in DOM:', thisPlaceholderInDOM);
      console.log('This placeholder element:', this.placeholderElement);
    }, 0);
      
    if (!isFirstBlock) {
      return false; // Simply return false without manipulating other placeholders
    }
    
    // Rest of your logic for the first block
    if (!this.config.showForEmptyBlocks) return false;
    if (!isEmpty) return false;
    
    const hasFocus = this.view && typeof this.view.hasFocus === 'function' ? this.view.hasFocus() : false;
    if (hasFocus) return this.config.showOnFocus;
    return this.config.showOnBlur;
  }

  private setupEventListeners() {
    // Update placeholder on focus/blur
    this.dom.addEventListener('focusin', this.handleFocus);
    this.dom.addEventListener('focusout', this.handleBlur);
  }

  private handleFocus = () => {
    this.updatePlaceholder(this.node); // Use stored node
    console.log('focus', this.node);
  };

  private handleBlur = () => {
    this.updatePlaceholder(this.node); // Use stored node
    console.log('blur', this.node);
  };

  destroy() {
    if (this.placeholderElement) {
      this.dom.removeChild(this.placeholderElement);
      this.placeholderElement = null;
    }
    
    // Clean up event listeners
    this.dom.removeEventListener('focusin', this.handleFocus);
    this.dom.removeEventListener('focusout', this.handleBlur);
  }
}

// Helper for ProseMirror nodeViews config
export function paragraphNodeViewFactory(view: EditorView, placeholderConfig?: PlaceholderConfig) {
  return (node: ProseMirrorNode, _view: EditorView, getPos: () => number) => {
    return new ParagraphNodeView(node, view, getPos, placeholderConfig);
  };
}