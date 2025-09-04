# Title Configuration Guide

Eddytor provides a flexible title configuration system that allows you to add, style, and customize document titles. This guide covers all available options and examples.

## Basic Configuration

### Enabling/Disabling the Title

```javascript
// Enable title with default settings
const editor = Eddytor.init('#editor', {
  title: {
    enabled: true
  }
});

// Disable title (default behavior if not specified)
const editor = Eddytor.init('#editor', {
  title: {
    enabled: false
  }
});
```

### Basic Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | boolean | `false` | Whether to show the title component |
| `placeholder` | string | `'Untitled Document'` | Placeholder text when title is empty |
| `initialValue` | string | `''` | Initial title value |
| `editable` | boolean | `true` | Whether the title can be edited |
| `className` | string | `''` | CSS class(es) to apply to the title element |
| `attributes` | object | `{}` | Additional HTML attributes to add to the title element |

## Styling Examples

### Basic Title

```javascript
const editor = Eddytor.init('#editor', {
  title: {
    enabled: true,
    placeholder: 'Enter document title...',
    initialValue: 'My Awesome Document'
  }
});
```

### Read-Only Title

```javascript
const editor = Eddytor.init('#editor', {
  title: {
    enabled: true,
    editable: false,
    initialValue: 'Read-Only Document Title',
    placeholder: 'This title cannot be edited'
  }
});
```

### Styled Title with CSS Class

```javascript
// In your CSS:
// .fancy-title {
//   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//   -webkit-background-clip: text;
//   -webkit-text-fill-color: transparent;
//   background-clip: text;
// }

const editor = Eddytor.init('#editor', {
  title: {
    enabled: true,
    className: 'fancy-title',
    placeholder: 'Your amazing title here...',
    initialValue: 'Gradient Title Magic'
  }
});
```

### Corporate Style Title

```javascript
// In your CSS:
// .corporate-title {
//   font-family: 'Times New Roman', serif;
//   color: #1f2937 !important;
//   text-align: center;
//   border-bottom: 3px solid #d1d5db;
//   padding-bottom: 0.5rem;
// }

const editor = Eddytor.init('#editor', {
  title: {
    enabled: true,
    className: 'corporate-title',
    placeholder: 'Corporate Document Title',
    initialValue: 'Annual Report 2024'
  }
});
```

## Advanced Usage

### Custom HTML Attributes

Add custom attributes to the title element for metadata, accessibility, or custom functionality:

```javascript
const editor = Eddytor.init('#editor', {
  title: {
    enabled: true,
    placeholder: 'Document with metadata...',
    initialValue: 'Document with Custom Attributes',
    attributes: {
      'data-document-id': 'doc-12345',
      'data-author': 'John Doe',
      'data-created': new Date().toISOString(),
      'aria-label': 'Main document title',
      'spellcheck': 'true'
    }
  }
});
```

## Best Practices

1. **Accessibility**: Always include an `aria-label` when the title's purpose might not be clear from context.
2. **Placeholder Text**: Use clear, descriptive placeholder text to guide users.
3. **Styling**: Use the `className` property to apply custom styles rather than targeting the title element directly in your CSS.
4. **Performance**: For best performance, provide an `initialValue` if you already know the title.
5. **Responsiveness**: Ensure your title styles work well on all screen sizes.

## Browser Compatibility

The title component works in all modern browsers. For gradient text effects, ensure you include both standard and vendor-prefixed properties for maximum compatibility.

## Troubleshooting

- **Title not appearing**: Ensure `enabled` is set to `true`
- **Styles not applying**: Check for CSS specificity issues and ensure your styles are loaded
- **Editable state not working**: Verify that `editable` is set to `true` and there are no conflicting event handlers
