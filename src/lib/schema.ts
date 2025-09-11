import { schema as baseSchema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { Schema } from 'prosemirror-model';

// Add list nodes to the basic schema
const nodes = addListNodes(baseSchema.spec.nodes, 'paragraph block*', 'block');
const marks = baseSchema.spec.marks;

// Create and export the custom schema
export const schema = new Schema({ nodes, marks });

// Export node and mark types for easier access
export const nodeTypes = schema.nodes;
export const markTypes = schema.marks;