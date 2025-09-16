import { Plugin, PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import SyntaxHighlighterService from '../utils/SyntaxHighlighterService';

// Track processed code blocks to avoid duplicate highlighting
const processedCodeBlocks = new WeakSet<HTMLElement>();

/**
 * ProseMirror plugin for syntax highlighting of code blocks
 */
export const codeBlockHighlightPlugin = new Plugin({
  key: new PluginKey('codeBlockHighlight'),
  
  // Register the NodeView for code blocks
  props: {
    nodeViews: {
      // Use type assertion to handle the complex type compatibility
      code_block: (node, view, getPos) => {
        // Create DOM structure
        const pre = document.createElement('pre');
        pre.className = 'code-block';
        const code = document.createElement('code');
        pre.appendChild(code);
        
        // Set language attribute if available
        const language = node.attrs.language;
        if (language) {
          pre.setAttribute('data-language', language);
        }
        
        // Mark as processed
        processedCodeBlocks.add(pre);
        
        // Apply highlighting after DOM is ready
        setTimeout(() => {
          SyntaxHighlighterService.applyHighlightingClasses(code, language);
        }, 0);
        
        return {
          dom: pre,
          contentDOM: code,
          update(newNode) {
            if (newNode.type.name !== 'code_block') return false;
            
            // Update language if needed
            const newLanguage = newNode.attrs.language;
            if (language !== newLanguage) {
              if (newLanguage) {
                pre.setAttribute('data-language', newLanguage);
              } else {
                pre.removeAttribute('data-language');
              }
            }
            
            // Re-apply highlighting after content updates
            setTimeout(() => {
              SyntaxHighlighterService.applyHighlightingClasses(code, newLanguage);
            }, 0);
            
            return true;
          }
        };
      }
    }
  },
});

/**
 * Helper to set the language of a code block
 */
export function setCodeBlockLanguage(view: EditorView, pos: number, language: string) {
  const node = view.state.doc.nodeAt(pos);
  if (!node || node.type.name !== 'code_block') return false;
  
  const tr = view.state.tr.setNodeMarkup(
    pos, 
    undefined, 
    { ...node.attrs, language }
  );
  
  view.dispatch(tr);
  return true;
}
