import { Command, BaseCommand, CommandContext, CommandResult } from './Command';

export class CommandRegistry {
  private static instance: CommandRegistry;
  private commands: Map<string, Command> = new Map();

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): CommandRegistry {
    if (!CommandRegistry.instance) {
      CommandRegistry.instance = new CommandRegistry();
    }
    return CommandRegistry.instance;
  }

  /**
   * Register a single command
   */
  public register(command: Command): void {
    if (this.commands.has(command.id)) {
      console.warn(`Command with id '${command.id}' is already registered.`);
      return;
    }
    console.log(`Registering command: ${command.id}`);
    this.commands.set(command.id, command);
  }

  /**
   * Register multiple commands at once
   */
  public registerAll(commands: Command[]): void {
    commands.forEach(command => this.register(command));
  }

  /**
   * Get a command by its ID
   */
  public getCommand(id: string): Command | undefined {
    const command = this.commands.get(id);
    if (!command) {
      console.warn(`Command not found: ${id}. Available commands:`, Array.from(this.commands.keys()));
    }
    return command;
  }

  /**
   * Find commands that match the given search term
   */
  public searchCommands(searchTerm: string): Command[] {
    const term = searchTerm.toLowerCase();
    return Array.from(this.commands.values()).filter(command => {
      return (
        command.name.toLowerCase().includes(term) ||
        command.keywords?.some(kw => kw.toLowerCase().includes(term)) ||
        command.description?.toLowerCase().includes(term)
      );
    });
  }

  /**
   * Execute a command by its ID
   */
  public async executeCommand(
    commandId: string,
    context: CommandContext
  ): Promise<CommandResult> {
    const command = this.getCommand(commandId);
    if (!command) {
      return {
        success: false,
        message: `Command '${commandId}' not found.`
      };
    }

    if (command.canExecute && !command.canExecute(context)) {
      return {
        success: false,
        message: `Command '${commandId}' cannot be executed in the current context.`
      };
    }

    try {
      return await command.execute(context);
    } catch (error) {
      console.error(`Error executing command '${commandId}':`, error);
      return {
        success: false,
        message: `Error executing command: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Get all registered commands
   */
  public getAllCommands(): Command[] {
    return Array.from(this.commands.values());
  }

  /**
   * Clear all registered commands
   */
  public clear(): void {
    this.commands.clear();
  }
}

// Export a singleton instance
export const commandRegistry = CommandRegistry.getInstance();