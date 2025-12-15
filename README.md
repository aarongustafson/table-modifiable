# table-modifiable Web Component

[![npm version](https://img.shields.io/npm/v/@aarongustafson/table-modifiable.svg)](https://www.npmjs.com/package/@aarongustafson/table-modifiable) [![Build Status](https://img.shields.io/github/actions/workflow/status/aarongustafson/table-modifiable/ci.yml?branch=main)](https://github.com/aarongustafson/table-modifiable/actions)

A web component that enables users to hide & show columns on an HTML table.

## Demo

[Live Demo](https://aarongustafson.github.io/table-modifiable/demo/) ([Source](./demo/index.html))

Additional demos:

- [ESM CDN Demo](https://aarongustafson.github.io/table-modifiable/demo/esm.html) ([Source](./demo/esm.html))
- [Unpkg CDN Demo](https://aarongustafson.github.io/table-modifiable/demo/unpkg.html) ([Source](./demo/unpkg.html))

## Installation

```bash
npm install @aarongustafson/table-modifiable
```

## Usage

### Option 1: Auto-define the custom element (easiest)

Import the package to automatically define the `<table-modifiable>` custom element:

```javascript
import '@aarongustafson/table-modifiable';
```

Or use the define-only script in HTML:

```html
<script src="./node_modules/@aarongustafson/table-modifiable/define.js" type="module"></script>
```

### Option 2: Import the class and define manually

Import the class and define the custom element with your preferred tag name:

```javascript
import { TableModifiableElement } from '@aarongustafson/table-modifiable/table-modifiable.js';

customElements.define('my-custom-name', TableModifiableElement);
```

You can also call the provided helper to register the element without importing the class:

```javascript
import { defineTableModifiable } from '@aarongustafson/table-modifiable/define.js';

defineTableModifiable('my-custom-name');
```

### Basic Example

```html
<table-modifiable removable="Name,Email,Phone" start-with="Name,Email">
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Phone</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>John Doe</td>
        <td>john@example.com</td>
        <td>555-1234</td>
      </tr>
    </tbody>
  </table>
</table-modifiable>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `removable` | `string` | `""` | Comma-separated list of all column names that can be shown/hidden |
| `start-with` | `string` | (all removable) | Comma-separated list of which columns should be visible by default. If not specified, all removable columns will be shown initially |
| `button-label` | `string` | `"Modify Table"` | Text label for the toggle button |
| `button-aria-label` | `string` | (same as button-label) | Accessible label for the toggle button. Use this to provide a more descriptive label for screen readers if needed |
| `tools-label` | `string` | `"Show/Hide Columns"` | Heading text for the popover panel |

## Properties

All of the attributes above have matching camelCase properties (`removable`, `startWith`, `buttonLabel`, `buttonAriaLabel`, `toolsLabel`). Setting a property updates the corresponding attribute and schedules the component to re-render.

```javascript
const modifiable = document.querySelector('table-modifiable');
modifiable.removable = 'Name,Email';
modifiable.startWith = 'Name';
```

## Events

The component fires custom events that you can listen to:

| Event | Description | Detail |
|-------|-------------|--------|
| `table-modifiable:change` | Fired when a column's visibility is toggled | `{ column: string, visible: boolean }` |

### Example Event Handling

```javascript
const element = document.querySelector('table-modifiable');

element.addEventListener('table-modifiable:change', (event) => {
  console.log(`Column "${event.detail.column}" is now ${event.detail.visible ? 'visible' : 'hidden'}`);
});
```

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--table-modifiable-tool-bg` | (none) | Background color for the modification tools popover |
| `--table-modifiable-tool-color` | (none) | Text color for the modification tools popover |

### Example Styling

You can style the generated elements directly to customize the appearance:

```css
/* Style the toggle button */
.modification-tools-toggle {
  background: #0969da;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.modification-tools-toggle:hover {
  background: #0860ca;
}

/* Style the popover */
.modification-tools {
  background: var(--table-modifiable-tool-bg, white);
  color: var(--table-modifiable-tool-color, #333);
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #d0d7de;
  box-shadow: 0 8px 24px rgba(140, 149, 159, 0.2);
  min-width: 250px;
}

.modification-tools-heading {
  font-weight: bold;
  display: block;
  margin-bottom: 0.75rem;
  font-size: 1.1rem;
}

.modification-tools ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.modification-tools li {
  margin: 0;
}

.modification-tools label {
  cursor: pointer;
  user-select: none;
}
```

## How It Works

This component wraps an HTML table and adds interactive controls to show/hide columns:

1. **Place your table inside the component**: The component uses Light DOM, so your table remains in the regular DOM and is fully accessible.

2. **Specify removable columns**: Use the `removable` attribute to list which columns can be toggled. The column names must match the text content of the `<th>` elements in the first header row exactly.

3. **Set initial visibility**: Optionally use `start-with` to specify which columns should be visible when the page loads. Any columns in `removable` but not in `start-with` will be hidden initially.

4. **Toggle via popover**: The component creates a button that opens a popover with checkboxes. Users can check/uncheck these to show/hide the corresponding columns. The popover uses the native [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API).

5. **Customize labels**: Use the `button-label`, `button-aria-label`, and `tools-label` attributes to customize the text shown to users.

**Note**: This component works with simple tables (one header row, matching body cells). It does not support `colspan` or `rowspan` attributes.

## Advanced Examples

### Table with Multiple Columns

```html
<table-modifiable removable="Product,Price,Stock,Category" start-with="Product,Price">
  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th>Price</th>
        <th>Stock</th>
        <th>Category</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Widget</td>
        <td>$9.99</td>
        <td>42</td>
        <td>Tools</td>
      </tr>
    </tbody>
  </table>
</table-modifiable>
```

### Customizing Labels

```html
<table-modifiable
  removable="Name,Email,Phone,Address"
  start-with="Name,Email"
  button-label="Customize Columns"
  button-aria-label="Customize which columns are visible in the table"
  tools-label="Select Visible Columns">
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Phone</th>
        <th>Address</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Jane Doe</td>
        <td>jane@example.com</td>
        <td>555-5678</td>
        <td>123 Main St</td>
      </tr>
    </tbody>
  </table>
</table-modifiable>
```

## TypeScript

This package ships bundled type definitions (`table-modifiable.d.ts`). You can import the element type, the change event payload, and the registration helper:

```ts
import type {
  TableModifiableElement,
  TableModifiableChangeEvent,
} from '@aarongustafson/table-modifiable/table-modifiable.js';
import { defineTableModifiable } from '@aarongustafson/table-modifiable/define.js';

defineTableModifiable();

const element = document.querySelector('table-modifiable') as TableModifiableElement;

element.addEventListener(
  'table-modifiable:change',
  (event: TableModifiableChangeEvent) => {
    console.log(event.detail.column, event.detail.visible);
  },
);
```

## Browser Support

This component uses modern web standards:
- Custom Elements v1
- ES Modules
- Popover API

For older browsers, you may need polyfills.

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# View demo
open demo/index.html
```

## License

MIT © [Aaron Gustafson](https://www.aaron-gustafson.com/)
