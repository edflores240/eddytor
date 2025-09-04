// index.ts
import Editor from '../App.svelte';
import './styles.css';

export interface TitleConfig {
  enabled?: boolean;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  attributes?: Record<string, string>;
  initialValue?: string;
}

export interface EditorConfig {
  title?: TitleConfig;
  initialContent?: string;
}

export function init(selector: string, config: EditorConfig | string = {}) {
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
    },
  }); 

  return app;
}