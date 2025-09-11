// index.ts
import Editor from '../App.svelte';
import './styles.css';
import { 
  TitleConfig, 
  PlaceholderConfig, 
  defaultTitleConfig,
  defaultPlaceholderConfig 
} from './types';
import { initializeCommands } from './core/initializeCommands';

export interface EditorConfig {
  /** Title configuration */
  title?: TitleConfig;
  
  /** Initial content to load into the editor */
  initialContent?: string;
  
  /** Placeholder configuration */
  placeholder?: PlaceholderConfig;
}


/**
 * Initialize the Eddytor editor
 * @param selector CSS selector or DOM element where the editor should be mounted
 * @param config Editor configuration options
 * @returns The Svelte component instance
 */
export function init(selector: string | HTMLElement, config: EditorConfig | string = {}) {
  // Initialize commands first
  initializeCommands();
  
  const target = typeof selector === 'string' ? document.querySelector(selector) : selector;

  if (!target) {
    throw new Error(`Eddytor: Container element not found for selector "${selector}"`);
  }

  // Handle backward compatibility
  const editorConfig: EditorConfig = typeof config === 'string' 
    ? { initialContent: config }
    : config;

  const app = new Editor({
    target,
    props: {
      initialContent: editorConfig.initialContent || '',
      titleConfig: editorConfig.title || { enabled: false },
      placeholderConfig: {
        ...defaultPlaceholderConfig,
        ...(editorConfig.placeholder || {})
      },
    },
  }); 

  return app;
}

// Export the Editor component type
export type { default as Editor } from '../App.svelte';