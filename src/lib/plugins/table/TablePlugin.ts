import {
  tableEditing,
  columnResizing,
  goToNextCell,
  addColumnBefore,
  addColumnAfter,
  deleteColumn,
  addRowBefore,
  addRowAfter,
  deleteRow,
  mergeCells,
  splitCell,
  toggleHeaderRow,
  toggleHeaderColumn,
  toggleHeaderCell
} from 'prosemirror-tables';
import { keymap } from 'prosemirror-keymap';
import { Plugin } from 'prosemirror-state';

/**
 * Creates a plugin for table functionality including:
 * - Column resizing
 * - Cell selection
 * - Table editing
 * - Table navigation keyboard shortcuts
 * 
 * @returns Combined table plugins array
 */
export function createTablePlugins(): Plugin[] {
  // Create column resizing plugin with proper configuration
  const columnResizingPlugin = columnResizing({
    // Make the table columns maintain their relative widths by default
    handleWidth: 5,
    cellMinWidth: 40,
    // Use percentages for table widths
    lastColumnResizable: true
  });

  // Create keyboard shortcuts for table navigation and manipulation
  const tableKeymap = keymap({
    // Navigation
    "Tab": goToNextCell(1),
    "Shift-Tab": goToNextCell(-1),

    // Shortcuts for table manipulation
    "Mod-Shift-t": addRowAfter,
    "Mod-Alt-t": addRowBefore,
    "Mod-Shift-y": addColumnAfter,
    "Mod-Alt-y": addColumnBefore,
    "Mod-Shift-d": deleteRow,
    "Mod-Alt-d": deleteColumn,
    "Mod-Shift-m": mergeCells,
    "Mod-Alt-m": splitCell,
    "Mod-Shift-h": toggleHeaderRow,
    "Mod-Alt-h": toggleHeaderColumn
  });
  
  // Create the main table editing plugin
  const tableEditingPlugin = tableEditing();

  // Return all table plugins
  return [
    columnResizingPlugin,
    tableKeymap,
    tableEditingPlugin
  ];
}

/**
 * Creates menu items for table manipulation
 */
export const tableMenuItems = {
  // Row operations
  addRowBefore: { command: addRowBefore, icon: 'row-insert-before', label: 'Insert row before' },
  addRowAfter: { command: addRowAfter, icon: 'row-insert-after', label: 'Insert row after' },
  deleteRow: { command: deleteRow, icon: 'row-delete', label: 'Delete row' },

  // Column operations
  addColumnBefore: { command: addColumnBefore, icon: 'column-insert-before', label: 'Insert column before' },
  addColumnAfter: { command: addColumnAfter, icon: 'column-insert-after', label: 'Insert column after' },
  deleteColumn: { command: deleteColumn, icon: 'column-delete', label: 'Delete column' },

  // Cell operations
  mergeCells: { command: mergeCells, icon: 'cells-merge', label: 'Merge cells' },
  splitCell: { command: splitCell, icon: 'cell-split', label: 'Split cell' },

  // Header operations
  toggleHeaderRow: { command: toggleHeaderRow, icon: 'header-row', label: 'Toggle header row' },
  toggleHeaderColumn: { command: toggleHeaderColumn, icon: 'header-column', label: 'Toggle header column' },
  toggleHeaderCell: { command: toggleHeaderCell, icon: 'header-cell', label: 'Toggle header cell' },
};

// Helper function to check if a command can be executed in the current context
export function canExecuteTableCommand(command, state) {
  return command(state);
}
