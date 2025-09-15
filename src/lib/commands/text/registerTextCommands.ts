import { commandRegistry } from '../../core/CommandRegistry';
import { BoldCommand } from './TextFormatCommands';
import { ItalicCommand } from './TextFormatCommands';
import { CodeCommand } from './TextFormatCommands';
import { TextColorCommand } from './TextStyleCommands';
import { FontSizeCommand } from './TextStyleCommands';

// Create instances of all text formatting commands
const textFormattingCommands = [
  new BoldCommand(),
  new ItalicCommand(),
  new CodeCommand(),
  new TextColorCommand(),
  new FontSizeCommand()
];

// Function to register all text formatting commands
export function registerTextCommands() {
  commandRegistry.registerAll(textFormattingCommands);
  console.log('Text formatting commands registered');
}

// Export individual commands for direct import if needed
export {
  BoldCommand,
  ItalicCommand,
  CodeCommand,
  TextColorCommand,
  FontSizeCommand
};
