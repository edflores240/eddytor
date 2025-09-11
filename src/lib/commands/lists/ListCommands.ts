import { BaseCommand, CommandContext, CommandResult } from '../../core/Command';
import { Node as ProseMirrorNode, NodeType, Schema } from 'prosemirror-model';
import { wrapInList, liftListItem, splitListItem } from 'prosemirror-schema-list';
import { Transaction, EditorState, TextSelection, NodeSelection, Command as ProseMirrorCommand } from 'prosemirror-state';

type ListType = 'bullet' | 'ordered';

// Helper function to safely execute ProseMirror commands
function executeCommand(
  state: EditorState,
  dispatch: ((tr: Transaction) => void) | undefined,
  command: (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean
): boolean {
  return command(state, dispatch || undefined);
}

export class BulletListCommand extends BaseCommand {
  constructor() {
    super(
      'bulletList',
      'Bullet List',
      'Create a bulleted list',
      'list',
      ['ul', 'bullet', 'list']
    );
  }

  async execute(context: CommandContext): Promise<CommandResult> {
    const { view } = context;
    const { state, dispatch } = view;
    const { selection, schema } = state;
    const { $from, $to } = selection;
    const range = $from.blockRange($to);

    if (!range) {
      return { success: false, message: 'No valid range for list' };
    }

    try {
      const listNode = schema.nodes.bullet_list;
      if (!listNode) {
        return { success: false, message: 'Bullet list node type not found in schema' };
      }
      
      const command = wrapInList(listNode);
      const success = executeCommand(state, dispatch, command);
      return { success, message: success ? '' : 'Could not wrap in list' };
    } catch (error) {
      const errorMessage = `Failed to create bullet list: ${error instanceof Error ? error.message : String(error)}`;
      console.error('Error executing bullet list command:', errorMessage);
      return { success: false, message: errorMessage };
    }
  }

  canExecute(context: CommandContext): boolean {
    const { state } = context.view;
    const { $from, $to } = state.selection;
    const range = $from.blockRange($to);
    return !!range;
  }
}

export class OrderedListCommand extends BaseCommand {
  constructor() {
    super(
      'orderedList',
      'Numbered List',
      'Create a numbered list',
      'list-ordered',
      ['ol', 'number', 'ordered']
    );
  }

  async execute(context: CommandContext): Promise<CommandResult> {
    const { view } = context;
    const { state, dispatch } = view;
    const { selection, schema } = state;
    const { $from, $to } = selection;
    const range = $from.blockRange($to);

    if (!range) {
      return { success: false, message: 'No valid range for list' };
    }

    try {
      const listNode = schema.nodes.ordered_list;
      if (!listNode) {
        return { success: false, message: 'Ordered list node type not found in schema' };
      }
      
      const command = wrapInList(listNode);
      const success = executeCommand(state, dispatch, command);
      return { success, message: success ? '' : 'Could not wrap in list' };
    } catch (error) {
      const errorMessage = `Failed to create ordered list: ${error instanceof Error ? error.message : String(error)}`;
      console.error('Error executing ordered list command:', errorMessage);
      return { success: false, message: errorMessage };
    }
  }

  canExecute(context: CommandContext): boolean {
    const { state } = context.view;
    const { $from, $to } = state.selection;
    const range = $from.blockRange($to);
    return !!range;
  }
}

// Helper function to handle tab key for indenting lists
export function handleTabKey(
  view: { state: EditorState; dispatch: (tr: Transaction) => void },
  event: KeyboardEvent
): boolean {
  if (!view?.state?.schema) return false;
  const { state, dispatch } = view;
  const { selection, schema } = state;
  const { $from, $to } = selection;
  const range = $from.blockRange($to);

  if (!range) return false;
  
  // Check if we're in a list item
  const listItemType = schema.nodes.list_item;
  const bulletListType = schema.nodes.bullet_list;
  const orderedListType = schema.nodes.ordered_list;
  
  if (!listItemType || !bulletListType || !orderedListType) {
    return false;
  }

  // Handle tab to indent
  if (event.key === 'Tab') {
    event.preventDefault();
    
    if (event.shiftKey) {
      // Shift+Tab to outdent
      const command = liftListItem(listItemType);
      return executeCommand(state, dispatch, command);
    } else {
      // Tab to indent
      // First try to split the list item if at the start of a non-empty list item
      if ($from.parentOffset === 0 && $from.parent.textContent.length > 0) {
        const command = splitListItem(listItemType);
        if (executeCommand(state, dispatch, command)) {
          return true;
        }
      }
      
      // Otherwise, just indent the current item
      const listType = range.parent.type === bulletListType ? bulletListType : orderedListType;
      const command = wrapInList(listType);
      return executeCommand(state, dispatch, command);
    }
  }
  
  return false;
}
