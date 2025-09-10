/**
 * Configuration options for the editor's title component
 */
export interface TitleConfig {
  /** Whether the title is enabled */
  enabled?: boolean;
  
  /** Placeholder text for the title when empty */
  placeholder?: string;
  
  /** Whether the title is editable */
  editable?: boolean;
  
  /** CSS class to apply to the title element */
  className?: string;
  
  /** HTML attributes to apply to the title element */
  attributes?: Record<string, string>;
  
  /** Initial value for the title */
  initialValue?: string;
}

// Default title configuration
export const defaultTitleConfig: Required<TitleConfig> = {
  enabled: false,
  placeholder: 'Untitled',
  editable: true,
  className: 'editor-title',
  attributes: {},
  initialValue: ''
};
