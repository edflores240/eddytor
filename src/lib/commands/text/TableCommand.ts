import { BaseCommand, CommandContext, CommandResult } from '../../core/Command';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Node as PMNode } from 'prosemirror-model';
import { createTable } from '../../schema';

// Interface for table command options
export interface TableCommandOptions {
  rows: number;
  cols: number;
  withHeader: boolean;
}

/**
 * Command to insert a table with configurable dimensions
 */
export class TableCommand extends BaseCommand {
  private options: TableCommandOptions;
  
  constructor(options: TableCommandOptions) {
    // Default options
    const defaultOptions = {
      rows: 3,
      cols: 3,
      withHeader: true,
    };
    
    const mergedOptions = {
      ...defaultOptions,
      ...options
    };
    
    // Set ID and other properties
    const id = `table-${mergedOptions.rows}x${mergedOptions.cols}`;
    const name = mergedOptions.withHeader 
      ? `Table ${mergedOptions.rows}x${mergedOptions.cols} with header` 
      : `Table ${mergedOptions.rows}x${mergedOptions.cols}`;
    const description = `Insert a ${mergedOptions.rows}x${mergedOptions.cols} table${mergedOptions.withHeader ? ' with header row' : ''}`;
    const icon = 'table';
    const keywords = ['table', 'grid', 'cells', 'rows', 'columns'];
    
    super(id, name, description, icon, keywords);
    this.options = mergedOptions;
  }
  
  async execute(context: CommandContext): Promise<CommandResult> {
    const { view } = context;
    const { state, dispatch } = view;
    
    try {
      // Get table node type from schema
      const tableType = state.schema.nodes.table;
      if (!tableType) {
        return {
          success: false,
          message: 'Table node type not found in schema'
        };
      }
      
      // Insert table
      if (insertTable(state, dispatch, view, this.options)) {
        return { success: true };
      } else {
        return { 
          success: false, 
          message: 'Failed to insert table' 
        };
      }
    } catch (error) {
      const errorMessage = `Failed to execute table command: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMessage);
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  }
  
  canExecute(context: CommandContext): boolean {
    // This command can be executed in most contexts where the user can insert content
    return true;
  }
}

/**
 * Insert a table at the current selection
 */
function insertTable(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
  view?: EditorView,
  options: TableCommandOptions = { rows: 3, cols: 3, withHeader: true }
): boolean {
  const { schema } = state;
  
  // Check if table node type exists in schema
  if (!schema.nodes.table) return false;
  
  if (dispatch) {
    const { selection } = state;
    const tr = state.tr;
    
    // Create table using helper from schema.ts
    const table = createTable(
      options.rows, 
      options.cols, 
      options.withHeader
    );
    
    // Replace selection with the table
    tr.replaceSelectionWith(table);
    
    // Try to position cursor in the first cell of the table
    try {
      const resolvedPos = tr.doc.resolve(tr.selection.from + 4); // Position inside first cell
      // Use type assertion to access the near method
      const SelectionClass = state.selection.constructor as any;
      tr.setSelection(SelectionClass.near(resolvedPos));
    } catch (e) {
      console.warn('Could not set cursor inside table', e);
    }
    
    dispatch(tr);
    
    // Focus the editor
    if (view) view.focus();
  }
  
  return true;
}

// Factory functions for different table sizes
export const createSmallTableCommand = () => 
  new TableCommand({ rows: 2, cols: 2, withHeader: true });

export const createMediumTableCommand = () => 
  new TableCommand({ rows: 3, cols: 3, withHeader: true });

export const createLargeTableCommand = () => 
  new TableCommand({ rows: 5, cols: 5, withHeader: true });

// Register function for the command registry
export const registerTableCommands = (registry: any) => {
  registry.register(createSmallTableCommand());
  registry.register(createMediumTableCommand());
  registry.register(createLargeTableCommand());
};
