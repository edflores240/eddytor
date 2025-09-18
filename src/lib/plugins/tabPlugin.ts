import { Plugin } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema } from "prosemirror-model";
import { sinkListItem, liftListItem } from "prosemirror-schema-list";
import { goToNextCell } from "prosemirror-tables";

// Import helpers
import { isInList, isInChecklist, toggleCheckbox } from "../commands/lists/ListCommands";

export function createTabHandlingPlugin(schema: Schema) {
  const listItemType = schema.nodes.list_item;
  const checklistItemType = schema.nodes.checklist_item;

  return new Plugin({
    props: {
      handleKeyDown(view: EditorView, event: KeyboardEvent): boolean {
        if (event.key === "Tab") {
          console.log("Plugin: Tab key detected");

          // Always prevent browser tab navigation
          event.preventDefault();
          event.stopPropagation();

          const { state, dispatch } = view;

          // ✅ Case 1: Inside a table → move to next/previous cell
          if (goToNextCell(event.shiftKey ? -1 : 1)(state, dispatch)) {
            console.log("Plugin: Table cell navigation executed");
            return true;
          }

          // ✅ Case 2: Inside a list → indent/outdent
          if (isInList(state)) {
            const currentItemType = isInChecklist(state)
              ? checklistItemType
              : listItemType;

            if (currentItemType) {
              if (event.shiftKey) {
                console.log("Plugin: Executing lift command");
                const success = liftListItem(currentItemType)(state, dispatch);
                console.log("Plugin: Lift command result:", success);
                return true;
              } else {
                console.log("Plugin: Executing sink command");
                const success = sinkListItem(currentItemType)(state, dispatch);
                console.log("Plugin: Sink command result:", success);
                return true;
              }
            }
          }

          // ✅ Case 3: Not in list/table → consume tab but do nothing
          console.log("Plugin: Not in list/table, tab consumed");
          return true;
        }

        // ✅ Space toggles checklist items
        if (event.key === " " && isInChecklist(view.state)) {
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
      },
    },
  });
}
