import { keymap } from "prosemirror-keymap";
import { insertLineSeparator } from "../../commands/text/LineSeparatorCommand";

/**
 * Create a plugin that adds keyboard shortcuts for inserting a line separator
 * Common shortcut is Ctrl+Shift+Minus or Ctrl+Shift+_
 */
export function createLineSeparatorShortcut() {
  return keymap({
    "Mod-Shift-_": insertLineSeparator,
    "Mod-Shift--": insertLineSeparator
  });
}
