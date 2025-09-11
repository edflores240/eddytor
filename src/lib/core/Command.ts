import { EditorView } from 'prosemirror-view';

export interface CommandContext {
  view: EditorView;
  // Add any additional context needed for commands
}

export interface CommandResult {
  success: boolean;
  message?: string; // Optional message for error or status
  // Add any additional result data
}

export interface Command {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  keywords?: string[];
  
  // Execute the command with the given context
  execute(context: CommandContext): CommandResult | Promise<CommandResult>;
  
  // Optional: Check if the command can be executed in the current context
  canExecute?(context: CommandContext): boolean;
}

// Base command implementation
export abstract class BaseCommand implements Command {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string = '',
    public readonly icon: string = '',
    public readonly keywords: string[] = []
  ) {}

  abstract execute(context: CommandContext): CommandResult | Promise<CommandResult>;

  canExecute(_context: CommandContext): boolean {
    return true; // Default implementation - override in subclasses
  }
}