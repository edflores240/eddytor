import { BaseCommand, CommandContext, CommandResult } from '../../core/Command';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Mark, MarkType } from 'prosemirror-model';

// Store a reference to the modal component for cleanup
let activeLinkModal: any = null;

// Event handler for modal
let modalListenerAdded = false;

export class HyperlinkCommand extends BaseCommand {
  constructor() {
    const name = 'Hyperlink';
    const id = 'hyperlink';
    const keywords = ['link', 'url', 'hyperlink', 'external', 'anchor'];
    
    super(id, name, 'Insert a hyperlink', 'link', keywords);
  }

  async execute(context: CommandContext): Promise<CommandResult> {
    const { view } = context;
    const { state } = view;
    
    try {
      const linkMark = state.schema.marks.link;
      if (!linkMark) {
        return {
          success: false,
          message: 'Link mark is not available in the schema'
        };
      }
      
      // If there is text selected, check if it's already a link
      const { from, to } = state.selection;
      const selectedText = state.doc.textBetween(from, to, ' ');
      let initialUrl = '';
      
      // Check if the selection is already a link
      if (!state.selection.empty) {
        const marks = state.doc.rangeHasMark(from, to, linkMark);
        if (marks) {
          // Find the link mark on the first node in the selection
          const linkMark = this.getLinkMark(state);
          if (linkMark) {
            initialUrl = linkMark.attrs.href || '';
          }
        }
      }
      
      // Open the link modal
      this.openLinkModal(view, selectedText, initialUrl);
      
      // This command doesn't immediately change the document
      // The actual changes will be made when the modal is submitted
      return {
        success: true
      };
    } catch (error) {
      const errorMessage = `Failed to execute hyperlink command: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  canExecute(context: CommandContext): boolean {
    return !!context.view.state.schema.marks.link;
  }
  
  /**
   * Get the link mark from the selection, if any
   */
  private getLinkMark(state: EditorState): Mark | null {
    const { from, to } = state.selection;
    let result: Mark | null = null;
    
    state.doc.nodesBetween(from, to, (node) => {
      if (result) return false; // Already found a link mark
      
      const linkMark = node.marks.find(mark => 
        mark.type.name === 'link'
      );
      
      if (linkMark) {
        result = linkMark;
        return false;
      }
      
      return true;
    });
    
    return result;
  }
  
  /**
   * Apply a link to the selected text
   */
  private applyLink(view: EditorView, url: string): void {
    const { state, dispatch } = view;
    const { schema, selection } = state;
    const { from, to } = selection;
    
    // Use empty selection if no text is selected
    const isEmpty = from === to;
    const tr = state.tr;
    
    // Trim the URL
    const trimmedUrl = url.trim();
    
    // If no text is selected, insert the URL as text
    if (isEmpty) {
      const text = schema.text(trimmedUrl);
      tr.replaceSelectionWith(text, false);
      
      // Apply the link mark to the inserted text
      const linkMark = schema.marks.link.create({ href: trimmedUrl });
      tr.addMark(tr.selection.from - trimmedUrl.length, tr.selection.from, linkMark);
    } else {
      // Apply the link mark to the selected text
      const linkMark = schema.marks.link.create({ href: trimmedUrl });
      tr.addMark(from, to, linkMark);
    }
    
    dispatch(tr);
    view.focus();
  }
  
  /**
   * Open a modal to input link details
   */
  private async openLinkModal(view: EditorView, initialText: string = '', initialUrl: string = ''): Promise<void> {
    try {
      // Clean up any existing modal
      if (activeLinkModal) {
        document.body.removeChild(activeLinkModal);
        activeLinkModal = null;
      }
      
      // Import the modal component dynamically
      const LinkModal = (await import('../../components/LinkModal.svelte')).default;
      
      // Create a container for the modal
      const modalContainer = document.createElement('div');
      document.body.appendChild(modalContainer);
      
      // Create the modal component
      const modalComponent = new LinkModal({
        target: modalContainer,
        props: {
          view,
          dark: document.documentElement.classList.contains('dark'),
          initialText,
          initialUrl,
          onSave: (text: string, url: string) => {
            const { state, dispatch } = view;
            const { selection, schema } = state;
            const { from, to } = selection;
            const tr = state.tr;
            const isEmpty = from === to;

            // If we have selected text, apply link to it
            if (!isEmpty) {
              // Apply the link mark to selected text
              const linkMark = schema.marks.link.create({ href: url });
              tr.addMark(from, to, linkMark);
              dispatch(tr);
            } else {
              // Insert new text and apply link
              const displayText = text || url;
              // Insert the display text
              tr.insertText(displayText);
              
              // Get position of inserted text
              const insertedFrom = tr.selection.from - displayText.length;
              const insertedTo = tr.selection.from;
              
              // Apply link mark to the inserted text
              const linkMark = schema.marks.link.create({ href: url });
              tr.addMark(insertedFrom, insertedTo, linkMark);
              
              dispatch(tr);
            }
            
            // Restore focus to editor
            view.focus();
            
            // Clean up the modal
            if (modalContainer && modalContainer.parentNode) {
              modalContainer.parentNode.removeChild(modalContainer);
            }
            activeLinkModal = null;
          },
          onCancel: () => {
            // Clean up the modal
            if (modalContainer && modalContainer.parentNode) {
              modalContainer.parentNode.removeChild(modalContainer);
            }
            activeLinkModal = null;
          }
        }
      });
      
      activeLinkModal = modalContainer;
      
      // Add event listener to handle ESC key
      if (!modalListenerAdded) {
        document.addEventListener('keydown', (e: KeyboardEvent) => {
          if (e.key === 'Escape' && activeLinkModal) {
            if (modalContainer && modalContainer.parentNode) {
              modalContainer.parentNode.removeChild(modalContainer);
            }
            activeLinkModal = null;
          }
        });
        modalListenerAdded = true;
      }
    } catch (error) {
      console.error('Failed to open link modal:', error);
    }
  }
}

// Factory function
export const createHyperlinkCommand = () => new HyperlinkCommand();

// Register function for the command registry
export const registerHyperlinkCommand = (registry: any) => {
  registry.register(new HyperlinkCommand());
};
