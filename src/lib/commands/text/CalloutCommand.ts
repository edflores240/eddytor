import { BaseCommand, CommandContext, CommandResult } from '../../core/Command';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Node as PMNode, NodeType } from 'prosemirror-model';

// Types of callout variants
type CalloutVariant = 'info' | 'tip' | 'warning' | 'critical';

// Interface for callout command options
export interface CalloutCommandOptions {
  variant: CalloutVariant;
}

/**
 * Command to insert a callout block with different variants
 */
export class CalloutCommand extends BaseCommand {
  private options: CalloutCommandOptions;
  
  constructor(options: CalloutCommandOptions) {
    // Set ID based on variant
    const id = `${options.variant}-callout`;
    const variant = options.variant;
    
    // Set name and description based on variant
    let name = 'Callout';
    let description = 'Insert a callout block';
    let icon = 'info';
    let keywords = ['callout', 'box', 'notification', variant];
    
    // Customize based on variant
    switch (variant) {
      case 'info':
        name = 'Info Callout';
        description = 'Insert an information callout';
        icon = 'info';
        keywords = [...keywords, 'information', 'blue', 'note'];
        break;
      case 'tip':
        name = 'Tip Callout';
        description = 'Insert a tip/success callout';
        icon = 'check-circle';
        keywords = [...keywords, 'success', 'green', 'hint', 'help'];
        break;
      case 'warning':
        name = 'Warning Callout';
        description = 'Insert a warning callout';
        icon = 'alert-triangle';
        keywords = [...keywords, 'caution', 'yellow', 'attention'];
        break;
      case 'critical':
        name = 'Critical Callout';
        description = 'Insert a critical/error callout';
        icon = 'alert-circle';
        keywords = [...keywords, 'error', 'danger', 'red', 'important'];
        break;
    }
    
    super(id, name, description, icon, keywords);
    this.options = options;
  }
  
  async execute(context: CommandContext): Promise<CommandResult> {
    const { view } = context;
    const { state, dispatch } = view;
    
    try {
      // Get callout node type from schema
      const calloutType = state.schema.nodes.callout;
      if (!calloutType) {
        return {
          success: false,
          message: 'Callout node type not found in schema'
        };
      }
      
      // Create and insert callout
      if (insertCallout(state, dispatch, view, calloutType, this.options.variant)) {
        return { success: true };
      } else {
        return { 
          success: false, 
          message: 'Failed to insert callout' 
        };
      }
    } catch (error) {
      const errorMessage = `Failed to execute callout command: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMessage);
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  }
  
  canExecute(context: CommandContext): boolean {
    // This command can be executed in most contexts
    return true;
  }
}

/**
 * Insert a callout block at the current selection
 */
function insertCallout(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
  view?: EditorView,
  calloutType?: NodeType,
  variant: CalloutVariant = 'info'
): boolean {
  // If callout type wasn't provided, try to get it from schema
  if (!calloutType) {
    calloutType = state.schema.nodes.callout;
    if (!calloutType) return false;
  }
  
  if (dispatch) {
    const { selection, schema } = state;
    const { $from, $to } = selection;
    const tr = state.tr;
    
    // Create a paragraph for the content
    const paragraph = schema.nodes.paragraph.create();
    
    // Create the callout with the appropriate variant
    const callout = calloutType.create(
      { variant },
      paragraph
    );
    
    // Replace selection with the callout
    tr.replaceSelectionWith(callout);
    
    // Set selection inside the paragraph in the callout
    const pos = tr.selection.$from.after(1) + 2; // Position inside the paragraph
    try {
      const resolvedPos = tr.doc.resolve(pos);
      // Use type assertion to access the near method
      const SelectionClass = state.selection.constructor as any;
      tr.setSelection(SelectionClass.near(resolvedPos));
    } catch (e) {
      console.warn('Could not set cursor inside callout', e);
    }
    
    dispatch(tr);
    
    // Focus the editor
    if (view) view.focus();
  }
  
  return true;
}

// Factory functions for different callout types
export const createInfoCalloutCommand = () => new CalloutCommand({ variant: 'info' });
export const createTipCalloutCommand = () => new CalloutCommand({ variant: 'tip' });
export const createWarningCalloutCommand = () => new CalloutCommand({ variant: 'warning' });
export const createCriticalCalloutCommand = () => new CalloutCommand({ variant: 'critical' });

// Helper function for creating callout nodes
export function createCallout(
  schema: any, 
  variant: CalloutVariant = 'info', 
  content?: PMNode | PMNode[] | null
): PMNode {
  const paragraph = content || schema.nodes.paragraph.create();
  return schema.nodes.callout.create({ variant }, paragraph);
}

// Register function for the command registry
export const registerCalloutCommands = (registry: any) => {
  registry.register(createInfoCalloutCommand());
  registry.register(createTipCalloutCommand());
  registry.register(createWarningCalloutCommand());
  registry.register(createCriticalCalloutCommand());
};
