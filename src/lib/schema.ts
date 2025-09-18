import { schema as baseSchema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { Schema, NodeType, Node, Fragment, NodeSpec, SchemaSpec, MarkSpec } from 'prosemirror-model';
import { Transaction } from 'prosemirror-state';
import { tableNodes } from 'prosemirror-tables';

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
    }),
    // Skip the wrapper and checkbox when parsing, only parse the content
    getContent: (node: HTMLElement, schema) => {
      const contentDiv = node.querySelector('.checklist-content');
      if (contentDiv) {
        return Fragment.fromJSON(schema, contentDiv.innerHTML);
      }
      return Fragment.empty;
    }
  }],
  toDOM: (node) => {
    const id = node.attrs.id || generateChecklistItemId();
    const isChecked = node.attrs.checked === true;
    
    return [
      'li',
      {
        'data-type': 'taskItem',
        'data-id': id,
        class: 'checklist-item'
      },
      // Wrap checkbox and label in a container to isolate them
      ['div', { class: 'checklist-checkbox-wrapper', contentEditable: 'false' },
        ['input', {
          type: 'checkbox',
          class: 'checklist-checkbox-input',
          id: `checkbox-${id}`,
        
          'data-id': id
        }],
        ['label', { 
          class: 'checklist-checkbox-container',
          contentEditable: 'false',
          'data-id': id,
          for: `checkbox-${id}`
        }]
      ],
      ['div', { class: 'checklist-content', contentEditable: 'true' }, 0]
    ];
  }
};
// Define custom marks
const customMarks: { [key: string]: MarkSpec } = {
  // Hyperlink mark
  link: {
    attrs: { 
      href: { default: '' },
      title: { default: null } 
    },
    // Set inclusive to true to ensure mark can span across nodes
    inclusive: true,
    // Render as proper <a> element with appropriate attributes
    toDOM: (mark) => ['a', { 
      href: mark.attrs.href,
      title: mark.attrs.title || undefined,
      class: 'editor-link',
      target: '_blank',
      rel: 'noopener noreferrer'
    }, 0],
    parseDOM: [{
      tag: 'a[href]',
      getAttrs: (node: HTMLElement) => ({
        href: node.getAttribute('href'),
        title: node.getAttribute('title')
      })
    }]
  },
  
  // Text color mark
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
  
  // Font size mark
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

// Define custom code_block with language support
const codeBlockSpec: NodeSpec = {
  content: "text*",
  marks: "",
  group: "block",
  code: true,
  defining: true,
  isolating: true,
  attrs: {
    language: { default: null }
  },
  parseDOM: [{
    tag: "pre",
    preserveWhitespace: "full",
    getAttrs: (node: HTMLElement) => ({
      language: node.getAttribute("data-language") || null
    })
  }],
  toDOM: node => [
    "pre",
    { class: "code-block", "data-language": node.attrs.language || null },
    ["code", {}, 0]
  ]
};

// Define horizontal line separator
const horizontalRuleSpec: NodeSpec = {
  group: "block",
  parseDOM: [{ tag: "hr" }],
  toDOM: () => ["hr", { class: "line-separator" }]
};

// Define callout node spec
const calloutSpec: NodeSpec = {
  content: "block+",
  group: "block",
  defining: true,
  attrs: {
    variant: { default: "info" } // info, tip, warning, critical
  },
  parseDOM: [{ 
    tag: "div[data-callout]", 
    getAttrs: (node: HTMLElement) => ({
      variant: node.getAttribute("data-variant") || "info"
    })
  }],
  toDOM: node => [
    "div", 
    { 
      "data-callout": "", 
      "data-variant": node.attrs.variant,
      "class": `callout callout-${node.attrs.variant}`
    }, 
    ["div", { class: "callout-icon" }],
    ["div", { class: "callout-content" }, 0]
  ]
};

// Define table node specifications with modern styling
const tableNodesSpecs = tableNodes({
  tableGroup: "block",
  cellContent: "paragraph block*",
  cellAttributes: {
    background: {
      default: null,
      getFromDOM(dom) {
        return dom.style.backgroundColor || null;
      },
      setDOMAttr(value, attrs) {
        if (value) {
          attrs.style = (attrs.style || "") + `background-color: ${value};`;
        }
      }
    },
    alignment: {
      default: 'left',
      getFromDOM(dom) {
        return dom.style.textAlign || 'left';
      },
      setDOMAttr(value, attrs) {
        if (value && value !== 'left') {
          attrs.style = (attrs.style || "") + `text-align: ${value};`;
        }
      }
    },
    width: {
      default: null,
      getFromDOM(dom) {
        return dom.style.width || null;
      },
      setDOMAttr(value, attrs) {
        if (value) {
          attrs.style = (attrs.style || "") + `width: ${value};`;
        }
      }
    }
  }
});

// Enhance table node specifications with modern styling
if (tableNodesSpecs.table) {
  tableNodesSpecs.table.toDOM = () => ["table", { class: "modern-table" }, ["tbody", 0]];
}

if (tableNodesSpecs.table_row) {
  tableNodesSpecs.table_row.toDOM = () => ["tr", 0];
}

if (tableNodesSpecs.table_cell && typeof tableNodesSpecs.table_cell.toDOM === 'function') {
  const originalToDOM = tableNodesSpecs.table_cell.toDOM;
  tableNodesSpecs.table_cell.toDOM = node => {
    const dom = originalToDOM(node);
    // We don't need to add special classes as the CSS already targets td elements
    return dom;
  };
}

if (tableNodesSpecs.table_header && typeof tableNodesSpecs.table_header.toDOM === 'function') {
  const originalToDOM = tableNodesSpecs.table_header.toDOM;
  tableNodesSpecs.table_header.toDOM = node => {
    const dom = originalToDOM(node);
    // We don't need to add special classes as the CSS already targets th elements
    return dom;
  };
}


// Add our custom nodes
const nodes = {
  ...baseNodes.toObject(),
  checklist: checklistNodeSpec,
  checklist_item: checklistItemSpec,
  code_block: codeBlockSpec,
  horizontal_rule: horizontalRuleSpec,
  callout: calloutSpec,
  
  // Add table nodes
  ...tableNodesSpecs
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

// Helper to create a horizontal line separator
export function createLineSeparator() {
  return schema.nodes.horizontal_rule.create();
}

// Helper to create a callout node
export function createCallout(variant: 'info' | 'tip' | 'warning' | 'critical' = 'info', content?: Node | Node[]) {
  // Create default content if none provided
  const defaultContent = schema.nodes.paragraph.create();
  
  // Use provided content or default
  const calloutContent = content || defaultContent;
  
  // Create and return the callout node
  return schema.nodes.callout.create({ variant }, calloutContent);
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

// Helper function to create a table
export function createTable(
  rows: number = 3, 
  cols: number = 3, 
  withHeaderRow: boolean = true,
  cellContent?: Node | Node[] | Fragment
): Node {
  // Default content for cells if none provided
  const defaultContent = schema.nodes.paragraph.create();
  const content = cellContent || defaultContent;

  // Create table rows
  const tableRows: Node[] = [];

  // Create header row if requested
  if (withHeaderRow) {
    const headerCells: Node[] = [];
    for (let col = 0; col < cols; col++) {
      headerCells.push(
        schema.nodes.table_header.create(null, content)
      );
    }
    tableRows.push(schema.nodes.table_row.create(null, headerCells));
    rows--; // Reduce regular row count by 1 since we added a header
  }

  // Create regular rows
  for (let row = 0; row < rows; row++) {
    const cells: Node[] = [];
    for (let col = 0; col < cols; col++) {
      cells.push(
        schema.nodes.table_cell.create(null, content)
      );
    }
    tableRows.push(schema.nodes.table_row.create(null, cells));
  }

  // Create and return the table
  return schema.nodes.table.create(null, tableRows);
}

// Helper to check if a node is a table
export function isTable(type: NodeType | null | undefined): boolean {
  if (!type) return false;
  return type === schema.nodes.table;
}

// Helper to check if a node is a table row
export function isTableRow(type: NodeType | null | undefined): boolean {
  if (!type) return false;
  return type === schema.nodes.table_row;
}

// Helper to check if a node is a table cell or table header
export function isTableCell(type: NodeType | null | undefined): boolean {
  if (!type) return false;
  return type === schema.nodes.table_cell || type === schema.nodes.table_header;
}

// Helper to update a cell's attributes
export function updateTableCellAttrs(tr: Transaction, pos: number, attrs: {[key: string]: any}): Transaction {
  const node = tr.doc.nodeAt(pos);
  if (!node || !isTableCell(node.type)) return tr;
  
  return tr.setNodeMarkup(pos, undefined, {
    ...node.attrs,
    ...attrs
  });
}