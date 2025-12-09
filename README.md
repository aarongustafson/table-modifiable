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

### Basic Example

```html
<table-modifiable>
  <!-- Your content here -->
</table-modifiable>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `example-attribute` | `string` | `""` | Description of the attribute |

## Events

The component fires custom events that you can listen to:

| Event | Description | Detail |
|-------|-------------|--------|
| `table-modifiable:event` | Fired when something happens | `{ data }` |

### Example Event Handling

```javascript
const element = document.querySelector('table-modifiable');

element.addEventListener('table-modifiable:event', (event) => {
  console.log('Event fired:', event.detail);
});
```

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--example-color` | `#000` | Example color property |

### Example Styling

```css
table-modifiable {
  --example-color: #ff0000;
}
```

## Browser Support

This component uses modern web standards:
- Custom Elements v1
- Shadow DOM v1
- ES Modules

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
