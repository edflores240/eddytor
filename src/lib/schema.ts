import { schema as baseSchema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { Schema, NodeType, Node, Fragment, NodeSpec, SchemaSpec, MarkSpec } from 'prosemirror-model';
import { Transaction } from 'prosemirror-state';

// Generate a unique ID for each checklist item
let checklistItemCounter = 0;
function generateChecklistItemId() {
  return `checklist-item-${Date.now()}-${checklistItemCounter++}`;
}

// Define custom nodes for checklists
const checklistNodeSpec: NodeSpec = {
  content: 'checklist_item+',
  group: 'block',
  parseDOM: [{ tag: 'ul[data-type="taskList"]' }],
  toDOM: () => ['ul', { 'data-type': 'taskList', class: 'checklist' }, 0],
};

const checklistItemSpec: NodeSpec = {
  content: 'paragraph block*',
  defining: true,
  draggable: true,
  attrs: {
    checked: { default: false },
    id: { default: null }
  },
  parseDOM: [{
    tag: 'li[data-type="taskItem"]',
    getAttrs: (node: HTMLElement) => ({
      checked: node.getAttribute('data-checked') === 'true',
      id: node.getAttribute('data-id') || generateChecklistItemId()
    })
  }],
  toDOM: (node) => {
    const id = node.attrs.id || generateChecklistItemId();
    return [
      'li',
      {
        'data-type': 'taskItem',
        'data-checked': node.attrs.checked ? 'true' : 'false',
        'data-id': id,
        class: node.attrs.checked ? 'checklist-item checked' : 'checklist-item'
      },
      ['span', { 
        class: node.attrs.checked ? 'checklist-checkbox checked' : 'checklist-checkbox',
        contentEditable: 'false',
        'data-id': id,
        'data-checked': node.attrs.checked ? 'true' : 'false'
      }],
      ['div', { class: 'checklist-content' }, 0]
    ];
  }
};

// Define custom marks
const customMarks: { [key: string]: MarkSpec } = {
  textColor: {
    attrs: { color: { default: '#000000' } },
    toDOM: (mark) => ['span', { style: `color: ${mark.attrs.color}` }, 0],
    parseDOM: [{
      style: 'color',
      getAttrs: (value: string) => ({
        color: value
      })
    }]
  },
  fontSize: {
    attrs: { size: { default: '16px' } },
    toDOM: (mark) => ['span', { style: `font-size: ${mark.attrs.size}` }, 0],
    parseDOM: [{
      style: 'font-size',
      getAttrs: (value: string) => ({
        size: value
      })
    }]
  }
};

// Combine base marks with our custom marks
const marks = baseSchema.spec.marks ? {
  ...baseSchema.spec.marks.toObject(),
  ...customMarks
} : customMarks;

// Create a custom schema with list support and custom marks
const baseNodes = addListNodes(baseSchema.spec.nodes, 'paragraph block*', 'block');

// Add our custom checklist nodes
const nodes = {
  ...baseNodes.toObject(),
  checklist: checklistNodeSpec,
  checklist_item: checklistItemSpec
};

// Create the schema with our custom nodes and marks
export const schema = new Schema({
  nodes,
  marks: marks
} as SchemaSpec);

// Export node and mark types for easier access
export const nodeTypes = schema.nodes;
export const markTypes = schema.marks;

// Helper to check if a node is a list
export function isList(type: NodeType | null | undefined): boolean {
  if (!type) return false;
  return type === schema.nodes.bullet_list || 
         type === schema.nodes.ordered_list ||
         type === schema.nodes.checklist;
}

// Helper to check if a node is a list item
export function isListItem(type: NodeType | null | undefined): boolean {
  if (!type) return false;
  return type === schema.nodes.list_item || type === schema.nodes.checklist_item;
}

// Helper to check if a node is a checklist item
export function isChecklistItem(type: NodeType | null | undefined): boolean {
  if (!type) return false;
  return type === schema.nodes.checklist_item;
}

// Helper to create a list item with content
export function createListItem(content?: Node | Node[] | Fragment, checked = false) {
  if (checked) {
    return schema.nodes.checklist_item.create({ 
      checked, 
      id: generateChecklistItemId() 
    }, content);
  }
  return schema.nodes.list_item.create(null, content);
}

// Helper to create a list of the specified type
export function createList(type: 'bullet' | 'ordered' | 'checklist', items?: Node | Node[] | Fragment) {
  if (type === 'checklist') {
    return schema.nodes.checklist.create(null, items);
  }
  const listType = type === 'bullet' ? schema.nodes.bullet_list : schema.nodes.ordered_list;
  return listType.create(null, items);
}

// Helper to check if a node can be in a list
export function canBeInList(type: NodeType | null | undefined): boolean {
  if (!type || !type.spec.group) return false;
  return type.spec.group.split(' ').includes('block');
}

// Helper to toggle checklist item checked state
export function toggleChecklistItem(tr: Transaction, pos: number): Transaction {
  const node = tr.doc.nodeAt(pos);
  if (!node || !isChecklistItem(node.type)) return tr;
  
  return tr.setNodeMarkup(pos, undefined, {
    ...node.attrs,
    checked: !node.attrs.checked
  });
}