




const itemGroups = [
  {
    id: 'text',
    title: 'Text & Layout',
    commands: [
      {
        id: 'heading1',
        title: 'Large heading',
        // subtitle: 'H₁',
        icon: 'heading-1',
        keywords: ['heading', 'h1', 'title', 'large'],
        command: { type: 'heading', level: 1, content: '' }
      },
      {
        id: 'heading2',
        title: 'Medium heading', 
        // subtitle: 'H₂',
        icon: 'heading-2',
        keywords: ['heading', 'h2', 'subtitle', 'medium'],
        command: { type: 'heading', level: 2, content: '' }
      },
      {
        id: 'heading3',
        title: 'Small heading',
        // subtitle: 'H₃', 
        icon: 'heading-3',
        keywords: ['heading', 'h3', 'small'],
        command: { type: 'heading', level: 3, content: '' }
      },
      {
        id: 'orderedList',
        title: 'Numbered list',
        subtitle: '',
        icon: 'list-ordered',
        keywords: ['list', 'number', 'ordered', 'numbered'],
        command: { type: 'orderedList', content: '1. ' }
      },
      {
        id: 'bulletList',
        title: 'Bulleted list',
        subtitle: '',
        icon: 'list',
        keywords: ['list', 'bullet', 'bulleted', 'unordered'],
        command: { type: 'bulletList', content: '• ' }
      },
      {
        id: 'checklist',
        title: 'Checklist',
        subtitle: '',
        icon: 'check-square',
        keywords: ['checklist', 'todo', 'task', 'checkbox'],
        command: { type: 'checklist', content: '- [ ] ' }
      },
      {
        id: 'quote',
        title: 'Quote',
        subtitle: '',
        icon: 'quote',
        keywords: ['quote', 'blockquote', 'citation'],
        command: { type: 'quote', content: '> ' }
      },
      {
        id: 'code-block',
        title: 'Code block',
        subtitle: '',
        icon: 'code',
        keywords: ['code', 'snippet', 'programming', 'block'],
        command: { type: 'codeBlock', content: '```\n' }
      },
      {
        id: 'line-separator',
        title: 'Line separator',
        subtitle: '',
        icon: 'minus',
        keywords: ['divider', 'separator', 'line', 'break', 'hr'],
        command: { type: 'divider', content: '---' }
      },
      {
        id: 'hyperlink',
        title: 'Hyperlink',
        subtitle: '',
        icon: 'link',
        keywords: ['link', 'url', 'hyperlink', 'external'],
        command: { type: 'link', content: '[Link text](URL)' }
      },
      {
        id: 'clear-formatting',
        title: 'Clear formatting',
        subtitle: '',
        icon: 'eraser',
        keywords: ['clear', 'remove', 'formatting', 'plain'],
        command: { type: 'clearFormatting', content: '' }
      }
    ]
  },
  {
    id: 'display',
    title: 'Display',
    commands: [
      {
        id: 'table-5x5',
        title: 'Table 5x5',
        subtitle: '',
        icon: 'table',
        keywords: ['table', 'grid', 'data'],
        command: { type: 'table', content: '' }
      },
      {
        id: 'chart',
        title: 'Chart',
        subtitle: '',
        icon: 'bar-chart-3',
        keywords: ['chart', 'graph', 'data', 'visualization'],
        command: { type: 'chart', content: '' }
      }
    ]
  },
  {
    id: 'callout',
    title: 'Callout',
    commands: [
      {
        id: 'info-callout',
        title: 'Info callout',
        subtitle: '',
        icon: 'info',
        color: '#3b82f6',
        keywords: ['info', 'information', 'callout', 'blue'],
        command: { type: 'callout', variant: 'info', content: '' }
      },
      {
        id: 'tip-callout',
        title: 'Tip callout',
        subtitle: '',
        icon: 'check-circle',
        color: '#10b981',
        keywords: ['tip', 'success', 'callout', 'green'],
        command: { type: 'callout', variant: 'tip', content: '' }
      },
      {
        id: 'warning-callout',
        title: 'Warning callout',
        subtitle: '',
        icon: 'triangle-alert',
        color: '#f59e0b',
        keywords: ['warning', 'caution', 'callout', 'yellow'],
        command: { type: 'callout', variant: 'warning', content: '' }
      },
      {
        id: 'critical-callout',
        title: 'Critical callout',
        subtitle: '',
        icon: 'circle-x',
        color: '#ef4444',
        keywords: ['critical', 'error', 'danger', 'callout', 'red'],
        command: { type: 'callout', variant: 'critical', content: '' }
      }
    ]
  },
  {
    id: 'media',
    title: 'Media',
    commands: [
      {
        id: 'image',
        title: 'Image',
        subtitle: '',
        icon: 'image',
        keywords: ['image', 'picture', 'photo', 'upload'],
        command: { type: 'image', content: '' }
      },
      {
        id: 'video',
        title: 'Video',
        subtitle: '',
        icon: 'video',
        keywords: ['video', 'embed', 'youtube', 'media'],
        command: { type: 'video', content: '' }
      },
      {
        id: 'page-embed',
        title: 'Page embed',
        subtitle: '',
        icon: 'square',
        keywords: ['embed', 'page', 'iframe', 'external'],
        command: { type: 'embed', content: '' }
      }
    ]
  },
  {
    id: 'import',
    title: 'Import',
    commands: [
      {
        id: 'confluence',
        title: 'Confluence',
        subtitle: '',
        icon: 'download',
        color: '#0052cc',
        keywords: ['confluence', 'import', 'atlassian'],
        command: { type: 'import', source: 'confluence' }
      },
      {
        id: 'google-docs',
        title: 'Google docs',
        subtitle: '',
        icon: 'file-text',
        color: '#4285f4',
        keywords: ['google', 'docs', 'import', 'document'],
        command: { type: 'import', source: 'google-docs' }
      },
      {
        id: 'ms-word',
        title: 'MS Word',
        subtitle: '',
        icon: 'file-text',
        color: '#2b579a',
        keywords: ['microsoft', 'word', 'import', 'document'],
        command: { type: 'import', source: 'ms-word' }
      }
    ]
  },
  {
    id: 'export',
    title: 'Export',
    commands: [
      {
        id: 'export-pdf',
        title: 'Export to PDF',
        subtitle: '',
        icon: 'file-text',
        color: '#dc2626',
        keywords: ['export', 'pdf', 'download', 'save'],
        command: { type: 'export', format: 'pdf' }
      }
    ]
  }
];


export default itemGroups;