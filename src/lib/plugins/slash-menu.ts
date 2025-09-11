import { Plugin, PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Slice, Fragment } from 'prosemirror-model';
import { commandRegistry } from '../commands';

export const slashMenuKey = new PluginKey('slashMenu');

interface SlashMenuState {
  active: boolean;
  query: string;
  pos: number | null;
}

export function slashMenuPlugin(handleStateChange: (state: SlashMenuState) => void) {
  return new Plugin({
    key: slashMenuKey,
    state: {
      init(): SlashMenuState {
        return {
          active: false,
          query: '',
          pos: null
        };
      },
      apply(tr, value: SlashMenuState, oldState, newState): SlashMenuState {
        // Check if the slash menu should be active
        const { selection } = newState;
        const { $from } = selection;
        
        // Get the text before the cursor
        const textBeforeCursor = $from.parent.textBetween(
          Math.max(0, $from.parentOffset - 30), // Look back up to 30 characters
          $from.parentOffset,
          null,
          '\ufffc' // Object replacement character
        );
        
        // Check if we're at the start of a new line or after whitespace
        const isNewLine = textBeforeCursor.trim() === '';
        const lastChar = textBeforeCursor.slice(-1);
        const isAfterWhitespace = /\s/.test(lastChar);
        const slashIndex = textBeforeCursor.lastIndexOf('/');
        
        // If we find a slash and it's at the start or after whitespace
        if (slashIndex !== -1 && (isNewLine || isAfterWhitespace)) {
          const query = textBeforeCursor.slice(slashIndex + 1).trim();
          
          // Calculate the position of the slash
          const pos = $from.pos - (textBeforeCursor.length - slashIndex);
          
          // Only update if something changed
          if (value.query !== query || value.pos !== pos) {
            return {
              active: true,
              query,
              pos
            };
          }
          return value;
        }
        
        // If we were active but shouldn't be anymore
        if (value.active) {
          return { active: false, query: '', pos: null };
        }
        
        return value;
      }
    },
    props: {
      handleKeyDown(view: EditorView, event: KeyboardEvent) {
        const state = slashMenuKey.getState(view.state);
        
        if (!state.active) return false;
        
        // Handle keyboard navigation when menu is active
        switch (event.key) {
          case 'ArrowUp':
          case 'ArrowDown':
          case 'Enter':
          case 'Escape':
            event.preventDefault();
            return true;
          case 'Backspace':
            // If backspace would delete the slash, close the menu
            if (view.state.selection.$from.pos <= (state.pos || 0) + 1) {
              view.dispatch(
                view.state.tr.setMeta(slashMenuKey, { remove: true })
              );
              return true;
            }
            break;
        }
        
        return false;
      },
      handleTextInput(view, from, to, text) {
        const state = slashMenuKey.getState(view.state);
        if (!state.active) return false;
        
        // Update the query in the state
        const tr = view.state.tr.setMeta(slashMenuKey, { query: state.query + text });
        view.dispatch(tr);
        return true;
      },
      handleDOMEvents: {
        blur: (view) => {
          // Close menu when editor loses focus
          const state = slashMenuKey.getState(view.state);
          if (state.active) {
            view.dispatch(
              view.state.tr.setMeta(slashMenuKey, { remove: true })
            );
          }
          return false;
        },
        // Handle clicks outside the editor
        mousedown: (view, event) => {
          const target = event.target as HTMLElement;
          if (!view.dom.contains(target)) {
            const state = slashMenuKey.getState(view.state);
            if (state.active) {
              view.dispatch(
                view.state.tr.setMeta(slashMenuKey, { remove: true })
              );
            }
          }
          return false;
        }
      }
    },
    view(editorView) {
      return {
        update: (view, prevState) => {
          const state = slashMenuKey.getState(view.state);
          const prevStateValue = slashMenuKey.getState(prevState);
          
          // Only trigger update if something changed
          if (
            state.active !== prevStateValue.active ||
            state.query !== prevStateValue.query ||
            state.pos !== prevStateValue.pos
          ) {
            handleStateChange(state);
            
            // If we're deactivating, clean up the slash
            if (prevStateValue.active && !state.active && prevStateValue.pos !== null) {
              const tr = view.state.tr;
              tr.delete(prevStateValue.pos, prevStateValue.pos + 1);
              view.dispatch(tr);
            }
          }
        },
        destroy: () => {
          // Cleanup if needed
        }
      };
    }
  });
}

// Helper to execute a command from the slash menu
export function executeSlashCommand(view: EditorView, commandId: string) {
  const state = slashMenuKey.getState(view.state);
  if (!state.active || !state.pos) return false;
  
  // Delete the slash and query
  const tr = view.state.tr;
  tr.delete(state.pos, state.pos + 1 + (state.query?.length || 0));
  
  // Execute the command
  const executed = commandRegistry.execute(view, commandId, { tr });
  
  if (executed) {
    // Clear the slash menu state
    tr.setMeta(slashMenuKey, { remove: true });
    view.dispatch(tr);
    return true;
  }
  
  return false;
}

// Helper to check if slash menu is active
export function isSlashMenuActive(state: any): boolean {
  const pluginState = slashMenuKey.getState(state);
  return pluginState?.active || false;
}
