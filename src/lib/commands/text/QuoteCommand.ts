import { BaseCommand, CommandContext, CommandResult } from '../../core/Command';
import { NodeType } from 'prosemirror-model';

export class QuoteCommand extends BaseCommand {
  constructor() {
    const name = 'Quote';
    const id = 'quote'; // Match the config in slash menu
    const keywords = ['quote', 'blockquote', 'citation'];
    
    super(id, name, 'Insert a blockquote', 'quote', keywords);
  }

  async execute(context: CommandContext): Promise<CommandResult> {
    const { view } = context;
    const { state, dispatch } = view;
    const { selection } = state;
    const { $from, $to } = selection;
    const blockquoteType = state.schema.nodes.blockquote;

    try {
      // Determine the range to apply the blockquote to
      const startPos = $from.start();
      const endPos = $to.end();

      // Create the transaction
      let tr = state.tr;

      // If the selection spans multiple blocks or paragraphs, wrap them in a blockquote
      if ($from.blockRange && $from.blockRange($to)) {
        tr = tr.wrap($from.blockRange($to)!, [{ type: blockquoteType }]);
      } else {
        // Otherwise, just convert the current block to a blockquote
        tr = tr.setBlockType($from.start(), $to.end(), blockquoteType);
      }

      // Apply the transaction
      if (dispatch) {
        dispatch(tr);
        console.log('Quote command executed successfully');
        return { success: true };
      }
      
      return { 
        success: false, 
        message: 'Failed to create quote: No dispatch available' 
      };
    } catch (error) {
      const errorMessage = `Failed to create quote: ${error instanceof Error ? error.message : String(error)}`;
      console.error('Error executing quote command:', errorMessage);
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  }

  canExecute(context: CommandContext): boolean {
    // Always allow blockquote creation
    // The blockquote node should accept any content that's valid in the editor
    const { state } = context.view;
    const blockquoteType = state.schema.nodes.blockquote as NodeType;
    
    // Just check that blockquote exists in the schema
    return !!blockquoteType;
  }
}

// Export factory function for convenience
export const createQuoteCommand = () => new QuoteCommand();
