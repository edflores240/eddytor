// src/lib/components/floating-toolbar/commands.ts
import { toggleMark, setBlockType } from 'prosemirror-commands';
import type { EditorView } from 'prosemirror-view';

export function executeCommand(view: EditorView, command: string, value?: any): boolean {
  const { state, dispatch } = view;
  const { schema } = state;
  
  try {
    switch (command) {
      case 'bold':
      case 'italic':
      case 'underline':
      case 'strikethrough':
      case 'baseline': // Added baseline color support
        const mark = schema.marks[command];
        if (mark) {
          // Handle color if provided
          const attrs = value ? { color: value } : undefined;
          toggleMark(mark, attrs)(state, dispatch);
          view.focus();
          return true;
        }
        break;
        
      case 'largeHeading':
      case 'mediumHeading':
      case 'smallHeading':
      case 'heading1': // Keep backward compatibility
      case 'heading2':
      case 'heading3':
        // Map command names to heading levels
        const levelMap: Record<string, number> = {
          'largeHeading': 1,
          'mediumHeading': 2,
          'smallHeading': 3,
          'heading1': 1,
          'heading2': 2,
          'heading3': 3
        };
        
        const level = levelMap[command] || 1;
        setBlockType(schema.nodes.heading, { level })(state, dispatch);
        view.focus();
        return true;
        
      case 'bulletList':
      case 'orderedList':
        const listType = schema.nodes[command === 'bulletList' ? 'bullet_list' : 'ordered_list'];
        const itemType = schema.nodes.list_item;
        if (listType && itemType) {
          const listItem = itemType.create(null, schema.nodes.paragraph.create());
          const list = listType.create(null, listItem);
          const tr = state.tr.replaceSelectionWith(list);
          dispatch(tr);
          view.focus();
          return true;
        }
        break;
        
      case 'link':
        const linkType = schema.marks.link;
        if (linkType) {
          const { from, to } = state.selection;
          
          // Handle both direct value and prompt cases
          let href: string | undefined;
          let text: string | undefined;
          
          if (value && typeof value === 'object') {
            // Handle link from modal
            href = value.url;
            text = value.text;
          } else {
            // Fallback to prompt
            const selectedText = state.doc.textBetween(from, to, '');
            const input = prompt('Enter URL:', selectedText.startsWith('http') ? selectedText : 'https://');
            if (!input) return false;
            href = input.trim();
          }
          
          if (href) {
            const tr = state.tr.addMark(
              from,
              to,
              linkType.create({ href })
            );
            
            // If we have custom text, insert it
            if (text && text !== href) {
              tr.insertText(text, from, to);
            }
            
            dispatch(tr);
            view.focus();
            return true;
          }
        }
        break;
    }
  } catch (error) {
    console.error('Error executing command:', command, error);
  }
  
  return false;
}