import { keymap } from "prosemirror-keymap";
import { TextSelection } from "prosemirror-state";

export function exitCodeBlockAfterTripleEnter(schema) {
  return keymap({
    Enter: (state, dispatch, view) => {
      const { $from } = state.selection;
      const parent = $from.parent;

      // Only handle inside code_block
      if (parent.type !== schema.nodes.code_block) return false;

      const text = parent.textContent;
      const beforeCursor = text.slice(0, $from.parentOffset);

      // Count how many trailing newlines are before the cursor
      const trailingNewlines = beforeCursor.match(/\n*$/)?.[0].length || 0;

      if (trailingNewlines >= 2) {
        // Means this is the 3rd Enter → exit code block
        if (dispatch) {
          const { tr } = state;

          // Insert a paragraph after the code_block
          const posAfter = $from.after(); 
          const paragraph = schema.nodes.paragraph.create();

          tr.insert(posAfter, paragraph);
          tr.setSelection(TextSelection.near(tr.doc.resolve(posAfter + 1)));
          dispatch(tr.scrollIntoView());
        }
        return true;
      }

      // Otherwise, let Enter behave normally (insert newline)
      return false;
    },
  });
}

