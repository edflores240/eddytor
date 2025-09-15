import { commandRegistry } from './CommandRegistry';
import { createHeading1Command, createHeading2Command, createHeading3Command } from '../commands';
import { createBulletListCommand, createOrderedListCommand, createChecklistCommand } from '../commands/lists';
import { registerTextCommands } from '../commands/text/registerTextCommands';

/**
 * Initialize and register all commands with the command registry.
 * This should be called during application startup.
 */
export function initializeCommands(): void {
  console.log('Initializing commands...');
  
  // Register text formatting commands
  registerTextCommands();
  
  // Register other commands
  const commands = [
    // Headings
    createHeading1Command(),
    createHeading2Command(),
    createHeading3Command(),
    
    // Lists
    createBulletListCommand(),
    createOrderedListCommand(),
    createChecklistCommand()
  ];
  
  console.log('Created commands:', JSON.stringify(commands.map(cmd => ({
    id: cmd.id,
    name: cmd.name,
    type: cmd.constructor.name
  })), null, 2));
  
  commandRegistry.registerAll(commands);
  
  // Verify registration
  const registeredCommands = commandRegistry.getAllCommands();
  console.log('Registered commands:', JSON.stringify(registeredCommands.map(cmd => ({
    id: cmd.id,
    name: cmd.name
  })), null, 2));

  console.log('Commands initialized');
}
