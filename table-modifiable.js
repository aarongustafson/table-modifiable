/**
 * TableModifiableElement - A web component that enables users to hide & show columns on an HTML table.
 *
 * @element table-modifiable
 *
 * @attr {string} removable - Comma-separated list of all column names that are removable
 * @attr {string} start-with - Comma-separated list of which columns should be shown by default
 * @attr {string} button-label - Label for the toggle button (default: "Modify Table")
 * @attr {string} button-aria-label - Accessible label for the toggle button (optional, defaults to button-label)
 * @attr {string} tools-label - Label for the tools popover heading (default: "Show/Hide Columns")
 *
 * @fires table-modifiable:change - Fired when a column visibility is toggled
 *
 * @slot - Default slot for the table element
 *
 * @cssprop --table-modifiable-tool-bg - Background color for the modification tools
 * @cssprop --table-modifiable-tool-color - Text color for the modification tools
 */
export class TableModifiableElement extends HTMLElement {
	static get observedAttributes() {
		return [
			'removable',
			'start-with',
			'button-label',
			'button-aria-label',
			'tools-label',
		];
	}

	constructor() {
		super();
		this._toolsElement = null;
		this._toggleButton = null;
		this._table = null;
		this._initialized = false;
	}

	connectedCallback() {
		// Wait for next tick to ensure table is in the DOM
		setTimeout(() => this._initialize(), 0);
	}

	disconnectedCallback() {
		this._cleanup();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue !== newValue && this._initialized) {
			this._cleanup();
			this._initialize();
		}
	}

	_initialize() {
		this._table = this.querySelector('table');

		if (!this._table) {
			console.warn('table-modifiable: No table element found');
			return;
		}

		const removable = this.getAttribute('removable');
		const startWith = this.getAttribute('start-with');

		if (!removable) {
			console.warn('table-modifiable: No removable attribute specified');
			return;
		}

		const removableColumns = removable.split(',').map((s) => s.trim());
		const startWithColumns = startWith
			? startWith.split(',').map((s) => s.trim())
			: removableColumns;

		this._createTools(removableColumns, startWithColumns);
		this._initialized = true;
	}

	_cleanup() {
		if (this._toolsElement && this._toolsElement.parentNode) {
			this._toolsElement.removeEventListener(
				'change',
				this._handleChange,
			);
			this._toolsElement.remove();
		}
		if (this._toggleButton && this._toggleButton.parentNode) {
			this._toggleButton.remove();
		}
		this._toolsElement = null;
		this._toggleButton = null;
		this._initialized = false;
	}

	_createTools(removableColumns, startWithColumns) {
		const buttonLabel = this.getAttribute('button-label') || 'Modify Table';
		const buttonAriaLabel =
			this.getAttribute('button-aria-label') || buttonLabel;
		const toolsLabel =
			this.getAttribute('tools-label') || 'Show/Hide Columns';
		const popoverId = `popover-${this._getUniqueId()}`;

		// Create the toggle button
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'modification-tools-toggle';
		button.textContent = buttonLabel;
		button.setAttribute('aria-label', buttonAriaLabel);
		button.setAttribute('popovertarget', popoverId);

		// Create the popover container
		const popover = document.createElement('div');
		popover.id = popoverId;
		popover.className = 'modification-tools';
		popover.setAttribute('popover', 'auto');

		const heading = document.createElement('span');
		heading.className = 'modification-tools-heading';
		heading.textContent = toolsLabel;
		popover.appendChild(heading);

		const ul = document.createElement('ul');

		// Create checkboxes for each removable column
		removableColumns.forEach((columnText, i) => {
			const li = document.createElement('li');
			const label = document.createElement('label');
			const input = document.createElement('input');
			const id = `column-${this._getUniqueId()}-${i}`;

			input.type = 'checkbox';
			input.id = id;
			input.value = columnText;
			input.checked = startWithColumns.includes(columnText);

			label.setAttribute('for', id);
			label.appendChild(input);
			label.appendChild(document.createTextNode(' ' + columnText));

			li.appendChild(label);
			ul.appendChild(li);
		});

		popover.appendChild(ul);

		// Store bound handler for cleanup
		this._handleChange = this._onCheckboxChange.bind(this);
		popover.addEventListener('change', this._handleChange);

		// Insert button and popover before the table
		this._table.parentNode.insertBefore(button, this._table);
		this._table.parentNode.insertBefore(popover, this._table);

		this._toggleButton = button;
		this._toolsElement = popover;

		// Trigger initial visibility for unchecked columns
		ul.querySelectorAll('input[type="checkbox"]').forEach((input) => {
			if (!input.checked) {
				this._toggleColumn(input.value, false);
			}
		});
	}

	_onCheckboxChange(event) {
		if (event.target.type === 'checkbox') {
			const columnText = event.target.value;
			const isChecked = event.target.checked;

			// Prevent unchecking if this is the last checked column
			if (!isChecked) {
				const allCheckboxes = this._toolsElement.querySelectorAll('input[type="checkbox"]');
				const checkedCount = Array.from(allCheckboxes).filter(cb => cb.checked).length;
				
				if (checkedCount === 0) {
					// Revert the checkbox state
					event.target.checked = true;
					return;
				}
			}

			this._toggleColumn(columnText, isChecked);

			// Dispatch custom event
			this.dispatchEvent(
				new CustomEvent('table-modifiable:change', {
					detail: {
						column: columnText,
						visible: isChecked,
					},
					bubbles: true,
				}),
			);
		}
	}

	_toggleColumn(columnText, show) {
		// Find the header with matching text in the first header row
		const headerRow = this._table.querySelector('thead tr');
		if (!headerRow) {
			console.warn('table-modifiable: No header row found');
			return;
		}

		const headers = Array.from(headerRow.children);
		let columnIndex = -1;

		for (let i = 0; i < headers.length; i++) {
			if (headers[i].textContent.trim() === columnText) {
				columnIndex = i;
				break;
			}
		}

		if (columnIndex === -1) {
			console.warn(`table-modifiable: Header "${columnText}" not found`);
			return;
		}

		// Toggle the header cell
		headers[columnIndex].style.display = show ? '' : 'none';

		// Toggle all cells in this column across all body rows
		const rows = this._table.querySelectorAll('tbody tr');
		rows.forEach((row) => {
			const cells = Array.from(row.children);
			if (cells[columnIndex]) {
				cells[columnIndex].style.display = show ? '' : 'none';
			}
		});
	}

	_getUniqueId() {
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}
}
