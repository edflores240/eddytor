import { BaseCommand, CommandContext, CommandResult } from '../../core/Command';
import { NodeType } from 'prosemirror-model';

export interface CodeBlockCommandOptions {
  language?: string; // Optional language identifier
}

export class CodeBlockCommand extends BaseCommand {
  private options: CodeBlockCommandOptions;
  
  constructor(options: CodeBlockCommandOptions = {}) {
    const name = 'Code Block';
    const id = 'code-block'; // Match the config in slash menu
    const keywords = ['code', 'snippet', 'programming', 'block'];
    
    super(id, name, 'Insert a code block', 'code', keywords);
    this.options = options;
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
      
      // Determine the language - use provided option or try to detect from selected text
      const language = this.options.language || this.detectLanguage(state.doc.textBetween($from.pos, $to.pos, ' '));
      
      // If there's text selected, we wrap it in a code block
      if (!selection.empty) {
        const textContent = state.doc.textBetween($from.pos, $to.pos, '\n');
        
        // Delete the selected text
        tr = tr.deleteSelection();
        
        // Insert a code block at the current position
        tr = tr.replaceSelectionWith(
          codeBlockType.create({ language }, state.schema.text(textContent))
        );
      } else {
        // No selection, just insert an empty code block
        tr = tr.replaceSelectionWith(
          codeBlockType.create({ language })
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
  
  private detectLanguage(text: string): string | null {
    // Simple language detection based on common patterns
    const trimmed = text.trim();
    
    // Check for common language indicators
    if (/^(function|const|let|var|class|import|export)\s/.test(trimmed)) {
      return 'javascript';
    }
    if (/^(interface|type|enum|namespace|declare)\s/.test(trimmed)) {
      return 'typescript';
    }
    if (/^(def|class|import|from|if __name__|print\s*\()/.test(trimmed)) {
      return 'python';
    }
    if (/^(public|private|protected|package|import|class)\s/.test(trimmed)) {
      return 'java';
    }
    if (/^(<\?php|namespace|use|function|class)\s/.test(trimmed)) {
      return 'php';
    }
    if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\s/i.test(trimmed)) {
      return 'sql';
    }
    if (/^(\.|#|[a-zA-Z-]+\s*{)/.test(trimmed)) {
      return 'css';
    }
    if (/^<[a-zA-Z]/.test(trimmed)) {
      return 'html';
    }
    if (/^{[\s\S]*"[^"]+"\s*:/.test(trimmed)) {
      return 'json';
    }
    
    // Default to null (plain text)
    return null;
  }
}

// Factory functions for different language presets
export const createCodeBlockCommand = (options: CodeBlockCommandOptions = {}) => 
  new CodeBlockCommand(options);

export const createJavaScriptCodeBlockCommand = () => 
  new CodeBlockCommand({ language: 'javascript' });

export const createTypeScriptCodeBlockCommand = () => 
  new CodeBlockCommand({ language: 'typescript' });

export const createPythonCodeBlockCommand = () => 
  new CodeBlockCommand({ language: 'python' });