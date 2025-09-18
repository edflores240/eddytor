import { BaseCommand, CommandContext, CommandResult } from '../../core/Command';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema } from 'prosemirror-model';

/**
 * Command to remove all formatting from selected text
 */
export class ClearFormattingCommand extends BaseCommand {
  constructor() {
    const name = 'Clear Formatting';
    const id = 'clear-formatting';
    const keywords = ['clear', 'remove', 'formatting', 'plain', 'text', 'reset'];
    
    super(id, name, 'Remove all formatting from selected text', 'eraser', keywords);
  }

  async execute(context: CommandContext): Promise<CommandResult> {
    const { view } = context;
    const { state, dispatch } = view;
    
    try {
      if (clearFormatting(state, dispatch)) {
        return { success: true };
      } else {
        return { 
          success: false, 
          message: 'Failed to clear formatting - no valid selection or no formatting to clear' 
        };
      }
    } catch (error) {
      const errorMessage = `Failed to clear formatting: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMessage);
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  }

  canExecute(context: CommandContext): boolean {
    // Allow execution regardless of selection state
    // It's safe to always allow this command
    return true;
  }
}

/**
 * Clear all formatting from the selected text
 * 
 * @param state The current editor state
 * @param dispatch Function to dispatch transactions
 * @param view Optional editor view
 * @returns True if formatting was cleared, false otherwise
 */
export function clearFormatting(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
  view?: EditorView
): boolean {
  const { selection } = state;
  const { schema } = state;
  const { marks } = schema;
  
  // If selection is empty, we'll clear formatting at cursor position
  // which affects the next input
  const { from, to } = selection;
  
  // Create a transaction
  if (dispatch) {
    const tr = state.tr;
    
    if (selection.empty) {
      // For empty selections, we'll remove marks at the cursor position
      // This affects marks that will be applied to the next input
      
      // Get all active marks at the cursor position
      const storedMarks = tr.storedMarks || state.storedMarks;
      
      // If there are stored marks, remove them
      if (storedMarks && storedMarks.length > 0) {
        tr.setStoredMarks([]);
      } else {
        // No stored marks to clear
        return false;
      }
    } else {
      // If there is a selection, remove all marks in the selection
      Object.keys(marks).forEach(markName => {
        // If this mark exists in the schema, remove it
        const mark = marks[markName];
        if (mark) {
          tr.removeMark(from, to, mark);
        }
      });
    }
    
    // Dispatch the transaction
    dispatch(tr);
  }
  
  return true;
}

// Factory function
export const createClearFormattingCommand = () => new ClearFormattingCommand();

// Register function for the command registry
export const registerClearFormattingCommand = (registry: any) => {
  registry.register(new ClearFormattingCommand());
};
