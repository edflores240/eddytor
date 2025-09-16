import { BaseCommand, CommandContext, CommandResult } from '../../core/Command';
import { NodeType } from 'prosemirror-model';

export interface CodeBlockCommandOptions {
  language?: string; // Optional language identifier
}

export class CodeBlockCommand extends BaseCommand {
  constructor() {
    const name = 'Code Block';
    const id = 'code-block'; // Match the config in slash menu
    const keywords = ['code', 'snippet', 'programming', 'block'];
    
    super(id, name, 'Insert a code block', 'code', keywords);
  }

  async execute(context: CommandContext): Promise<CommandResult> {
    const { view } = context;
    const { state, dispatch } = view;
    const { selection } = state;
    const { $from, $to } = selection;
    const codeBlockType = state.schema.nodes.code_block;

    try {
      // Create the transaction
      let tr = state.tr;
      
      // If there's text selected, we wrap it in a code block
      if (!selection.empty) {
        const textContent = state.doc.textBetween($from.pos, $to.pos, ' ');
        
        // Delete the selected text
        tr = tr.deleteSelection();
        
        // Insert a code block at the current position
        tr = tr.replaceSelectionWith(
          codeBlockType.create({ language: null }, state.schema.text(textContent))
        );
      } else {
        // No selection, just insert an empty code block
        tr = tr.replaceSelectionWith(
          codeBlockType.create({ language: null })
        );
      }

      // Apply the transaction
      if (dispatch) {
        dispatch(tr);
        console.log('Code block command executed successfully');
        return { success: true };
      }
      
      return { 
        success: false, 
        message: 'Failed to create code block: No dispatch available' 
      };
    } catch (error) {
      const errorMessage = `Failed to create code block: ${error instanceof Error ? error.message : String(error)}`;
      console.error('Error executing code block command:', errorMessage);
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  }

  canExecute(context: CommandContext): boolean {
    // Always allow code block creation if the schema has a code_block node
    const { state } = context.view;
    const codeBlockType = state.schema.nodes.code_block as NodeType;
    
    return !!codeBlockType;
  }
}

// Export factory function for convenience
export const createCodeBlockCommand = () => new CodeBlockCommand();
