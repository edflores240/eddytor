import { BaseCommand, CommandContext, CommandResult } from '../../core/Command';
import { Node as ProseMirrorNode, NodeType, Schema, Fragment } from 'prosemirror-model';
import { wrapInList, liftListItem, splitListItem, sinkListItem } from 'prosemirror-schema-list';
import { Transaction, EditorState, TextSelection, NodeSelection, Command as ProseMirrorCommand, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { schema, isList, isListItem, canBeInList, createListItem } from '../../schema';

type ListType = 'bullet' | 'ordered' | 'checklist';

// Helper function to safely execute ProseMirror commands
function executeCommand(
  state: EditorState,
  dispatch: ((tr: Transaction) => void) | undefined,
  command: (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean
): boolean {
  return command(state, dispatch || undefined);
}

// Helper function to check if cursor is in a list
function isInList(state: EditorState): boolean {
  const { $from } = state.selection;
  const listItemType = state.schema.nodes.list_item;
  const checklistItemType = state.schema.nodes.checklist_item;
  
  if (!listItemType && !checklistItemType) return false;
  
  // Check if we're inside a list item or checklist item
  for (let i = $from.depth; i > 0; i--) {
    const nodeType = $from.node(i).type;
    if (nodeType === listItemType || nodeType === checklistItemType) {
      return true;
    }
  }
  return false;
}

// Helper function to check if cursor is in a checklist
function isInChecklist(state: EditorState): boolean {
  const { $from } = state.selection;
  const checklistItemType = state.schema.nodes.checklist_item;
  
  if (!checklistItemType) return false;
  
  // Check if we're inside a checklist item
  for (let i = $from.depth; i > 0; i--) {
    if ($from.node(i).type === checklistItemType) {
      return true;
    }
  }
  return false;
}

// Helper function to check if current list item is empty
function isEmptyListItem(state: EditorState): boolean {
  const { $from } = state.selection;
  const listItemType = state.schema.nodes.list_item;
  const checklistItemType = state.schema.nodes.checklist_item;
  
  if (!listItemType && !checklistItemType) return false;
  
  // Find the list item or checklist item node
  for (let i = $from.depth; i > 0; i--) {
    const node = $from.node(i);
    if (node.type === listItemType || node.type === checklistItemType) {
      // Check if the item is empty (no content or only whitespace)
      const content = node.textContent.trim();
      return content === '';
    }
  }
  return false;
}

// Helper function to toggle checkbox state
function toggleCheckbox(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const { $from } = state.selection;
  const checklistItemType = state.schema.nodes.checklist_item;
  
  if (!checklistItemType) return false;
  
  // Find the checklist item
  for (let i = $from.depth; i > 0; i--) {
    const node = $from.node(i);
    if (node.type === checklistItemType) {
      if (dispatch) {
        const pos = $from.before(i);
        const checked = node.attrs.checked;
        const itemId = node.attrs.id;
        const tr = state.tr;
        
        // Apply 'checking' class for animation
        if (!checked) {
          // Use the specific item ID to target only this checkbox
          const checkboxContainer = document.querySelector(
            `.checklist-checkbox-container[data-id="${itemId}"]`
          ) as HTMLElement | null;
          
          if (checkboxContainer) {
            checkboxContainer.classList.add('checking');
            setTimeout(() => checkboxContainer.classList.remove('checking'), 300);
            
            // Also update the checkbox input checked state
            const checkboxInput = checkboxContainer.querySelector('input[type="checkbox"]');
            if (checkboxInput) {
              (checkboxInput as HTMLInputElement).checked = true;
            }
          }
        }
        
        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          checked: !checked
        });
        
        dispatch(tr);
      }
      return true;
    }
  }
  return false;
}

// Helper function to exit list by converting to paragraph
function exitList(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const { $from } = state.selection;
  const listItemType = state.schema.nodes.list_item;
  const checklistItemType = state.schema.nodes.checklist_item;
  const paragraphType = state.schema.nodes.paragraph;
  
  if ((!listItemType && !checklistItemType) || !paragraphType) return false;
  
  // Find the list item position
  let listItemPos = -1;
  let listItemDepth = -1;
  
  for (let i = $from.depth; i > 0; i--) {
    const nodeType = $from.node(i).type;
    if (nodeType === listItemType || nodeType === checklistItemType) {
      listItemPos = $from.before(i);
      listItemDepth = i;
      break;
    }
  }
  
  if (listItemPos === -1) return false;
  
  if (dispatch) {
    const tr = state.tr;
    
    // Create a new paragraph node
    const paragraph = paragraphType.create();
    
    // Replace the list item with a paragraph
    tr.replaceWith(listItemPos, $from.after(listItemDepth), paragraph);
    
    // Set cursor inside the new paragraph
    const newPos = listItemPos + 1;
    tr.setSelection(TextSelection.create(tr.doc, newPos));
    
    dispatch(tr);
  }
  
  return true;
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
    const { selection } = state;
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
      
      // Check if we're already in a list item
      if (isListItem($from.parent.type)) {
        // If already in a list, toggle the list type
        const inBulletList = $from.node(-1).type === schema.nodes.bullet_list;
        if (inBulletList) {
          // Toggle off the list
          const liftCommand = liftListItem(schema.nodes.list_item);
          const success = executeCommand(state, dispatch, liftCommand);
          return { success, message: success ? '' : 'Could not toggle off list' };
        }
      }
      
      // Create a new bullet list
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
    const { selection } = state;
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
      
      // Check if we're already in a list item
      if (isListItem($from.parent.type)) {
        // If already in an ordered list, toggle the list type
        const inOrderedList = $from.node(-1).type === schema.nodes.ordered_list;
        if (inOrderedList) {
          // Toggle off the list
          const liftCommand = liftListItem(schema.nodes.list_item);
          const success = executeCommand(state, dispatch, liftCommand);
          return { success, message: success ? '' : 'Could not toggle off list' };
        }
      }
      
      // Create a new ordered list
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

export class ChecklistCommand extends BaseCommand {
  constructor() {
    super(
      'checklist',
      'Checklist',
      'Create a checklist with checkboxes',
      'check-square',
      ['checklist', 'checkbox', 'todo', 'task']
    );
  }

  async execute(context: CommandContext): Promise<CommandResult> {
    const { view } = context;
    const { state, dispatch } = view;
    const { selection } = state;
    const { $from, $to } = selection;
    const range = $from.blockRange($to);

    if (!range) {
      return { success: false, message: 'No valid range for checklist' };
    }

    try {
      const checklistNode = schema.nodes.checklist;
      const checklistItemType = schema.nodes.checklist_item;
      
      if (!checklistNode || !checklistItemType) {
        return { success: false, message: 'Checklist node type not found in schema' };
      }
      
      // Check if we're already in a checklist
      if ($from.parent.type === checklistItemType) {
        // If already in a checklist, toggle off
        const inChecklist = $from.node(-1).type === checklistNode;
        if (inChecklist) {
          // Toggle off the checklist
          const liftCommand = liftListItem(checklistItemType);
          const success = executeCommand(state, dispatch, liftCommand);
          return { success, message: success ? '' : 'Could not toggle off checklist' };
        }
      }
      
      // Create a new checklist
      const command = wrapInList(checklistNode);
      const success = executeCommand(state, dispatch, command);
      return { success, message: success ? '' : 'Could not wrap in checklist' };
    } catch (error) {
      const errorMessage = `Failed to create checklist: ${error instanceof Error ? error.message : String(error)}`;
      console.error('Error executing checklist command:', errorMessage);
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

export function handleEnterKey(
  view: { state: EditorState; dispatch: (tr: Transaction) => void },
  event: KeyboardEvent
): boolean {
  if (!view?.state?.schema) return false;
  
  const { state, dispatch } = view;
  
  // Check if we're in a list
  if (!isInList(state)) return false;
  
  event.preventDefault();
  
  const listItemType = state.schema.nodes.list_item;
  const checklistItemType = state.schema.nodes.checklist_item;
  
  if (!listItemType && !checklistItemType) return false;
  
  // Determine which type of item we're in
  const currentItemType = isInChecklist(state) ? checklistItemType : listItemType;
  
  // If the current list item is empty, behave like Shift+Tab (lift/outdent)
  if (isEmptyListItem(state)) {
    console.log('Enter on empty list item: executing lift command');
    const liftCommand = liftListItem(currentItemType);
    return executeCommand(state, dispatch, liftCommand);
  }
  
  // Otherwise, split the list item (create new list item)
  const splitCommand = splitListItem(currentItemType);
  return executeCommand(state, dispatch, splitCommand);
}

// Enhanced Tab key handler for lists
export function handleTabKey(
  view: { state: EditorState; dispatch: (tr: Transaction) => void },
  event: KeyboardEvent
): boolean {
  if (!view?.state?.schema) return false;
  
  const { state, dispatch } = view;
  
  // Only handle tab if we're in a list
  if (!isInList(state)) return false;
  
  const listItemType = state.schema.nodes.list_item;
  const checklistItemType = state.schema.nodes.checklist_item;
  
  if (!listItemType && !checklistItemType) return false;

  // Determine which type of item we're in
  const currentItemType = isInChecklist(state) ? checklistItemType : listItemType;

  // Handle tab key
  if (event.key === 'Tab') {
    event.preventDefault();
    
    if (event.shiftKey) {
      // Shift+Tab to outdent (lift list item)
      const liftCommand = liftListItem(currentItemType);
      return executeCommand(state, dispatch, liftCommand);
    } else {
      // Tab to indent (sink list item)
      const sinkCommand = sinkListItem(currentItemType);
      return executeCommand(state, dispatch, sinkCommand);
    }
  }
  
  return false;
}

// Space key handler for checkboxes
export function handleSpaceKey(
  view: { state: EditorState; dispatch: (tr: Transaction) => void },
  event: KeyboardEvent
): boolean {
  if (!view?.state?.schema) return false;
  
  const { state, dispatch } = view;
  
  // Only handle space if we're in a checklist and at the beginning of the item
  if (!isInChecklist(state)) return false;
  
  const { $from } = state.selection;
  
  // Check if cursor is at the very beginning of the checklist item content
  const checklistItemType = state.schema.nodes.checklist_item;
  if (!checklistItemType) return false;
  
  // Find the checklist item
  for (let i = $from.depth; i > 0; i--) {
    const node = $from.node(i);
    if (node.type === checklistItemType) {
      const itemStart = $from.start(i);
      // Only toggle if cursor is at the very beginning of the item
      if ($from.pos === itemStart) {
        event.preventDefault();
        return toggleCheckbox(state, dispatch);
      }
      break;
    }
  }
  
  return false;
}

// Comprehensive key handler that combines Enter, Tab, and Space logic
export function handleListKeys(
  view: { state: EditorState; dispatch: (tr: Transaction) => void },
  event: KeyboardEvent
): boolean {
  // Handle Enter key
  if (event.key === 'Enter') {
    return handleEnterKey(view, event);
  }
  
  // Handle Tab key
  if (event.key === 'Tab') {
    return handleTabKey(view, event);
  }
  
  // Handle Space key for checkbox toggle
  if (event.key === ' ') {
    return handleSpaceKey(view, event);
  }
  
  return false;
}

// Create a ProseMirror keymap for lists
export function createListKeymap(schema: Schema) {
  const listItemType = schema.nodes.list_item;
  const checklistItemType = schema.nodes.checklist_item;
  
  if (!listItemType && !checklistItemType) return {};
  
  return {
    'Enter': (state: EditorState, dispatch?: (tr: Transaction) => void) => {
      // Check if we're in a list
      if (!isInList(state)) return false;
      
      const currentItemType = isInChecklist(state) ? checklistItemType : listItemType;
      
      // If the current list item is empty, behave like Shift+Tab (lift)
      if (isEmptyListItem(state)) {
        console.log('Keymap Enter on empty list item: executing lift command');
        const liftCommand = liftListItem(currentItemType);
        return executeCommand(state, dispatch, liftCommand);
      }
      
      // Otherwise, split the list item
      const splitCommand = splitListItem(currentItemType);
      return executeCommand(state, dispatch, splitCommand);
    },
    
    'Tab': (state: EditorState, dispatch?: (tr: Transaction) => void) => {
      // Only handle tab if we're in a list
      if (!isInList(state)) return false;
      
      const currentItemType = isInChecklist(state) ? checklistItemType : listItemType;
      
      // Indent (sink list item)
      const sinkCommand = sinkListItem(currentItemType);
      return executeCommand(state, dispatch, sinkCommand);
    },
    
    'Shift-Tab': (state: EditorState, dispatch?: (tr: Transaction) => void) => {
      // Only handle shift-tab if we're in a list
      if (!isInList(state)) return false;
      
      const currentItemType = isInChecklist(state) ? checklistItemType : listItemType;
      
      // Outdent (lift list item)
      const liftCommand = liftListItem(currentItemType);
      return executeCommand(state, dispatch, liftCommand);
    },
    
    'Space': (state: EditorState, dispatch?: (tr: Transaction) => void) => {
      // Only handle space for checkbox toggle
      if (!isInChecklist(state)) return false;
      
      const { $from } = state.selection;
      
      // Check if cursor is at the very beginning of the checklist item content
      if (checklistItemType) {
        for (let i = $from.depth; i > 0; i--) {
          const node = $from.node(i);
          if (node.type === checklistItemType) {
            const itemStart = $from.start(i);
            // Only toggle if cursor is at the very beginning of the item
            if ($from.pos === itemStart) {
              return toggleCheckbox(state, dispatch);
            }
            break;
          }
        }
      }
      
      return false;
    }
  };
}

// Create a base keymap that handles all list types
export function createEditorKeymap(schema: Schema) {
  const listItemType = schema.nodes.list_item;
  const checklistItemType = schema.nodes.checklist_item;
  
  return {
    'Enter': (state: EditorState, dispatch?: (tr: Transaction) => void) => {
      // Check if we're in a list
      if (!isInList(state)) return false;
      
      const currentItemType = isInChecklist(state) ? checklistItemType : listItemType;
      if (!currentItemType) return false;
      
      // If the current list item is empty, behave like Shift+Tab (lift)
      if (isEmptyListItem(state)) {
        console.log('Editor keymap Enter on empty list item: executing lift command');
        const liftCommand = liftListItem(currentItemType);
        return executeCommand(state, dispatch, liftCommand);
      }
      
      // Otherwise, split the list item
      const splitCommand = splitListItem(currentItemType);
      return executeCommand(state, dispatch, splitCommand);
    }
  };
}

// Enhanced DOM-level tab handler that works with ProseMirror
export function setupEditorTabHandling(editorView: EditorView) {
  const editorDom = editorView.dom as HTMLElement;
  const schema = editorView.state.schema;
  const listItemType = schema.nodes.list_item;
  const checklistItemType = schema.nodes.checklist_item;
  
  // Handle keydown at DOM level with high priority
  const handleKeyDown = (event: KeyboardEvent) => {
    // Only handle if the editor is the active element or contains the active element
    if (!editorDom.contains(document.activeElement) && document.activeElement !== editorDom) {
      return;
    }
    
    const { state, dispatch } = editorView;
    
    if (event.key === 'Tab') {
      console.log('Tab key detected, in list:', isInList(state));
      
      // Always prevent browser tab navigation when editor is focused
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      
      if (isInList(state)) {
        const currentItemType = isInChecklist(state) ? checklistItemType : listItemType;
        
        if (currentItemType) {
          if (event.shiftKey) {
            // Shift+Tab: Outdent (lift list item)
            console.log('Executing lift command');
            const liftCommand = liftListItem(currentItemType);
            const success = executeCommand(state, dispatch, liftCommand);
            console.log('Lift command result:', success);
          } else {
            // Tab: Indent (sink list item)
            console.log('Executing sink command');
            const sinkCommand = sinkListItem(currentItemType);
            const success = executeCommand(state, dispatch, sinkCommand);
            console.log('Sink command result:', success);
          }
        }
      } else {
        console.log('Not in list, tab key consumed');
        // Not in a list, but still consume the tab to prevent focus change
      }
      
      return false;
    }
  };
  
  // Add event listener with capture: true for highest priority
  document.addEventListener('keydown', handleKeyDown, { capture: true });
  
  // Also add directly to editor DOM as backup
  editorDom.addEventListener('keydown', handleKeyDown, { capture: true });
  
  return () => {
    document.removeEventListener('keydown', handleKeyDown, { capture: true });
    editorDom.removeEventListener('keydown', handleKeyDown, { capture: true });
  };
}

// Enhanced ProseMirror plugin that handles all list types
export function createTabHandlingPlugin(schema: Schema) {
  const listItemType = schema.nodes.list_item;
  const checklistItemType = schema.nodes.checklist_item;
  
  return new Plugin({
    props: {
      handleKeyDown(view: EditorView, event: KeyboardEvent): boolean {
        if (event.key === 'Tab') {
          console.log('Plugin: Tab key detected, in list:', isInList(view.state));
          
          // Always prevent browser tab navigation
          event.preventDefault();
          event.stopPropagation();
          
          const { state, dispatch } = view;
          
          if (isInList(state)) {
            const currentItemType = isInChecklist(state) ? checklistItemType : listItemType;
            
            if (currentItemType) {
              if (event.shiftKey) {
                // Shift+Tab: Outdent (lift list item)
                console.log('Plugin: Executing lift command');
                const liftCommand = liftListItem(currentItemType);
                const success = liftCommand(state, dispatch);
                console.log('Plugin: Lift command result:', success);
                return true;
              } else {
                // Tab: Indent (sink list item)  
                console.log('Plugin: Executing sink command');
                const sinkCommand = sinkListItem(currentItemType);
                const success = sinkCommand(state, dispatch);
                console.log('Plugin: Sink command result:', success);
                return true;
              }
            }
          } else {
            console.log('Plugin: Not in list, tab key consumed');
            // Not in a list, but still consume the tab
            return true;
          }
        }
        
        // Handle Space for checkbox toggle
        if (event.key === ' ' && isInChecklist(view.state)) {
          const { state, dispatch } = view;
          const { $from } = state.selection;
          
          if (checklistItemType) {
            for (let i = $from.depth; i > 0; i--) {
              const node = $from.node(i);
              if (node.type === checklistItemType) {
                const itemStart = $from.start(i);
                if ($from.pos === itemStart) {
                  event.preventDefault();
                  event.stopPropagation();
                  return toggleCheckbox(state, dispatch);
                }
                break;
              }
            }
          }
        }
        
        return false;
      }
    }
  });
}

export function createCheckboxPlugin(): Plugin {
  return new Plugin({
    props: {
      handleDOMEvents: {
        click: (view, event) => {
          const target = event.target as HTMLElement;
          
          // Check for clicks on checkbox-related elements
          if (target.matches('.checklist-checkbox-input') || 
              target.matches('.checklist-checkbox-container')) {
            
            console.log('Checkbox UI clicked:', target);
            
            // Find the checklist item
            const listItem = target.closest('.checklist-item');
            if (!listItem) {
              console.log('No checklist item found');
              return false;
            }
            
            // Get item ID
            const itemId = listItem.getAttribute('data-id');
            if (!itemId) {
              console.log('No item ID found');
              return false;
            }
            
            // Prevent default to avoid ProseMirror selection changes
            event.preventDefault();
            event.stopPropagation();
            
            console.log('Processing checklist item:', itemId);
            
            // Find node in document
            const { state } = view;
            let foundPos = -1;
            let foundNode: any = null; // Type as any to avoid TS errors with attrs
            
            state.doc.descendants((node, pos) => {
              // Check both the node type name and the data-id attribute
              if (node.type.name === 'checklist_item' && node.attrs && node.attrs.id === itemId) {
                foundPos = pos;
                foundNode = node;
                return false;
              }
              return true;
            });
            
            if (foundPos >= 0 && foundNode) {
              // Get current checked state
              const isChecked = foundNode.attrs.checked === true;
              
              // Toggle checked state
              console.log(`Toggling checked state from ${isChecked} to ${!isChecked}`);
              
              // Apply the animation class
              const checkboxContainer = listItem.querySelector('.checklist-checkbox-container');
              if (checkboxContainer && !isChecked) {
                checkboxContainer.classList.add('checking');
                setTimeout(() => checkboxContainer.classList.remove('checking'), 300);
              }
              
              // Update input's checked property immediately
              const input = listItem.querySelector('input[type="checkbox"]');
              if (input) {
                (input as HTMLInputElement).checked = !isChecked;
              }
              
              // Update data-checked attribute immediately for CSS
              listItem.setAttribute('data-checked', (!isChecked).toString());
              
              // Also toggle checked class for backward compatibility
              if (!isChecked) {
                listItem.classList.add('checked');
              } else {
                listItem.classList.remove('checked');
              }
              
              // Create and dispatch transaction
              const tr = state.tr.setNodeMarkup(foundPos, null, {
                ...foundNode.attrs,
                checked: !isChecked
              });
              
              view.dispatch(tr);
              return true;
            }
          }
          
          return false;
        }
      }
    }
  });
}

// For integration with your existing SlashMenu component
export function enhanceSlashMenuKeyHandling() {
  return {
    // Add this to your SlashMenu's handleKeydown function
    handleListKeyInMenu: (event: KeyboardEvent, view: { state: EditorState; dispatch: (tr: Transaction) => void }) => {
      // If slash menu is not visible and we're in a list, handle list keys
      if (event.key === 'Tab' && isInList(view.state)) {
        event.preventDefault();
        event.stopPropagation();
        return handleTabKey(view, event);
      }
      
      if (event.key === 'Enter' && isInList(view.state)) {
        // Only handle Enter if slash menu is not showing
        const slashMenuVisible = false; // You'll need to pass this from your component
        if (!slashMenuVisible) {
          event.preventDefault();
          event.stopPropagation();
          return handleEnterKey(view, event);
        }
      }
      
      if (event.key === ' ' && isInChecklist(view.state)) {
        // Only handle Space if slash menu is not showing
        const slashMenuVisible = false; // You'll need to pass this from your component
        if (!slashMenuVisible) {
          event.preventDefault();
          event.stopPropagation();
          return handleSpaceKey(view, event);
        }
      }
      
      return false;
    }
  };
}