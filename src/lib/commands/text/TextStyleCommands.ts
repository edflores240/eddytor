import { BaseCommand, CommandContext, CommandResult } from '../../core/Command';
import { toggleMark } from 'prosemirror-commands';
import { schema } from '../../schema';

export class TextColorCommand extends BaseCommand {
  constructor() {
    super('textColor', 'Text Color', 'Change text color', 'palette', ['color']);
  }

  async execute(context: CommandContext): Promise<CommandResult> {
    const { view, color = '#000000' } = context;
    if (!view) return { success: false };
    
    const { state, dispatch } = view;
    const { from, to } = state.selection;
    const markType = schema.marks.textColor;
    
    if (markType.isInSet(state.storedMarks || state.selection.$from.marks())) {
      // If the mark exists with the same color, remove it
      if (markType.isInSet(state.storedMarks || state.selection.$from.marks())?.attrs.color === color) {
        if (dispatch) {
          const tr = state.tr.removeMark(from, to, markType);
          dispatch(tr);
        }
        return { success: true };
      }
    }
    
    // Otherwise, apply the mark with the new color
    if (dispatch) {
      const tr = state.tr.addMark(from, to, markType.create({ color }));
      dispatch(tr);
    }
    
    return { success: true };
  }

  canExecute(context: CommandContext): boolean {
    const { state } = context;
    return !!state && !state.selection.empty;
  }
}

export class FontSizeCommand extends BaseCommand {
  constructor() {
    super('fontSize', 'Font Size', 'Change font size', 'text-height', ['size']);
  }

  async execute(context: CommandContext): Promise<CommandResult> {
    const { view, size = '16px' } = context;
    if (!view) return { success: false };
    
    const { state, dispatch } = view;
    const { from, to } = state.selection;
    const markType = schema.marks.fontSize;
    
    if (markType.isInSet(state.storedMarks || state.selection.$from.marks())) {
      // If the mark exists with the same size, remove it
      if (markType.isInSet(state.storedMarks || state.selection.$from.marks())?.attrs.size === size) {
        if (dispatch) {
          const tr = state.tr.removeMark(from, to, markType);
          dispatch(tr);
        }
        return { success: true };
      }
    }
    
    // Otherwise, apply the mark with the new size
    if (dispatch) {
      // Ensure the size has a unit (px by default)
      const formattedSize = typeof size === 'number' ? `${size}px` : size;
      const tr = state.tr.addMark(from, to, markType.create({ size: formattedSize }));
      dispatch(tr);
    }
    
    return { success: true };
  }

  canExecute(context: CommandContext): boolean {
    const { state } = context;
    return !!state && !state.selection.empty;
  }
}
