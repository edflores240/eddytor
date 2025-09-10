<!--  --># Eddytor Placeholder Configuration

Eddytor supports a flexible placeholder system for block-based editors.

## Basic Usage

Pass the `placeholder` option to the editor config:

```js
Eddytor.init('#my-editor', {
  placeholder: {
    text: 'Type / for commands or click + to open the menu',
    className: 'eddytor-placeholder',
    showForEmptyBlocks: true,
    showOnFocus: true,
    showOnBlur: true,
    style: {
      color: '#94a3b8',
      pointerEvents: 'none',
      userSelect: 'none'
    }
  }
});


Plain text:
text: "Type something..."

HTML strings:
text: '<span style="color: #666">Type <b>/</b> for commands</span>'

Functions returning strings:
text: () => '<span>Dynamic placeholder</span>'

Objects with __html:
text: { __html: '<span>HTML content</span>' }

HTMLElements:
text: (() => {
  const span = document.createElement('span');
  span.innerHTML = 'Custom element';
  return span;
})()


