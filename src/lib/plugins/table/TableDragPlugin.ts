import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { moveTableRow, moveTableColumn, findTable } from 'prosemirror-tables';
import { findParentNodeOfType } from 'prosemirror-utils';

// Plugin key for table drag plugin
export const tableDragPluginKey = new PluginKey('tableDrag');

// Create a plugin for table row and column dragging
export function createTableDragPlugin() {
  let draggedRow: number | null = null;
  let draggedColumn: number | null = null;
  let targetRow: number | null = null;
  let targetColumn: number | null = null;
  let isDragging = false;

  return new Plugin({
    key: tableDragPluginKey,
    
    state: {
      init() {
        return {
          decorations: DecorationSet.empty,
          draggedRow: null,
          draggedColumn: null,
          targetRow: null,
          targetColumn: null,
          isDragging: false
        };
      },
      apply(tr, value, oldState, newState) {
        // Reset dragging state on any transaction that changes doc
        if (tr.docChanged) {
          return {
            decorations: DecorationSet.empty,
            draggedRow: null,
            draggedColumn: null,
            targetRow: null,
            targetColumn: null,
            isDragging: false
          };
        }
        
        // Get meta information from transaction
        const dragStart = tr.getMeta(tableDragPluginKey)?.dragStart;
        const dragMove = tr.getMeta(tableDragPluginKey)?.dragMove;
        const dragEnd = tr.getMeta(tableDragPluginKey)?.dragEnd;
        
        // Handle drag start
        if (dragStart) {
          const { row, column } = dragStart;
          return {
            decorations: createDragDecorations(newState, row, column),
            draggedRow: row,
            draggedColumn: column,
            targetRow: row,
            targetColumn: column,
            isDragging: true
          };
        }
        
        // Handle drag move
        if (dragMove && value.isDragging) {
          const { row, column } = dragMove;
          return {
            ...value,
            decorations: createDragDecorations(newState, value.draggedRow, value.draggedColumn, row, column),
            targetRow: row,
            targetColumn: column
          };
        }
        
        // Handle drag end
        if (dragEnd && value.isDragging) {
          return {
            decorations: DecorationSet.empty,
            draggedRow: null,
            draggedColumn: null,
            targetRow: null,
            targetColumn: null,
            isDragging: false
          };
        }
        
        return value;
      }
    },
    
    props: {
      decorations(state) {
        return this.getState(state).decorations;
      },
      
      // Handle mouse events for dragging
      handleDOMEvents: {
        mousedown(view, event) {
          // Only handle left mouse button
          if (event.button !== 0) return false;
          
          const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
          if (!pos) return false;
          
          const table = findTable(view.state.doc.resolve(pos.pos));
          if (!table) return false;
          
          // Check if we're clicking on a row or column handle
          // This would need to be implemented based on your table structure
          // For now, we'll just use this as a placeholder
          
          return false;
        }
      }
    },
    
    // Add commands for moving rows and columns
    view(editorView) {
      return {
        update(view, prevState) {
          // Update view if needed
        },
        
        destroy() {
          // Clean up if needed
        }
      };
    }
  });
}

// Helper function to create decorations for dragged rows/columns
function createDragDecorations(state, draggedRow, draggedColumn, targetRow = null, targetColumn = null) {
  const decorations: Decoration[] = [];
  
  // Find the table node
  const $pos = state.selection.$anchor;
  const table = findParentNodeOfType(state.schema.nodes.table)($pos);
  
  if (!table) return DecorationSet.empty;
  
  // Add decorations for dragged row
  if (draggedRow !== null) {
    // Add row decoration logic here
  }
  
  // Add decorations for dragged column
  if (draggedColumn !== null) {
    // Add column decoration logic here
  }
  
  return DecorationSet.create(state.doc, decorations);
}
