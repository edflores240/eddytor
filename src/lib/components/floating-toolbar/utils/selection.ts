// src/lib/components/floating-toolbar/utils/selection.ts
import type { EditorState } from 'prosemirror-state';

export function isMarkActive(
  state: EditorState, 
  markType: string, 
  attrs: Record<string, any> = {}
): boolean {
  const { from, to, empty } = state.selection;
  const mark = state.schema.marks[markType];
  if (!mark) return false;
  
  const hasMark = (m: any) => {
    if (m.type !== mark) return false;
    // If no specific attributes are provided, just check for the mark type
    if (Object.keys(attrs).length === 0) return true;
    // Otherwise, check if all provided attributes match
    return Object.entries(attrs).every(([key, value]) => m.attrs[key] === value);
  };
  
  if (empty) {
    return !!state.selection.$from.marks().some(hasMark);
  }
  
  // For ranges, we need to check if any mark in the range matches
  let found = false;
  state.doc.nodesBetween(from, to, (node) => {
    if (node.marks.some(hasMark)) {
      found = true;
      return false; // Stop traversal
    }
    return !found;
  });
  
  return found;
}

export function isNodeActive(state: EditorState, nodeType: string, attrs = {}): boolean {
  const { $from, to } = state.selection;
  const node = $from.node($from.depth);
  return node && node.type.name === nodeType && Object.entries(attrs).every(([k, v]) => node.attrs[k] === v);
}