import { BaseCommand, CommandContext, CommandResult } from '../../core/Command';
import { createLineSeparator } from '../../schema';

export class LineSeparatorCommand extends BaseCommand {
  constructor() {
    const name = 'Horizontal Rule';
    const id = 'line-separator'; // Match ID for slash menu
    const keywords = ['divider', 'line', 'separator', 'horizontal', 'rule', 'hr'];
    
    super(id, name, 'Insert a horizontal divider line', 'minus', keywords);
  }

  async execute(context: CommandContext): Promise<CommandResult> {
    const { view } = context;
    const { state, dispatch } = view;
    const { selection } = state;
    
    try {
      // Create the transaction
      let tr = state.tr;
      
      // If there's text selected, delete it first
      if (!selection.empty) {
        tr = tr.deleteSelection();
      }
      
      // Insert the line separator at the current position
      const lineSeparator = createLineSeparator();
      tr = tr.replaceSelectionWith(lineSeparator);
      
      // Safely set cursor position after the separator
      // Using Selection.near will find a valid position closest to the desired one
      const insertPos = tr.selection.from;
      if (insertPos <= tr.doc.content.size) {
        const $insertPos = tr.doc.resolve(insertPos);
        const SelectionClass = selection.constructor as any;
        tr = tr.setSelection(SelectionClass.near($insertPos));
      }

      // Apply the transaction
      if (dispatch) {
        dispatch(tr.scrollIntoView());
        console.log('Line separator command executed successfully');
        return { success: true };
      }
      
      return { 
        success: false, 
        message: 'Failed to insert line separator: No dispatch available' 
      };
    } catch (error) {
      const errorMessage = `Failed to insert line separator: ${error instanceof Error ? error.message : String(error)}`;
      console.error('Error executing line separator command:', errorMessage);
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  }

  canExecute(context: CommandContext): boolean {
    // Allow line separator insertion if the schema has a horizontal_rule node
    const { state } = context.view;
    return !!state.schema.nodes.horizontal_rule;
  }
}

// Factory function
export const createLineSeparatorCommand = () => new LineSeparatorCommand();

// Register function for the command registry
export const registerLineSeparatorCommandClass = (registry: any) => {
  registry.register(new LineSeparatorCommand());
};
