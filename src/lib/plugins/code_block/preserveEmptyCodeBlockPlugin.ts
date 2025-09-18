import { keymap } from "prosemirror-keymap";

export const preserveNonEmptyCodeBlockPlugin = keymap({
  Backspace: (state, dispatch, view) => {
    const { selection } = state;
    if (!selection.empty) return false;

    const { $from } = selection;
    const codeBlockNodeType = state.schema.nodes.code_block;
    if ($from.parent.type !== codeBlockNodeType) return false;

    // Text inside code block from ProseMirror’s doc
    const start = $from.start();
    const end = $from.end();
    let codeText = state.doc.textBetween(start, end, "\n", "\n").replace(/\u200B/g, "");
    const hasText = codeText.trim().length > 0;

    // Case 1: non-empty code block → block deletion
    if (hasText && $from.parentOffset === 0) {
      return true;
    }

    // Case 2: empty code block + cursor at start → delete the node
    if (!hasText && $from.parentOffset === 0) {
      if (dispatch) {
        const tr = state.tr.deleteRange($from.before(), $from.after());
        dispatch(tr.scrollIntoView());
      }
      return true;
    }

    return false; // otherwise, normal behavior
  }
});
