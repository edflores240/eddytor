import { BaseCommand, CommandContext, CommandResult } from '../../core/Command';
import { NodeType } from 'prosemirror-model';

export interface HeadingCommandOptions {
  level: 1 | 2 | 3; // Support for h1, h2, h3
}

export class HeadingCommand extends BaseCommand {
  constructor(level: 1 | 2 | 3) {
    const name = `Heading ${level}`;
    const id = `heading${level}`; // Match the config (no hyphen)
    const keywords = [`h${level}`, `heading-${level}`, `heading ${level}`];
    
    super(id, name, `Apply heading level ${level}`, `heading-${level}`, keywords);
    
    this.level = level;
  }

  private level: number;

  async execute(context: CommandContext): Promise<CommandResult> {
    const { view } = context;
    const { state, dispatch } = view;
    const { selection } = state;
    const { $from } = selection;

    try {
      // Set the heading level
      const tr = state.tr.setBlockType(
        $from.pos,
        $from.pos,
        state.schema.nodes.heading,
        { level: this.level }
      );

      // Apply the transaction
      if (dispatch) {
        dispatch(tr);
        return { success: true };
      }
      
      return { 
        success: false, 
        message: 'Failed to apply heading: No dispatch available' 
      };
    } catch (error) {
      const errorMessage = `Failed to apply heading: ${error instanceof Error ? error.message : String(error)}`;
      console.error('Error executing heading command:', errorMessage);
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  }

  canExecute(context: CommandContext): boolean {
    // Check if the current node can be a heading
    const { state } = context.view;
    const { $from } = state.selection;
    const headingType = state.schema.nodes.heading as NodeType;
    return headingType.validContent($from.parent.content);
  }
}

// Export factory functions for convenience
export const createHeading1Command = () => new HeadingCommand(1);
export const createHeading2Command = () => new HeadingCommand(2);
export const createHeading3Command = () => new HeadingCommand(3);
