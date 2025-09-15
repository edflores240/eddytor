import { BaseCommand, CommandContext, CommandResult } from '../../core/Command';
import { toggleMark } from 'prosemirror-commands';
import { schema } from '../../schema';

export class BoldCommand extends BaseCommand {
  constructor() {
    super('bold', 'Bold', 'Make text bold', 'bold', ['bold', 'strong']);
  }

  async execute(context: CommandContext): Promise<CommandResult> {
    const { view } = context;
    if (!view) return { success: false };
    
    const markType = schema.marks.strong;
    return { 
      success: toggleMark(markType)(view.state, view.dispatch) 
    };
  }

  canExecute(context: CommandContext): boolean {
    const { state } = context;
    if (!state) return false;
    return toggleMark(schema.marks.strong)(state);
  }
}

export class ItalicCommand extends BaseCommand {
  constructor() {
    super('italic', 'Italic', 'Make text italic', 'italic', ['italic', 'em']);
  }

  async execute(context: CommandContext): Promise<CommandResult> {
    const { view } = context;
    if (!view) return { success: false };
    
    const markType = schema.marks.em;
    return { 
      success: toggleMark(markType)(view.state, view.dispatch) 
    };
  }

  canExecute(context: CommandContext): boolean {
    const { state } = context;
    if (!state) return false;
    return toggleMark(schema.marks.em)(state);
  }
}

export class CodeCommand extends BaseCommand {
  constructor() {
    super('code', 'Code', 'Format as code', 'code', ['code', 'monospace']);
  }

  async execute(context: CommandContext): Promise<CommandResult> {
    const { view } = context;
    if (!view) return { success: false };
    
    const markType = schema.marks.code;
    return { 
      success: toggleMark(markType)(view.state, view.dispatch) 
    };
  }

  canExecute(context: CommandContext): boolean {
    const { state } = context;
    if (!state) return false;
    return toggleMark(schema.marks.code)(state);
  }
}
