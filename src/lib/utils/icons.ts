// Icons utility - Using vanilla Lucide icons for UMD compatibility

interface IconOptions {
  size?: number;
  color?: string;
  strokeWidth?: string | number;
  className?: string;
  [key: string]: any;
}

import { 
  Bold,
  Italic,
  Code,
  Underline,
  Strikethrough,
  Link,
  Highlighter,
  Sparkles,
  MessageCircle
} from 'lucide';

// Icon mapping with Lucide icons
const iconMap = {
  bold: Bold,
  italic: Italic,
  code: Code,
  underline: Underline,
  strikethrough: Strikethrough,
  link: Link,
  highlight: Highlighter,
  sparkle: Sparkles,
  comment: MessageCircle,
};

/**
 * Get SVG string for an icon
 * @param {string} name - Icon name
 * @param {object} options - Icon options
 * @param {number} options.size - Icon size (default: 16)
 * @param {string} options.color - Icon color (default: 'currentColor')
 * @param {string} options.strokeWidth - Stroke width (default: '2')
 * @param {string} options.className - CSS class name
 * @returns {string} SVG string
 */
function getIcon(name: string, options: IconOptions = {}) {


  const {
    size = 16,
    color = 'currentColor',
    strokeWidth = '2',
    className = '',
    ...attrs
  } = options;

  const IconComponent = iconMap[name];
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return '';
  }

  // Create SVG element directly using the icon component
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', size.toString());
  svg.setAttribute('height', size.toString());
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', color);
  svg.setAttribute('stroke-width', strokeWidth.toString());
  if (className) {
    svg.setAttribute('class', className);
  }
  
  // Add any additional attributes
  Object.entries(attrs).forEach(([key, value]) => {
    svg.setAttribute(key, String(value));
  });

  // Create the icon content
  const iconSvg = IconComponent().outerHTML;
  svg.innerHTML = iconSvg;
  
  return svg.outerHTML;
}

/**
 * Create an icon element
 * @param {string} name - Icon name
 * @param {object} options - Icon options
 * @returns {HTMLElement} SVG element
 */
function createIcon(name, options = {}) {
  const svgString = getIcon(name, options);
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  return doc.documentElement;
}

/**
 * Render icon into a container element
 * @param {HTMLElement} container - Container element
 * @param {string} name - Icon name
 * @param {object} options - Icon options
 */
function renderIcon(container, name, options = {}) {
  if (!container) return;
  
  const iconElement = createIcon(name, options);
  container.innerHTML = '';
  container.appendChild(iconElement);
}

// Svelte component wrapper for backward compatibility
function Icon({ 
  name, 
  size = 16, 
  color = 'currentColor', 
  strokeWidth = '2',
  className = '',
  ...rest 
}) {
  return getIcon(name, { size, color, strokeWidth, className, ...rest });
}

// Export available icon names
const availableIcons = Object.keys(iconMap);

// Export all functions as a default object
export default {
  getIcon,
  createIcon,
  renderIcon,
  Icon,
  availableIcons
};

// Also keep named exports for backward compatibility
export { getIcon, createIcon, renderIcon, Icon, availableIcons };