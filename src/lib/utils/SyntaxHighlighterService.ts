// /**
//  * Code syntax highlighter service using Prism.js
//  * Lightweight, modular syntax highlighting for code blocks
//  */

// // Import Prism core
// import Prism from 'prismjs';

// // Import only the languages we need
// import 'prismjs/components/prism-javascript';
// import 'prismjs/components/prism-typescript';
// import 'prismjs/components/prism-jsx';
// import 'prismjs/components/prism-tsx';
// import 'prismjs/components/prism-css';
// import 'prismjs/components/prism-markup'; // HTML
// import 'prismjs/components/prism-python';
// import 'prismjs/components/prism-json';
// import 'prismjs/components/prism-bash';

// export interface SyntaxHighlighterOptions {
//   code: string;
//   language?: string;
// }

// /**
//  * Language detection patterns
//  * Used to identify code language when not explicitly specified
//  */
// const languageDetectionPatterns: Record<string, RegExp[]> = {
//   javascript: [
//     /\b(function|const|let|var|if|else|for|while|return)\b/,
//     /\b(import|export|from|as|class|extends|new|this|try|catch)\b/,
//     /=>/,
//     /console\./
//   ],
//   typescript: [
//     /\b(interface|type|namespace|enum|implements)\b/,
//     /:[\s\n]*(string|number|boolean|any|void|never)/,
//     /<[\w<>]+>[\s\n]*\(/,
//     /\w+:[\s\n]*\w+/
//   ],
//   jsx: [
//     /<[A-Z][\w]*(\s[^>]*)?>/, // JSX components
//     /\breturn\s*\(/,
//     /\bReact\./,
//     /\buseState\b|\buseEffect\b/
//   ],
//   tsx: [
//     /\b(interface|type)\b/,
//     /<[A-Z][\w]*(\s[^>]*)?>/, // JSX components
//     /:[\s\n]*(React\.)/
//   ],
//   markup: [ // HTML
//     /<\/?[\w-]+>/,
//     /<[\w-]+\s+[\w-]+=".*?">/,
//     /<!DOCTYPE html>/i,
//     /<html[\s>]/
//   ],
//   css: [
//     /[.#][\w-]+\s*\{/,
//     /[\w-]+:[\s\n]*[\w-]+;/,
//     /@media\s+/,
//     /!important/
//   ],
//   python: [
//     /\b(def|class|if|elif|else|for|while|import|from|as)\b/,
//     /\b(return|yield|try|except|finally|raise|with)\b/,
//     /#.*/,
//     /"""[\s\S]*?"""/
//   ],
//   json: [
//     /^\s*[\{\[]/,
//     /"\w+":/,
//     /:\s*[\{\[]/
//   ],
//   bash: [
//     /^\s*#!/,
//     /\$\w+/,
//     /\b(echo|ls|cd|mkdir|rm|grep|awk|sed)\b/
//   ]
// };

// /**
//  * SyntaxHighlighter Service
//  * Provides code highlighting functionality for the editor
//  */
// export class SyntaxHighlighterService {
//   // Cache for already processed elements to prevent duplicate processing
//   private static processedElements = new WeakSet<HTMLElement>();
  
//   /**
//    * Determine language from code content
//    */
//   static detectLanguage(code: string): string {
//     // Skip empty code
//     if (!code?.trim()) return '';
    
//     // Check each language's patterns for matches
//     for (const [lang, patterns] of Object.entries(languageDetectionPatterns)) {
//       let matches = 0;
      
//       for (const pattern of patterns) {
//         if (pattern.test(code)) {
//           matches++;
//         }
//       }
      
//       // Require at least two matches for confident detection
//       if (matches >= 2) {
//         return lang;
//       }
//     }
    
//     // Default to JavaScript if language can't be detected
//     return 'javascript';
//   }
  
//   /**
//    * Main method to apply syntax highlighting to code using Prism.js
//    */
//   static highlightCode({ code, language }: SyntaxHighlighterOptions): string {
//     // Skip empty code
//     if (!code?.trim()) return code;
    
//     // Auto-detect language if not specified
//     const lang = language || this.detectLanguage(code);
    
//     console.log(`[SyntaxHighlighter] Highlighting code with language: ${lang}`);
//     console.log(`[SyntaxHighlighter] Available Prism languages:`, Object.keys(Prism.languages));
    
//     try {
//       // Check if language is available
//       const grammar = Prism.languages[lang] || Prism.languages.javascript;
//       if (!grammar) {
//         console.warn(`[SyntaxHighlighter] No grammar found for language: ${lang}`);
//         return this.escapeHtml(code);
//       }
      
//       // Use Prism.js to highlight the code
//       const highlightedCode = Prism.highlight(code, grammar, lang);
//       console.log(`[SyntaxHighlighter] Successfully highlighted ${code.length} chars, result length: ${highlightedCode.length}`);
//       return highlightedCode;
//     } catch (error) {
//       console.error('[SyntaxHighlighter] Prism highlighting failed:', error);
//       // Fallback to escaped HTML
//       return this.escapeHtml(code);
//     }
//   }

//   /**
//    * Escape HTML to prevent XSS
//    */
//   private static escapeHtml(text: string): string {
//     return text
//       .replace(/&/g, '&amp;')
//       .replace(/</g, '&lt;')
//       .replace(/>/g, '&gt;');
//   }
  
//   /**
//    * Apply highlighting using Prism.js directly to DOM element
//    */
//   static applyHighlightingClasses(element: HTMLElement, language?: string): void {
//     if (!element) return;
    
//     // Skip elements that have already been highlighted
//     if (this.processedElements.has(element) || 
//         element.getAttribute('data-highlighted') === 'true') {
//       return;
//     }
    
//     try {
//       // Get the original content
//       const text = element.textContent || '';
//       if (!text.trim()) return;
      
//       // Detect language if not provided
//       const lang = language || this.detectLanguage(text);

//       // Use Prism.js to highlight the code
//       const highlightedCode = this.highlightCode({ code: text, language: lang });
      
//       // Set the highlighted HTML
//       element.innerHTML = highlightedCode;
      
//       // Mark as highlighted
//       this.processedElements.add(element);
//       element.setAttribute('data-highlighted', 'true');
//       element.classList.add('hljs');
      
//       if (lang) {
//         element.classList.add(`language-${lang}`);
//       }
//     } catch (error) {
//       console.error('Error applying Prism highlighting:', error);
//       // Fallback to escaped text
//       element.textContent = element.textContent || '';
//     }
//   }
  
//   /**
//    * Get list of supported languages
//    */
//   static getSupportedLanguages(): string[] {
//     return Object.keys(Prism.languages);
//   }
  
//   /**
//    * Check if a language is supported
//    */
//   static isLanguageSupported(language: string): boolean {
//     return language in Prism.languages;
//   }
// }

// // Export a singleton instance for convenience
// export default SyntaxHighlighterService;
