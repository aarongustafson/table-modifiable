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

Import the definition module to register `<table-modifiable>` automatically:

```javascript
import '@aarongustafson/table-modifiable/define.js';
```

Or use the define-only script in HTML:

```html
<script
  src="./node_modules/@aarongustafson/table-modifiable/define.js"
  type="module"
></script>
```

### Option 2: Import the class and define manually

Import the class and define the custom element with your preferred tag name:

```javascript
import { TableModifiableElement } from '@aarongustafson/table-modifiable/table-modifiable.js';

customElements.define('my-custom-name', TableModifiableElement);
```

The package root and `table-modifiable.js` export only the class; neither
registers it. Importing `define.js` already calls its helper for the default tag.
You can call that helper again for the same tag safely:

```javascript
import { defineTableModifiable } from '@aarongustafson/table-modifiable/define.js';

defineTableModifiable();
```

For a custom tag, use the class-only import and register the class once, as
shown above. The helper returns `false` without a usable browser registry.

### Basic Example

```html
<table-modifiable
  removable="Name,Email,Phone"
  start-with="Name,Email"
  role="region"
  aria-label="Contact table"
  tabindex="0"
>
  <table>
    <caption>
      Contact directory
    </caption>
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

Before enhancement, every column is readable. JavaScript adds a native toggle
button and popover with labeled checkboxes, then applies `start-with`.
Provide a caption and a named, keyboard-focusable scrolling region when the
table can overflow. See [the demo table styles](./demo/tables.css).

## Attributes

| Attribute           | Type     | Default                | Description                                                                                                                         |
| ------------------- | -------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `removable`         | `string` | (required)             | Comma-separated list of all column names that can be shown/hidden                                                                   |
| `start-with`        | `string` | (all removable)        | Comma-separated list of which columns should be visible by default. If not specified, all removable columns will be shown initially |
| `button-label`      | `string` | `"Modify Table"`       | Text label for the toggle button                                                                                                    |
| `button-aria-label` | `string` | (same as button-label) | Accessible label for the toggle button. Use this to provide a more descriptive label for screen readers if needed                   |
| `tools-label`       | `string` | `"Show/Hide Columns"`  | Heading text for the popover panel                                                                                                  |

## Properties

All five attributes have matching properties (`removable`, `startWith`,
`buttonLabel`, `buttonAriaLabel`, `toolsLabel`) typed as `string | null`.
Setting a property reflects its attribute and schedules a rebuild. Assigning
`null`, `undefined`, or `''` removes it. Missing or empty labels use the defaults
above; a missing or empty `start-with` shows all removable columns.

Configure these values before initialization. Rebuilding does not preserve an
open popover, checkbox focus, or user choices, and cleanup does not clear
previously hidden cell styles. Don’t use reconfiguration to preserve a customized
view.

```javascript
const modifiable = document.querySelector('table-modifiable');
modifiable.removable = 'Name,Email';
modifiable.startWith = 'Name';
```

## Events

The component fires custom events that you can listen to:

| Event                     | Description                                 | Detail                                 |
| ------------------------- | ------------------------------------------- | -------------------------------------- |
| `table-modifiable:change` | Fired when a column's visibility is toggled | `{ column: string, visible: boolean }` |

### Example Event Handling

```javascript
const element = document.querySelector('table-modifiable');

element.addEventListener('table-modifiable:change', (event) => {
  console.log(
    `Column "${event.detail.column}" is now ${event.detail.visible ? 'visible' : 'hidden'}`,
  );
});
```

## CSS Custom Properties

| Property                        | Default | Description                                         |
| ------------------------------- | ------- | --------------------------------------------------- |
| `--table-modifiable-tool-bg`    | (none)  | Background color for the modification tools popover |
| `--table-modifiable-tool-color` | (none)  | Text color for the modification tools popover       |

These are author-stylesheet hooks, not injected component styles. They take
effect when your CSS uses them, as below and in
[the shared demo stylesheet](./demo/tables.css). Set foreground and background
together and test them on the actual top-layer popover, including native
checkboxes.

### Example Styling

You can style the generated elements directly to customize the appearance:

```css
/* Style the toggle button */
.modification-tools-toggle {
  background-color: Canvas;
  background-image: linear-gradient(ButtonFace, ButtonFace);
  color: ButtonText;
  border: 1px solid currentColor;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  max-inline-size: 100%;
  font: inherit;
  cursor: pointer;
}

/* Style the popover */
.modification-tools {
  box-sizing: border-box;
  background-color: Canvas;
  background-image: linear-gradient(
    var(--table-modifiable-tool-bg, Canvas),
    var(--table-modifiable-tool-bg, Canvas)
  );
  color: var(--table-modifiable-tool-color, CanvasText);
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid currentColor;
  inline-size: max-content;
  min-inline-size: min(16rem, calc(100vw - 1rem));
  max-inline-size: calc(100vw - 1rem);
  max-block-size: calc(100dvb - 2rem);
  overflow: auto;
  overflow-wrap: anywhere;
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
  display: flex;
  align-items: start;
  gap: 0.5rem;
  min-block-size: 2.75rem;
  margin: 0;
  padding: 0.25rem;
}
```

The Canvas backing keeps translucent system surfaces from compositing over an
unrelated page surface. The demos use Canvas/CanvasText for table data and the
popover, ButtonFace/ButtonText for controls, and Field/FieldText for code and
event output. Supporting footer text uses an 80% foreground mix on Canvas,
with full-strength text in forced colors and increased contrast. Native focus
outlines and checkbox states remain under browser control.

The localized example retains the blue control theme with a complete explicit
light pair. Automatic forced-color adjustment is not disabled. This doesn’t
prove that every native platform control palette meets contrast requirements;
test your target browsers and user palettes.

## How It Works

This component wraps an HTML table and adds interactive controls to show/hide columns:

1. **Place your table inside the component**: The component uses Light DOM, so your table remains in the regular DOM and is fully accessible.

2. **Specify removable columns**: Use the `removable` attribute to list which columns can be toggled. The column names must match the text content of the `<th>` elements in the first header row exactly.

3. **Set initial visibility**: Optionally use `start-with` to specify which columns should be visible when the page loads. Any columns in `removable` but not in `start-with` will be hidden initially.

4. **Toggle via popover**: The component creates a button that opens a popover with checkboxes. Users can check/uncheck these to show/hide the corresponding columns. The popover uses the native [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API).

5. **Customize labels**: Use the `button-label`, `button-aria-label`, and `tools-label` attributes to customize the text shown to users.

**Note**: This component works with simple tables (one header row, matching body cells). It does not support `colspan` or `rowspan` attributes.

Names are trimmed and case-sensitive. Use real, unique first-row header names
in both lists. Unknown `start-with` values can hide every removable column;
the last-checkbox safeguard applies to user changes, not invalid initial
configuration. Columns omitted from `removable` stay outside these controls.

Hiding sets `display: none` on the header and matching `tbody` cells. It does
not remove data, disable form controls, hide `tfoot` cells, or provide access
control. Initial hiding and rejected attempts to uncheck the last checkbox
do not fire change events.

## Accessibility and Lifecycle

The browser handles popover activation, keyboard navigation, Escape, and focus
return. The demos verify native button/checkbox operation, retained table data,
stable labels, and focus. They do not add duplicate live announcements for
column changes. The panel label is a styled span, not a generated heading.

Translate `button-label`, `button-aria-label`, `tools-label`, and the authored
column names together. A longer accessible button name should include its
visible label. The [French demo](./demo/index.html) shows those labels with
authored table and region names.

The component observes structural child-list changes under the host and its
five configuration attributes. Rebuilds replace the controls. Disconnecting
cancels pending animation-frame initialization, disconnects the observer,
removes the change listener and generated controls, and clears cached indexes.
It does not restore hidden cells. Keep the table in place while people are
using its controls; manage recovery and focus when your application replaces it.

Without JavaScript or after module-loading failure, the authored table remains
readable with all columns present. Native Popover API support is required for
the enhanced popup interaction; older-browser/polyfill behavior is not verified.
Keyboard, zoom, forced colors, and assistive-technology testing in your target
environment remains necessary. Automated checks alone do not establish
conformance.

## Advanced Examples

### Table with Multiple Columns

```html
<table-modifiable
  removable="Product,Price,Stock,Category"
  start-with="Product,Price"
>
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
  tools-label="Select Visible Columns"
>
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

const element = document.querySelector(
  'table-modifiable',
) as TableModifiableElement;

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

# Run browser regressions (install engines once)
npx playwright install chromium firefox webkit
npm run test:browser

# Serve the demo
node scripts/serve.js
# Open http://127.0.0.1:4182/demo/index.html
```

## License

MIT © [Aaron Gustafson](https://www.aaron-gustafson.com/)
