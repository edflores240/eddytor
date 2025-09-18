import { keymap } from "prosemirror-keymap";
import { clearFormatting } from "../../commands/text/ClearFormattingCommand";

/**
 * Create a plugin that adds keyboard shortcuts for clearing text formatting
 * Common shortcut is Ctrl+\ or Mod+\
 */
export function createClearFormattingShortcut() {
  return keymap({
    "Mod-\\": clearFormatting,
  });
}
