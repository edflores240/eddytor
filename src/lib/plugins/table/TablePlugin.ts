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
  toggleHeaderCell,
  moveTableRow,
  moveTableColumn,
  TableMap
} from 'prosemirror-tables';
import { keymap } from 'prosemirror-keymap';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { createTableDragPlugin } from './TableDragPlugin';

/**
 * Creates a plugin for table functionality including:
 * - Column resizing
 * - Cell selection
 * - Table editing
 * - Table navigation keyboard shortcuts
 * - Row and column dragging
 * - Column numbers in headers
 * 
 * @returns Combined table plugins array
 */
export function createTablePlugins(): Plugin[] {
  // Create column resizing plugin with proper configuration
  const columnResizingPlugin = columnResizing({
    // Make the table columns maintain their relative widths by default
    handleWidth: 5,
    cellMinWidth: 100,    // Minimum cell width, increased to match our CSS
    lastColumnResizable: true
  }); 


  function safeAddRowBefore(state, dispatch, view) {
    const { $anchor } = state.selection;
  
    // Find table node & position
    let depth = $anchor.depth;
    let tablePos = null;
    let tableNode = null;
    while (depth > 0) {
      const node = $anchor.node(depth);
      if (node.type.name === "table") {
        tablePos = $anchor.before(depth);
        tableNode = node;
        break;
      }
      depth--;
    }
  
    if (!tableNode || tablePos === null) {
      return false; // not inside a table
    }
  
    const map = TableMap.get(tableNode);
    const tableStart = tablePos + 1;
    const cellIndex = $anchor.pos - tableStart;
    const cellRect = map.findCell(cellIndex);
  
    // 🚫 If current row is 0 (header row), block addRowBefore
    if (cellRect.row === 0) {
      return false;
    }
  
    // Otherwise, fallback to default command
    return addRowBefore(state, dispatch, view);
  }

  // Create keyboard shortcuts for table navigation and manipulation
  const tableKeymap = keymap({
    // Table navigation
    "Tab": goToNextCell(1),
    "Shift-Tab": goToNextCell(-1),

    // Shortcuts for table manipulation - using simple key combinations that won't conflict
    "Alt-ArrowUp": addRowBefore,       // Alt+Up: Add row before
    "Alt-ArrowDown": addRowAfter,     // Alt+Down: Add row after
    "Alt-ArrowLeft": addColumnBefore, // Alt+Left: Add column before
    "Alt-ArrowRight": addColumnAfter, // Alt+Right: Add column after
    "Alt-Delete": deleteRow,          // Alt+Delete: Delete row
    "Alt-Backspace": deleteColumn,    // Alt+Backspace: Delete column
    "Alt-m": mergeCells,              // Alt+m: Merge cells
    "Alt-s": splitCell               // Alt+s: Split cell
  });


  
  
  // Create the main table editing plugin
  const tableEditingPlugin = tableEditing();
  
  // Create table drag plugin for row/column dragging
  const tableDragPlugin = createTableDragPlugin();
  
  // Create plugin to add column numbers to table headers
  const tableColumnNumbersPlugin = new Plugin({
    key: new PluginKey('tableColumnNumbers'),
    props: {
      decorations(state) {
        const decorations: Decoration[] = [];
        const doc = state.doc;
        
        // Find all tables in the document
        doc.descendants((node, pos) => {
          if (node.type.name === 'table') {
            // Get table map to understand the structure
            const tableMap = TableMap.get(node);
            const headerCells: Array<{pos: number, node: any, colIndex: number}> = [];
            
            // Find all header cells in the first row
            for (let col = 0; col < tableMap.width; col++) {
              const cellPos = tableMap.map[col];
              const cellNode = node.nodeAt(cellPos);
              
              if (cellNode && cellNode.type.name === 'table_header') {
                headerCells.push({
                  pos: pos + 1 + cellPos,
                  node: cellNode,
                  colIndex: col
                });
              }
            }
            
            // Add data-column-index attribute to header cells
            headerCells.forEach(cell => {
              const columnNumber = cell.colIndex + 1;
              decorations.push(
                Decoration.node(cell.pos, cell.pos + cell.node.nodeSize, {
                  'data-column-index': columnNumber.toString()
                })
              );
            });
          }
          return true;
        });
        
        return DecorationSet.create(doc, decorations);
      }
    }
  });

  // Return all table plugins
  return [
    columnResizingPlugin,
   
    tableEditingPlugin,
    tableKeymap,
    tableDragPlugin,
    tableColumnNumbersPlugin
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
  moveRowUp: { command: (state, dispatch, view) => moveTableRow({ tr: state.tr, tablePos: findTablePosition(state), table: findTableNode(state), row: getSelectedRowIndex(state), direction: -1 })(state, dispatch, view), icon: 'move-up', label: 'Move row up' },
  moveRowDown: { command: (state, dispatch, view) => moveTableRow({ tr: state.tr, tablePos: findTablePosition(state), table: findTableNode(state), row: getSelectedRowIndex(state), direction: 1 })(state, dispatch, view), icon: 'move-down', label: 'Move row down' },

  // Column operations
  addColumnBefore: { command: addColumnBefore, icon: 'column-insert-before', label: 'Insert column before' },
  addColumnAfter: { command: addColumnAfter, icon: 'column-insert-after', label: 'Insert column after' },
  deleteColumn: { command: deleteColumn, icon: 'column-delete', label: 'Delete column' },
  moveColumnLeft: { command: (state, dispatch, view) => moveTableColumn({ tr: state.tr, tablePos: findTablePosition(state), table: findTableNode(state), column: getSelectedColumnIndex(state), direction: -1 })(state, dispatch, view), icon: 'move-left', label: 'Move column left' },
  moveColumnRight: { command: (state, dispatch, view) => moveTableColumn({ tr: state.tr, tablePos: findTablePosition(state), table: findTableNode(state), column: getSelectedColumnIndex(state), direction: 1 })(state, dispatch, view), icon: 'move-right', label: 'Move column right' },

  // Cell operations
  mergeCells: { command: mergeCells, icon: 'cells-merge', label: 'Merge cells' },
  splitCell: { command: splitCell, icon: 'cell-split', label: 'Split cell' },
};

/**
 * Helper function to find the table position
 */
function findTablePosition(state) {
  const { selection } = state;
  const { $anchor } = selection;
  
  let tablePos = null;
  let depth = $anchor.depth;
  
  while (depth > 0) {
    const node = $anchor.node(depth);
    if (node.type.name === 'table') {
      tablePos = $anchor.before(depth);
      break;
    }
    depth--;
  }
  
  return tablePos || 0;
}

/**
 * Helper function to find the table node
 */
function findTableNode(state) {
  const { selection } = state;
  const { $anchor } = selection;
  
  let tableNode = null;
  let depth = $anchor.depth;
  
  while (depth > 0) {
    const node = $anchor.node(depth);
    if (node.type.name === 'table') {
      tableNode = node;
      break;
    }
    depth--;
  }
  
  return tableNode;
}

/**
 * Helper function to get the index of the currently selected row
 */
function getSelectedRowIndex(state) {
  const { selection } = state;
  const { $anchor } = selection;
  
  // Find the cell and its position in the table
  let cellPos = null;
  let depth = $anchor.depth;
  
  // Find the cell node
  while (depth > 0) {
    const node = $anchor.node(depth);
    if (node.type.name === 'table_cell' || node.type.name === 'table_header') {
      cellPos = $anchor.before(depth);
      break;
    }
    depth--;
  }
  
  if (cellPos === null) return 0;
  
  // Find the table and get its map
  let tablePos = null;
  depth = $anchor.depth;
  
  while (depth > 0) {
    const node = $anchor.node(depth);
    if (node.type.name === 'table') {
      tablePos = $anchor.before(depth);
      break;
    }
    depth--;
  }
  
  if (tablePos === null) return 0;
  
  const table = $anchor.node(depth);
  const map = TableMap.get(table);
  const tableStart = tablePos + 1;
  
  // Calculate the row index
  const cellIndex = cellPos - tableStart;
  const cellRect = map.findCell(cellIndex);
  return Math.floor((cellRect as any).row);
}

/**
 * Helper function to get the index of the currently selected column
 */
function getSelectedColumnIndex(state) {
  const { selection } = state;
  const { $anchor } = selection;
  
  // Find the cell and its position in the table
  let cellPos = null;
  let depth = $anchor.depth;
  
  // Find the cell node
  while (depth > 0) {
    const node = $anchor.node(depth);
    if (node.type.name === 'table_cell' || node.type.name === 'table_header') {
      cellPos = $anchor.before(depth);
      break;
    }
    depth--;
  }
  
  if (cellPos === null) return 0;
  
  // Find the table and get its map
  let tablePos = null;
  depth = $anchor.depth;
  
  while (depth > 0) {
    const node = $anchor.node(depth);
    if (node.type.name === 'table') {
      tablePos = $anchor.before(depth);
      break;
    }
    depth--;
  }
  
  if (tablePos === null) return 0;
  
  const table = $anchor.node(depth);
  const map = TableMap.get(table);
  const tableStart = tablePos + 1;
  
  // Calculate the column index
  const cellIndex = cellPos - tableStart;
  const cellRect = map.findCell(cellIndex);
  return Math.floor((cellRect as any).col);
}

// Helper function to check if a command can be executed in the current context
export function canExecuteTableCommand(command, state) {
  return command(state);
}
