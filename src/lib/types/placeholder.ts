export interface PlaceholderConfig {
  /**
   * Placeholder content to show when the node is empty
   * Can be a string, HTMLElement, or a function that returns either
   */
  text?: string | HTMLElement | (() => string | HTMLElement) | { __html: string };
  
  /**
   * CSS class to apply to the placeholder element
   * @default 'eddytor-line-placeholder'
   */
  className?: string;
  
  /**
   * Whether to show the placeholder for empty blocks
   * @default true
   */
  showForEmptyBlocks?: boolean;
  
  /**
   * Whether to show the placeholder when the editor has focus
   * @default true
   */
  showOnFocus?: boolean;
  
  /**
   * Whether to show the placeholder when the editor loses focus
   * @default true
   */
  showOnBlur?: boolean;
  
  /**
   * Custom attributes to apply to the placeholder element
   */
  attributes?: Record<string, string>;
  
  /**
   * Custom styles to apply to the placeholder element
   */
  style?: Partial<CSSStyleDeclaration>;
  
  /**
   * Whether to show the placeholder for the first block only
   * @default false
   */
  firstBlockOnly?: boolean;
  
  /**
   * Custom function to determine if placeholder should be shown
   * Overrides other visibility settings when provided
   */
  shouldShow?: (params: {
    isEmpty: boolean;
    hasFocus: boolean;
    isFirstBlock: boolean;
    node: any;
  }) => boolean;
}

// Default placeholder configuration
export const defaultPlaceholderConfig: Required<Omit<PlaceholderConfig, 'shouldShow'>> & { shouldShow?: PlaceholderConfig['shouldShow'] } = {
  text: '<span style="color: #9ca3af; font-size: 14px; display: inline-flex; align-items: center; gap: 4px;">Type <span style="background: linear-gradient(135deg,rgb(93, 58, 232) 0%, #764ba2 100%); color: white; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.12);">/</span> for commands or click <span style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.12);">+</span> to open the menu</span>',
  className: 'eddytor-line-placeholder',
  showForEmptyBlocks: true,
  showOnFocus: true,
  showOnBlur: true,
  firstBlockOnly: false,
  attributes: {},
  style: {
    color: '#999',
    pointerEvents: 'none',
    overflow: 'visible',
    userSelect: 'none',
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    left: '0',
    right: '0',
    padding: '0 4px',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    opacity: '0.75',
    
  }
};

export function mergePlaceholderConfig(
  config?: Partial<PlaceholderConfig>
): Required<Omit<PlaceholderConfig, 'shouldShow'>> & { shouldShow?: PlaceholderConfig['shouldShow'] } {
  const merged = {
    ...defaultPlaceholderConfig,
    ...config,
    style: {
      ...defaultPlaceholderConfig.style,
      ...(config?.style || {})
    },
    attributes: {
      ...defaultPlaceholderConfig.attributes,
      ...(config?.attributes || {})
    }
  };

  // Only include shouldShow if it was provided in the config
  if (config?.shouldShow) {
    (merged as any).shouldShow = config.shouldShow;
  }

  return merged as any;
}
