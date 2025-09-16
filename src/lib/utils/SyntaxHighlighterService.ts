/**
 * Code syntax highlighter service using Prism.js
 * Lightweight, modular syntax highlighting for code blocks
 */

// Import Prism core
import Prism from 'prismjs';

// Import only the languages we need
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup'; // HTML
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';

export interface SyntaxHighlighterOptions {
  code: string;
  language?: string;
}

/**
 * Language detection patterns
 * Used to identify code language when not explicitly specified
 */
const languageDetectionPatterns: Record<string, RegExp[]> = {
  javascript: [
    /\b(function|const|let|var|if|else|for|while|return)\b/,
    /\b(import|export|from|as|class|extends|new|this|try|catch)\b/,
    /=>/,
    /console\./
  ],
  typescript: [
    /\b(interface|type|namespace|enum|implements)\b/,
    /:[\s\n]*(string|number|boolean|any|void|never)/,
    /<[\w<>]+>[\s\n]*\(/,
    /\w+:[\s\n]*\w+/
  ],
  jsx: [
    /<[A-Z][\w]*(\s[^>]*)?>/, // JSX components
    /\breturn\s*\(/,
    /\bReact\./,
    /\buseState\b|\buseEffect\b/
  ],
  tsx: [
    /\b(interface|type)\b/,
    /<[A-Z][\w]*(\s[^>]*)?>/, // JSX components
    /:[\s\n]*(React\.)/
  ],
  markup: [ // HTML
    /<\/?[\w-]+>/,
    /<[\w-]+\s+[\w-]+=".*?">/,
    /<!DOCTYPE html>/i,
    /<html[\s>]/
  ],
  css: [
    /[.#][\w-]+\s*\{/,
    /[\w-]+:[\s\n]*[\w-]+;/,
    /@media\s+/,
    /!important/
  ],
  python: [
    /\b(def|class|if|elif|else|for|while|import|from|as)\b/,
    /\b(return|yield|try|except|finally|raise|with)\b/,
    /#.*/,
    /"""[\s\S]*?"""/
  ],
  json: [
    /^\s*[\{\[]/,
    /"\w+":/,
    /:\s*[\{\[]/
  ],
  bash: [
    /^\s*#!/,
    /\$\w+/,
    /\b(echo|ls|cd|mkdir|rm|grep|awk|sed)\b/
  ]
};

/**
 * SyntaxHighlighter Service
 * Provides code highlighting functionality for the editor
 */
export class SyntaxHighlighterService {
  // Cache for already processed elements to prevent duplicate processing
  private static processedElements = new WeakSet<HTMLElement>();
  
  /**
   * Determine language from code content
   */
  static detectLanguage(code: string): string {
    // Skip empty code
    if (!code?.trim()) return '';
    
    // Check each language's patterns for matches
    for (const [lang, patterns] of Object.entries(languageDetectionPatterns)) {
      let matches = 0;
      
      for (const pattern of patterns) {
        if (pattern.test(code)) {
          matches++;
        }
      }
      
      // Require at least two matches for confident detection
      if (matches >= 2) {
        return lang;
      }
    }
    
    // Default to JavaScript if language can't be detected
    return 'javascript';
  }
  
  /**
   * Main method to apply syntax highlighting to code using Prism.js
   */
  static highlightCode({ code, language }: SyntaxHighlighterOptions): string {
    // Skip empty code
    if (!code?.trim()) return code;
    
    // Auto-detect language if not specified
    const lang = language || this.detectLanguage(code);
    
    try {
      // Use Prism.js to highlight the code
      const highlightedCode = Prism.highlight(code, Prism.languages[lang] || Prism.languages.javascript, lang);
      return highlightedCode;
    } catch (error) {
      console.warn('Prism highlighting failed, falling back to plain text:', error);
      // Fallback to escaped HTML
      return this.escapeHtml(code);
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  private static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  
  /**
   * Apply highlighting using CSS classes only (ProseMirror-safe)
   */
  static applyHighlightingClasses(element: HTMLElement, language?: string): void {
    console.log(`[SyntaxHighlighter] applyHighlightingClasses called`);
    console.log(`[SyntaxHighlighter] Element:`, element);
    console.log(`[SyntaxHighlighter] Language:`, language);
    
    if (!element) {
      console.log(`[SyntaxHighlighter] No element provided, returning`);
      return;
    }
    
    // Skip elements that have already been highlighted
    const isProcessed = this.processedElements.has(element);
    const isMarked = element.getAttribute('data-highlighted') === 'true';
    console.log(`[SyntaxHighlighter] Already processed: ${isProcessed}, Already marked: ${isMarked}`);
    
    if (isProcessed || isMarked) {
      console.log(`[SyntaxHighlighter] Element already highlighted, skipping`);
      return;
    }
    
    try {
      // Get the original content for language detection
      const text = element.textContent || '';
      console.log(`[SyntaxHighlighter] Original text content: "${text.substring(0, 100)}..." (length: ${text.length})`);
      
      if (!text.trim()) {
        console.log(`[SyntaxHighlighter] No text content, returning`);
        return;
      }
      
      // Detect language if not provided - prioritize auto-detection over null language
      const lang = (language && language !== 'null') ? language : this.detectLanguage(text);
      console.log(`[SyntaxHighlighter] Using language: ${lang} (provided: ${language})`);
      
      // If no valid language found, default to javascript
      const finalLang = lang || 'javascript';
      console.log(`[SyntaxHighlighter] Final language: ${finalLang}`);

      // IMPORTANT: Don't modify DOM content in ProseMirror NodeView
      // Just add CSS classes for styling - let ProseMirror manage the content
      console.log(`[SyntaxHighlighter] Adding CSS classes only (ProseMirror-safe)`);
      
      // Mark as highlighted
      this.processedElements.add(element);
      element.setAttribute('data-highlighted', 'true');
      element.classList.add('hljs');
      
      if (finalLang) {
        element.classList.add(`language-${finalLang}`);
      }
      
      console.log(`[SyntaxHighlighter] Successfully applied highlighting. Classes:`, element.className);
    } catch (error) {
      console.error('[SyntaxHighlighter] Error applying highlighting classes:', error);
    }
  }
  
  // Removed buildSyntaxTree and applyBasicSyntaxClasses methods
  // These were causing DOM manipulation conflicts with ProseMirror
  
  /**
   * Apply highlighting to a DOM element
   * @deprecated Use applyHighlightingClasses for better results
   */
  static highlightElement(element: HTMLElement, language?: string): void {
    if (!element) return;
    
    // Skip elements that have already been highlighted
    if (this.processedElements.has(element) || 
        element.getAttribute('data-highlighted') === 'true') {
      return;
    }
    
    // Call the newer method
    this.applyHighlightingClasses(element, language);
  }
}

// Export a singleton instance for convenience
export default SyntaxHighlighterService;
