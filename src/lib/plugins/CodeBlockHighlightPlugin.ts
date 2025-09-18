// codeblock-plugin.ts
import { Plugin, PluginKey, PluginView } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Node as PMNode } from 'prosemirror-model';
import Prism from 'prismjs';

// Import additional languages as needed
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';

export const codeBlockPluginKey = new PluginKey('codeBlock');

export interface CodeBlockState {
  decorations: DecorationSet;
  activeLanguageSelector: { pos: number } | null;
}

function getDecorations(doc: PMNode): DecorationSet {
  const decorations: Decoration[] = [];
  
  doc.descendants((node, pos) => {
    if (node.type.name === 'code_block') {
      const language = node.attrs.language;
      
      if (language && Prism.languages[language]) {
        const text = node.textContent;
        const tokens = Prism.tokenize(text, Prism.languages[language]);
        
        let offset = pos + 1; // +1 for the opening of code_block node
        
        function addToken(token: string | Prism.Token) {
          if (typeof token === 'string') {
            offset += token.length;
          } else {
            const from = offset;
            const to = offset + token.length;
            const className = `token ${token.type}${token.alias ? ' ' + token.alias : ''}`;
            
            decorations.push(
              Decoration.inline(from, to, {
                class: className
              })
            );
            
            if (Array.isArray(token.content)) {
              token.content.forEach(addToken);
            } else {
              offset += token.length;
            }
          }
        }
        
        tokens.forEach(addToken);
      }
      
      // Add language selector decoration
      decorations.push(
        Decoration.widget(pos + 1, createLanguageSelector(language || 'plain'), {
          side: -1,
          key: `lang-selector-${pos}`
        })
      );
    }
  });
  
  return DecorationSet.create(doc, decorations);
}

// Available languages for code blocks with icons for modern UI
const CODE_LANGUAGES = [
  { value: '', label: 'Plain Text', icon: '📄' },
  { value: 'javascript', label: 'JavaScript', icon: 'JS' },
  { value: 'typescript', label: 'TypeScript', icon: 'TS' },
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'java', label: 'Java', icon: '♨️' },
  { value: 'css', label: 'CSS', icon: '🎨' },
  { value: 'html', label: 'HTML', icon: '🌐' },
  { value: 'markdown', label: 'Markdown', icon: 'MD' },
  { value: 'json', label: 'JSON', icon: '{ }' },
  { value: 'bash', label: 'Bash', icon: '>' },
  { value: 'sql', label: 'SQL', icon: '🗄️' }
];

function createLanguageSelector(currentLanguage: string): HTMLElement {
  const container = document.createElement('div');
  container.className = 'code-block-language-selector';
  container.contentEditable = 'false';
  
  // Find the current language info
  const currentLang = CODE_LANGUAGES.find(l => l.value === currentLanguage) || CODE_LANGUAGES[0];
  
  // Create the language display button
  const langButton = document.createElement('button');
  langButton.className = 'language-display-button';
  langButton.type = 'button';
  
  // Set button content
  langButton.innerHTML = `
    <span class="lang-icon">${currentLang.icon}</span>
    <span class="lang-name">${currentLang.label}</span>
    <svg class="chevron-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  `;
  
  // Add data attributes
  langButton.dataset.language = currentLanguage;
  
  // Create the language menu (hidden initially)
  const langMenu = document.createElement('div');
  langMenu.className = 'language-menu';
  langMenu.style.display = 'none';
  
  // Create the search box
  const searchContainer = document.createElement('div');
  searchContainer.className = 'lang-search-container';
  
  const searchIcon = document.createElement('span');
  searchIcon.className = 'search-icon';
  searchIcon.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  `;
  
  const searchInput = document.createElement('input');
  searchInput.className = 'lang-search';
  searchInput.type = 'text';
  searchInput.placeholder = 'Search language...';
  
  searchContainer.appendChild(searchIcon);
  searchContainer.appendChild(searchInput);
  langMenu.appendChild(searchContainer);
  
  // Create the language options
  const langList = document.createElement('div');
  langList.className = 'lang-list';
  
  // Add language options
  CODE_LANGUAGES.forEach(lang => {
    const langOption = document.createElement('button');
    langOption.className = 'lang-option';
    langOption.dataset.value = lang.value;
    langOption.innerHTML = `
      <span class="lang-icon">${lang.icon}</span>
      <span class="lang-name">${lang.label}</span>
    `;
    
    if (lang.value === currentLanguage) {
      langOption.classList.add('selected');
    }
    
    langOption.addEventListener('click', (e) => {
      e.stopPropagation();
      // Update the button appearance
      const iconEl = langButton.querySelector('.lang-icon');
      const nameEl = langButton.querySelector('.lang-name');
      if (iconEl) iconEl.textContent = lang.icon;
      if (nameEl) nameEl.textContent = lang.label;
      langButton.dataset.language = lang.value;
      
      // Hide menu
      langMenu.style.display = 'none';
      
      // Create a change event on the hidden select to trigger language change
      const hiddenSelect = document.createElement('select');
      hiddenSelect.className = 'language-select';
      hiddenSelect.style.display = 'none';
      const option = document.createElement('option');
      option.value = lang.value;
      hiddenSelect.appendChild(option);
      hiddenSelect.value = lang.value;
      container.appendChild(hiddenSelect);
      
      // Dispatch a change event to be caught by the plugin
      const changeEvent = new Event('change', { bubbles: true });
      hiddenSelect.dispatchEvent(changeEvent);
      
      // Clean up the hidden select after the event is processed
      setTimeout(() => container.removeChild(hiddenSelect), 100);
    });
    
    langList.appendChild(langOption);
  });
  
  langMenu.appendChild(langList);
  
  // Handle search filtering
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const options = langList.querySelectorAll('.lang-option');
    
    options.forEach(option => {
      const langName = option.querySelector('.lang-name');
      if (langName && langName.textContent) {
        const langNameText = langName.textContent.toLowerCase();
        if (langNameText.includes(query)) {
          (option as HTMLElement).style.display = '';
        } else {
          (option as HTMLElement).style.display = 'none';
        }
      }
    });
  });
  
  // Toggle menu visibility on button click
  langButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = langMenu.style.display === 'block';
    langMenu.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
      // Clear and focus search when opening
      searchInput.value = '';
      setTimeout(() => searchInput.focus(), 10);
      
      // Reset visibility of all options
      const options = langList.querySelectorAll('.lang-option');
      options.forEach(option => {
        (option as HTMLElement).style.display = '';
      });
      
      // Scroll selected option into view
      const selectedOption = langList.querySelector('.lang-option.selected');
      if (selectedOption) {
        selectedOption.scrollIntoView({ block: 'nearest' });
      }
    }
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', () => {
    langMenu.style.display = 'none';
  });
  
  // Add components to container
  container.appendChild(langButton);
  container.appendChild(langMenu);
  
  // Add copy button
  const copyButton = document.createElement('button');
  copyButton.className = 'code-block-copy-button';
  copyButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>`;
  copyButton.title = 'Copy code';
  container.appendChild(copyButton);
  
  return container;
}

/**
 * Create and export the code block highlighting plugin
 */
export function createCodeBlockPlugin() {
  return new Plugin<CodeBlockState>({
    key: codeBlockPluginKey,
    
    state: {
      init(_, { doc }) {
        return {
          decorations: getDecorations(doc),
          activeLanguageSelector: null
        };
      },
      
      apply(tr, state, _, newState) {
        if (tr.docChanged || tr.getMeta(codeBlockPluginKey)) {
          return {
            decorations: getDecorations(newState.doc),
            activeLanguageSelector: state.activeLanguageSelector
          };
        }
        return state;
      }
    },
    
    props: {
      decorations(state) {
        return this.getState(state)?.decorations;
      },
      
      handleDOMEvents: {
        change(view, event) {
          if ((event.target as HTMLElement).classList.contains('language-select')) {
            const select = event.target as HTMLSelectElement;
            const language = select.value;
            
            // Find the code block position
            let codeBlockPos: number | null = null;
            const { doc } = view.state;
            
            doc.descendants((node, pos) => {
              if (node.type.name === 'code_block') {
                const widget = view.domAtPos(pos + 1);
                if (widget.node?.contains(select)) {
                  codeBlockPos = pos;
                  return false;
                }
              }
            });
            
            if (codeBlockPos !== null) {
              const tr = view.state.tr;
              const node = doc.nodeAt(codeBlockPos);
              if (node) {
                tr.setNodeMarkup(codeBlockPos, undefined, {
                  ...node.attrs,
                  language
                });
                tr.setMeta(codeBlockPluginKey, true);
                view.dispatch(tr);
              }
              
              return true;
            }
            
            return false;
          }
          return false;
        },
        
        click(view, event) {
          if ((event.target as HTMLElement).closest('.code-block-copy-button')) {
            const button = (event.target as HTMLElement).closest('.code-block-copy-button')!;
            
            // Find the code block content
            let codeContent = '';
            const { doc } = view.state;
            
            doc.descendants((node, pos) => {
              if (node.type.name === 'code_block') {
                const widget = view.domAtPos(pos + 1);
                if (widget.node?.contains(button)) {
                  codeContent = node.textContent;
                  return false;
                }
              }
            });
            
            if (codeContent) {
              navigator.clipboard.writeText(codeContent).then(() => {
                // Show feedback
                button.classList.add('copied');
                button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>`;
                
                setTimeout(() => {
                  button.classList.remove('copied');
                  button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>`;
                }, 2000);
              });
            }
            
            return true;
          }
          return false;
        }
      }
    },
    
    view() {
      return {
        update: () => {},
        destroy: () => {}
      };
    }
  });
}

// Create an instance of the plugin and export it for use in App.svelte
export const codeBlockHighlightPlugin = createCodeBlockPlugin();