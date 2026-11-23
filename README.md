# table-modifiable Web Component

[![npm version](https://img.shields.io/npm/v/@aarongustafson/table-modifiable.svg)](https://www.npmjs.com/package/@aarongustafson/table-modifiable)
[![CI status](https://img.shields.io/github/actions/workflow/status/aarongustafson/table-modifiable/ci.yml?branch=main&label=CI)](https://github.com/aarongustafson/table-modifiable/actions/workflows/ci.yml)
[![Minified + gzipped size](https://img.shields.io/bundlejs/size/@aarongustafson/table-modifiable?format=minzip&label=min%2Bgzip)](https://bundlejs.com/?q=@aarongustafson/table-modifiable)
[![License](https://img.shields.io/npm/l/@aarongustafson/table-modifiable)](https://github.com/aarongustafson/table-modifiable/blob/main/LICENSE)
[![Type definitions](https://img.shields.io/npm/types/@aarongustafson/table-modifiable)](https://github.com/aarongustafson/table-modifiable/blob/main/table-modifiable.d.ts)

`<table-modifiable>` adds column visibility controls to a native HTML table.
Use a simple table with one header row and matching body cells, without
`colspan` or `rowspan`. Without JavaScript, the authored table keeps all its
columns.

## Demo

[Live Demo](https://aarongustafson.github.io/table-modifiable/demo/) ([Source](./demo/index.html))

The live demo covers [initial visibility](https://aarongustafson.github.io/table-modifiable/demo/#initial-columns),
[French labels](https://aarongustafson.github.io/table-modifiable/demo/#french-labels),
[change events](https://aarongustafson.github.io/table-modifiable/demo/#column-events),
and [an optional palette](https://aarongustafson.github.io/table-modifiable/demo/#custom-palette).

Additional demos:

- [ESM CDN Demo](https://aarongustafson.github.io/table-modifiable/demo/esm.html) ([Source](./demo/esm.html))
- [Unpkg CDN Demo](https://aarongustafson.github.io/table-modifiable/demo/unpkg.html) ([Source](./demo/unpkg.html))

## Installation

```bash
npm install @aarongustafson/table-modifiable
```

## Usage

### Register the element automatically

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

### Register the class yourself

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

### Basic usage

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
        <th scope="col">Name</th>
        <th scope="col">Email</th>
        <th scope="col">Phone</th>
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

## Table requirements and behavior

Place one table inside the component and set `removable` to the columns people
can show or hide. Use a single `thead` row, with a unique, nonempty name in each
`th`, and the same cell order in every `tbody` row. The component matches each
comma-separated name to the first header row’s trimmed text content, exactly
and case-sensitively. It also trims list entries and ignores empty entries.
Names containing commas can’t be represented in these lists.

The component doesn’t account for `colspan` or `rowspan`. Supply a caption and
appropriate header associations; keeping the table in light DOM doesn’t
establish accessibility on its own.

- With no `start-with`, all removable checkboxes start checked. An empty
  `start-with=""` has the same effect. A nonempty list starts only its named
  checkboxes checked; a nonempty value containing only whitespace or commas
  instead starts the first removable checkbox checked.
- Choose at least one valid removable name for `start-with`. An unmatched list
  can start every checkbox unchecked and hide every removable column.
- During user checkbox changes, the component rejects unchecking the last
  checked checkbox. This safeguard counts removable checkboxes, not visible
  table columns, and doesn’t validate initial configuration.
- Columns omitted from `removable` stay outside the controls.
- Hiding sets `display: none` on the matching first-row header and `tbody`
  cells. Showing clears that inline display value. The component doesn’t hide
  `tfoot` cells, remove data, or disable form controls. It isn’t access control.

Without a table or a usable `removable` list, initialization logs a warning and
adds no controls. An unknown column name can still appear as a checkbox, but
can’t change a cell’s visibility. Fix the markup or configuration rather than
relying on these controls to validate it.

## Attributes

| Attribute           | Type     | Default                | Description                                                                 |
| ------------------- | -------- | ---------------------- | --------------------------------------------------------------------------- |
| `removable`         | `string` | (required)             | Comma-separated, exact first-row header names that people can show or hide  |
| `start-with`        | `string` | (all removable)        | Initial checked names from `removable`; see the configuration caveats above |
| `button-label`      | `string` | `"Modify Table"`       | Text label for the toggle button                                            |
| `button-aria-label` | `string` | (same as button-label) | Accessible button name; include the visible `button-label` text             |
| `tools-label`       | `string` | `"Show/Hide Columns"`  | Label text for the popover panel                                            |

## Properties

All five attributes have matching properties (`removable`, `startWith`,
`buttonLabel`, `buttonAriaLabel`, `toolsLabel`) typed as `string | null`.
Changing a property reflects its attribute and schedules a rebuild. Assigning
`null`, `undefined`, or `''` removes it. Missing or empty labels use the defaults
above; a missing or empty `start-with` starts all removable checkboxes checked.

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

Listen on the component or an ancestor; this event bubbles.

| Event                     | Description                                  | Detail                                 |
| ------------------------- | -------------------------------------------- | -------------------------------------- |
| `table-modifiable:change` | Fired after an accepted user checkbox change | `{ column: string, visible: boolean }` |

`column` is the trimmed list entry and `visible` is the checkbox state.
Initialization, rebuilds, and rejected attempts to uncheck the last checked
checkbox don’t fire this event. An accepted change for an unknown header name
still fires it, even though no cells change. Direct changes to cell styles
don’t fire it either.

### Example Event Handling

```javascript
const element = document.querySelector('table-modifiable');

element.addEventListener('table-modifiable:change', (event) => {
  console.log(
    `Column "${event.detail.column}" is now ${event.detail.visible ? 'visible' : 'hidden'}`,
  );
});
```

## Localization

Use `button-label` and `tools-label` to match your application’s vocabulary or
translate its controls. Set `button-aria-label` only when the button needs a
longer name, and include the visible label in that name
([label in name](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html)).
The component has no shared localization object.

Translate the authored headers, caption, region name, and surrounding content
too. Update `removable` and `start-with` to match the translated headers, and
set `lang` on the component when its language differs from the page.
See the [French example](./demo/index.html#french-labels).

## Styling

The component injects no CSS. Style its light-DOM controls with these selectors:

| Selector                                                                        | Element                             |
| ------------------------------------------------------------------------------- | ----------------------------------- |
| `.modification-tools-toggle`                                                    | Native button                       |
| `.modification-tools`                                                           | Native popover                      |
| `.modification-tools-heading`                                                   | Panel label (a span, not a heading) |
| `.modification-tools ul`, `.modification-tools li`, `.modification-tools label` | Checkbox list and labels            |

The following custom properties affect only author CSS that consumes them;
they aren’t injected defaults.

| Property                        | Default | Description                                         |
| ------------------------------- | ------- | --------------------------------------------------- |
| `--table-modifiable-tool-bg`    | (none)  | Background color for the modification tools popover |
| `--table-modifiable-tool-color` | (none)  | Text color for the modification tools popover       |

These are author-stylesheet hooks, not injected component styles. They take
effect when your CSS uses them, as below and in
[the demo table stylesheet](./demo/tables.css). Set foreground and background
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
unrelated page surface. Keep native focus outlines and checkbox states visible.
The [palette example](./demo/index.html#custom-palette) shows paired colors
without changing the translated labels.

The palette example retains the blue control theme with a complete explicit
light pair. Automatic forced-color adjustment is not disabled. This doesn’t
prove that every native platform control palette meets contrast requirements;
test your target browsers and user palettes.

## Accessibility and compatibility

The native [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
handles opening, light dismissal, and Escape. Use Enter or Space on the button,
Tab to reach checkboxes, and Space to change them. Escape returns focus to the
invoking button when focus was inside the popover. The component adds no live
announcement for column changes.

Authors still need useful table headers, a caption, clear labels, readable
colors, and a named, keyboard-focusable scrolling region for wide tables.
Verify that hiding columns doesn’t remove context people need to understand
the remaining data.

The enhancement requires Custom Elements, ES modules, and native Popover API
support. The component doesn’t feature-detect popovers or provide a polyfill.
Before upgrade, without JavaScript, or after module-loading failure, the
authored table remains readable with all columns present. Unsupported popover
interaction after upgrade is a different state: initial column hiding can
still occur. Older-browser and polyfill behavior aren’t verified.

Browser tests cover native buttons, checkboxes, focus, narrow layouts, and
emulated color preferences. They don’t establish assistive-technology support
or native operating-system high-contrast behavior. Test your target environment.

## Reconfiguration and disconnecting

The component observes structural child-list changes under the host and its
five configuration attributes. Rebuilds replace the controls. Disconnecting
cancels pending animation-frame initialization, disconnects the observer,
removes the change listener and generated controls, and clears cached indexes.
It does not restore hidden cells. Keep the table in place while people are
using its controls; manage recovery and focus when your application replaces it.

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
