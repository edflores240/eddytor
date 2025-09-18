// LineSeparatorCommand.ts
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { createLineSeparator } from '../../schema';

/**
 * Insert a horizontal line separator at the current selection
 */
export function insertLineSeparator(state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView): boolean {
  const { selection } = state;
  
  // Create a transaction
  if (dispatch) {
    const tr = state.tr;
    
    // Delete any selected content first
    if (!selection.empty) {
      tr.deleteSelection();
    }
    
    try {
      // Insert the line separator at the current position
      const lineSeparator = createLineSeparator();
      tr.replaceSelectionWith(lineSeparator);
      
      // Safely set cursor position after the separator
      // Using Selection.near will find a valid position closest to the desired one
      const insertPos = tr.selection.from;
      if (insertPos <= tr.doc.content.size) {
        const $insertPos = tr.doc.resolve(insertPos);
        const SelectionClass = selection.constructor as any;
        tr.setSelection(SelectionClass.near($insertPos));
      }
    } catch (error) {
      console.error('Error inserting line separator:', error);
    }

    // Dispatch the transaction
    dispatch(tr.scrollIntoView());
  }
  
  return true;
}

// Register this command with your command registry
// This would typically be done in your command registry initialization
export const registerLineSeparatorCommand = (registry: any) => {
  registry.registerCommand('insertLineSeparator', {
    execute: ({ view }) => {
      return insertLineSeparator(view.state, view.dispatch, view);
    },
    isActive: () => false,
    isEnabled: ({ state }) => true,
    icon: 'horizontal-rule',
    label: 'Insert Horizontal Line',
    description: 'Insert a horizontal line separator',
    category: 'formatting',
    shortcut: 'Shift-Mod-_' // Command/Ctrl + Shift + _
  });
};
