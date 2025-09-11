import { commandRegistry } from './CommandRegistry';
import { createHeading1Command, createHeading2Command, createHeading3Command } from '../commands';
import { createBulletListCommand, createOrderedListCommand, handleTabKey } from '../commands/lists';

/**
 * Initialize and register all commands with the command registry.
 * This should be called during application startup.
 */
export function initializeCommands(): void {
  console.log('Initializing commands...');
  
  // Register commands
  const commands = [
    // Headings
    createHeading1Command(),
    createHeading2Command(),
    createHeading3Command(),
    
    // Lists
    createBulletListCommand(),
    createOrderedListCommand()
  ];
  
  // Set up tab key handling for lists
  if (typeof window !== 'undefined') {
    document.addEventListener('keydown', (event) => {
      const editor = document.querySelector('.ProseMirror') as HTMLElement;
      if (editor && editor.contains(document.activeElement)) {
        if (event.key === 'Tab') {
          const view = (window as any).editorView; // Make sure to set this when initializing the editor
          if (view) {
            handleTabKey(view, event);
          }
        }
      }
    });
  }
  
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
