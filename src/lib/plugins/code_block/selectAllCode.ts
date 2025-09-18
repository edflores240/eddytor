import { keymap } from "prosemirror-keymap";
import { TextSelection } from "prosemirror-state";
import { selectAll } from "prosemirror-commands";

function selectAllInsideCode(state, dispatch) {
  const { $from } = state.selection;
  const parent = $from.parent;

  if (parent.type.spec.code) {
    if (dispatch) {
      dispatch(
        state.tr.setSelection(
          TextSelection.create(state.doc, $from.start(), $from.end())
        )
      );
    }
    return true;
  }

  return false;
}

// 👇 Named export (matches your import in App.svelte)
export const selectAllCodePlugin = keymap({
  "Mod-a": (state, dispatch, view) => {
    if (selectAllInsideCode(state, dispatch)) return true;
    return selectAll(state, dispatch, view);
  }
});
