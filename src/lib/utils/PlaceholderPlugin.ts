import { Plugin, PluginKey, PluginView } from 'prosemirror-state';
import { EditorView, Decoration, DecorationSet } from 'prosemirror-view';
import { Node as ProseMirrorNode } from 'prosemirror-model';

export interface PlaceholderConfig {
  /**
   * Placeholder content for different node types
   */
  text?: string | Record<string, string> | ((node: ProseMirrorNode, pos: number, view: EditorView) => string);
  
  /**
   * CSS class to apply to the placeholder
   */
  className?: string;
  
  /**
   * Show placeholder only for the first empty block
   */
  firstBlockOnly?: boolean;
  
  /**
   * Show placeholder when editor has focus
   */
  showOnFocus?: boolean;
  
  /**
   * Show placeholder when editor loses focus
   */
  showOnBlur?: boolean;
  
  /**
   * Custom condition for showing placeholder
   */
  shouldShow?: (node: ProseMirrorNode, pos: number, view: EditorView) => boolean;
  
  /**
   * Additional CSS styles
   */
  style?: Record<string, string>;
}

const defaultConfig: Required<Omit<PlaceholderConfig, 'shouldShow'>> & { shouldShow?: PlaceholderConfig['shouldShow'] } = {
  text: {
    paragraph: "Type '/' for commands or start writing...",
    heading: "Heading",
    default: "Start typing..."
  },
  className: 'prosemirror-placeholder',
  firstBlockOnly: true,
  showOnFocus: true,
  showOnBlur: true,
  style: {}
};

export const placeholderPluginKey = new PluginKey<DecorationSet>('placeholder');

export function createPlaceholderPlugin(config: PlaceholderConfig = {}): Plugin<DecorationSet> {
  const mergedConfig = { ...defaultConfig, ...config };
  
  return new Plugin<DecorationSet>({
    key: placeholderPluginKey,
    
    state: {
      init() {
        return DecorationSet.empty;
      },
      
      apply(tr, decorationSet, oldState, newState) {
        // Map existing decorations through the transaction
        decorationSet = decorationSet.map(tr.mapping, tr.doc);
        
        // Only recalculate decorations if the document changed or selection moved
        if (!tr.docChanged && !tr.selectionSet) {
          return decorationSet;
        }
        
        const newDecorations: Decoration[] = [];
        const { selection, doc } = newState;
        
        // Walk through the document and find empty blocks
        doc.descendants((node, pos) => {
          // Only handle block nodes
          if (!node.isBlock) return;
          
          // Skip non-text blocks (like images, code blocks, etc.)
          if (!node.isTextblock) return;
          
          // Check if node is empty
          if (!isNodeEmpty(node)) return;
          
          // Check if we should show placeholder for this position
          if (!shouldShowPlaceholder(node, pos, newState, mergedConfig)) return;
          
          // Get placeholder text
          const placeholderText = getPlaceholderText(node, pos, mergedConfig);
          if (!placeholderText) return;
          
          // Create decoration
          const decoration = Decoration.widget(
            pos + 1, // Position after the opening tag
            createPlaceholderElement(placeholderText, mergedConfig),
            {
              side: 0,
              ignoreSelection: false,
              key: `placeholder-${pos}`
            }
          );
          
          newDecorations.push(decoration);
        });
        
        return DecorationSet.create(doc, newDecorations);
      }
    },
    
    props: {
      decorations(state) {
        return placeholderPluginKey.getState(state);
      }
    },
    
    view(editorView) {
      return new PlaceholderPluginView(editorView, mergedConfig);
    }
  });
}

class PlaceholderPluginView implements PluginView {
  private view: EditorView;
  private config: typeof defaultConfig;
  
  constructor(view: EditorView, config: typeof defaultConfig) {
    this.view = view;
    this.config = config;
    
    // Listen for focus/blur events to update placeholder visibility
    this.view.dom.addEventListener('focus', this.handleFocus);
    this.view.dom.addEventListener('blur', this.handleBlur);
  }
  
  private handleFocus = () => {
    this.updateDecorations();
  };
  
  private handleBlur = () => {
    // Slight delay to allow for immediate refocus
    setTimeout(() => this.updateDecorations(), 10);
  };
  
  private updateDecorations() {
    const { state, dispatch } = this.view;
    // Force recreation of decorations by applying an empty transaction
    const tr = state.tr;
    dispatch(tr);
  }
  
  destroy() {
    this.view.dom.removeEventListener('focus', this.handleFocus);
    this.view.dom.removeEventListener('blur', this.handleBlur);
  }
}

function isNodeEmpty(node: ProseMirrorNode): boolean {
  // Check if node has no content or only whitespace
  if (node.childCount === 0) return true;
  if (node.textContent.trim() === '') return true;
  return false;
}

function shouldShowPlaceholder(
  node: ProseMirrorNode, 
  pos: number, 
  state: any, 
  config: typeof defaultConfig
): boolean {
  // Use custom shouldShow function if provided
  if (config.shouldShow) {
    return config.shouldShow(node, pos, state);
  }
  
  // Check if we should only show for first block
  if (config.firstBlockOnly) {
    // Find the first block in the document
    let firstBlockPos = -1;
    state.doc.descendants((n: ProseMirrorNode, p: number) => {
      if (n.isBlock && n.isTextblock && firstBlockPos === -1) {
        firstBlockPos = p;
        return false; // Stop iteration
      }
    });
    
    if (pos !== firstBlockPos) return false;
  }
  
  // Check focus state
  const hasFocus = state.selection.from >= pos && state.selection.to <= pos + node.nodeSize;
  const editorHasFocus = document.activeElement === state.view?.dom ||
                        state.view?.dom?.contains(document.activeElement);
  
  if (editorHasFocus && !config.showOnFocus) return false;
  if (!editorHasFocus && !config.showOnBlur) return false;
  
  return true;
}

function getPlaceholderText(
  node: ProseMirrorNode, 
  pos: number, 
  config: typeof defaultConfig
): string {
  const { text } = config;
  
  if (typeof text === 'function') {
    return text(node, pos, null as any); // view will be passed in real implementation
  }
  
  if (typeof text === 'string') {
    return text;
  }
  
  if (typeof text === 'object' && text !== null) {
    // Try to get placeholder for specific node type
    const nodeTypePlaceholder = text[node.type.name];
    if (nodeTypePlaceholder) return nodeTypePlaceholder;
    
    // Fallback to default
    return text.default || "Start typing...";
  }
  
  return "Start typing...";
}

function createPlaceholderElement(
  text: string, 
  config: typeof defaultConfig
): HTMLElement {
  const element = document.createElement('span');
  element.className = config.className;
  element.textContent = text;
  
  // Apply default styles
  Object.assign(element.style, {
    position: 'absolute',
    pointerEvents: 'none',
    userSelect: 'none',
    color: '#9ca3af',
    fontSize: '14px',
    fontStyle: 'normal',
    fontWeight: 'normal',
    letterSpacing: 'normal',
    textTransform: 'none',
    whiteSpace: 'nowrap',
    opacity: '0.6',
    zIndex: '1',
    top: '0',
    left: '0'
  });
  
  // Apply custom styles
  Object.assign(element.style, config.style);
  
  return element;
}

// Export utility function for external use
export function updatePlaceholders(view: EditorView) {
  const plugin = placeholderPluginKey.get(view.state);
  if (plugin) {
    const tr = view.state.tr;
    view.dispatch(tr);
  }
}