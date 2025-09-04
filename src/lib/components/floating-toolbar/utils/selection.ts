// src/lib/components/floating-toolbar/utils/selection.ts
import type { EditorState } from 'prosemirror-state';

export function isMarkActive(state: EditorState, markType: string): boolean {
  const { from, to, empty } = state.selection;
  const mark = state.schema.marks[markType];
  if (!mark) return false;
  
  if (empty) {
    return !!state.selection.$from.marks().some(m => m.type === mark);
  }
  
  return state.doc.rangeHasMark(from, to, mark);
}

export function isNodeActive(state: EditorState, nodeType: string, attrs = {}): boolean {
  const { $from, to } = state.selection;
  const node = $from.node($from.depth);
  return node && node.type.name === nodeType && Object.entries(attrs).every(([k, v]) => node.attrs[k] === v);
}