const TABLE_STRUCTURE_TAGS = new Set([
	'TABLE',
	'CAPTION',
	'COLGROUP',
	'COL',
	'THEAD',
	'TBODY',
	'TFOOT',
	'TR',
	'TH',
	'TD',
]);

const CONTROL_DATA_ATTRIBUTE = 'data-table-modifiable-control';

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
	static _getUniqueId() {
		return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
	}

	static _parseColumns(value) {
		if (!value) {
			return [];
		}
		return value
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
	}

	static _isTableStructureNode(node) {
		return (
			node instanceof Element && TABLE_STRUCTURE_TAGS.has(node.tagName)
		);
	}

	static _isGeneratedControlNode(node) {
		if (!(node instanceof Element)) {
			return false;
		}
		if (node.hasAttribute(CONTROL_DATA_ATTRIBUTE)) {
			return true;
		}
		return (
			node.classList.contains('modification-tools') ||
			node.classList.contains('modification-tools-toggle')
		);
	}

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
		this._handleChange = null;
		this._columnIndexCache = new Map();
		this._pendingInitFrame = null;
		this._mutationObserver = null;
		this._suppressMutationObserver = false;
	}

	connectedCallback() {
		this._upgradeProperty('removable');
		this._upgradeProperty('startWith');
		this._upgradeProperty('buttonLabel');
		this._upgradeProperty('buttonAriaLabel');
		this._upgradeProperty('toolsLabel');

		this._setupMutationObserver();
		this._scheduleInitialization();
	}

	disconnectedCallback() {
		this._teardownMutationObserver();
		if (this._pendingInitFrame !== null) {
			cancelAnimationFrame(this._pendingInitFrame);
			this._pendingInitFrame = null;
		}
		this._withMutationSuppressed(() => {
			this._cleanup();
		});
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) {
			return;
		}
		this._scheduleInitialization();
	}

	get removable() {
		return this.getAttribute('removable');
	}

	set removable(value) {
		this._reflectStringAttribute('removable', value);
	}

	get startWith() {
		return this.getAttribute('start-with');
	}

	set startWith(value) {
		this._reflectStringAttribute('start-with', value);
	}

	get buttonLabel() {
		return this.getAttribute('button-label');
	}

	set buttonLabel(value) {
		this._reflectStringAttribute('button-label', value);
	}

	get buttonAriaLabel() {
		return this.getAttribute('button-aria-label');
	}

	set buttonAriaLabel(value) {
		this._reflectStringAttribute('button-aria-label', value);
	}

	get toolsLabel() {
		return this.getAttribute('tools-label');
	}

	set toolsLabel(value) {
		this._reflectStringAttribute('tools-label', value);
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

		const removableColumns =
			TableModifiableElement._parseColumns(removable);
		if (removableColumns.length === 0) {
			console.warn('table-modifiable: No columns specified in removable');
			return;
		}
		const startWithColumns = startWith
			? TableModifiableElement._parseColumns(startWith)
			: removableColumns;
		if (startWithColumns.length === 0) {
			startWithColumns.push(removableColumns[0]);
		}

		this._createTools(removableColumns, startWithColumns);
		this._initialized = true;
	}

	_cleanup() {
		if (this._handleChange && this._toolsElement) {
			this._toolsElement.removeEventListener(
				'change',
				this._handleChange,
			);
		}
		if (this._toolsElement?.parentNode) {
			this._toolsElement.remove();
		}
		if (this._toggleButton?.parentNode) {
			this._toggleButton.remove();
		}
		this._toolsElement = null;
		this._toggleButton = null;
		this._handleChange = null;
		this._columnIndexCache.clear();
		this._table = null;
		this._initialized = false;
	}

	_createTools(removableColumns, startWithColumns) {
		const buttonLabel = this.getAttribute('button-label') || 'Modify Table';
		const buttonAriaLabel =
			this.getAttribute('button-aria-label') || buttonLabel;
		const toolsLabel =
			this.getAttribute('tools-label') || 'Show/Hide Columns';
		const popoverId = `popover-${TableModifiableElement._getUniqueId()}`;

		// Create the toggle button
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'modification-tools-toggle';
		button.textContent = buttonLabel;
		button.setAttribute('aria-label', buttonAriaLabel);
		button.setAttribute('popovertarget', popoverId);
		button.setAttribute(CONTROL_DATA_ATTRIBUTE, 'true');

		// Create the popover container
		const popover = document.createElement('div');
		popover.id = popoverId;
		popover.className = 'modification-tools';
		popover.setAttribute('popover', 'auto');
		popover.setAttribute(CONTROL_DATA_ATTRIBUTE, 'true');

		const heading = document.createElement('span');
		heading.className = 'modification-tools-heading';
		heading.textContent = toolsLabel;
		popover.appendChild(heading);

		const ul = document.createElement('ul');
		const fragment = document.createDocumentFragment();
		const uniqueId = TableModifiableElement._getUniqueId();

		// Create checkboxes for each removable column
		removableColumns.forEach((columnText, i) => {
			const li = document.createElement('li');
			const label = document.createElement('label');
			const input = document.createElement('input');
			const id = `column-${uniqueId}-${i}`;

			input.type = 'checkbox';
			input.id = id;
			input.value = columnText;
			input.checked = startWithColumns.includes(columnText);

			label.setAttribute('for', id);
			label.appendChild(input);
			label.appendChild(document.createTextNode(' ' + columnText));

			li.appendChild(label);
			fragment.appendChild(li);
		});

		ul.appendChild(fragment);
		popover.appendChild(ul);

		// Store bound handler for cleanup
		this._handleChange = this._onCheckboxChange.bind(this);
		popover.addEventListener('change', this._handleChange);

		// Insert button and popover before the table
		const tableParent = this._table.parentNode;
		if (!tableParent) {
			console.warn('table-modifiable: Table has no parent node');
			return;
		}
		const controlsFragment = document.createDocumentFragment();
		controlsFragment.appendChild(button);
		controlsFragment.appendChild(popover);
		tableParent.insertBefore(controlsFragment, this._table);

		this._toggleButton = button;
		this._toolsElement = popover;

		// Build column index cache and trigger initial visibility
		const headerRow = this._table.querySelector('thead tr');
		if (headerRow) {
			const headers = headerRow.children;
			for (let i = 0; i < headers.length; i++) {
				const text = headers[i].textContent.trim();
				this._columnIndexCache.set(text, i);
			}
		}

		// Trigger initial visibility for unchecked columns
		const checkboxes = ul.querySelectorAll('input[type="checkbox"]');
		for (const input of checkboxes) {
			if (!input.checked) {
				this._toggleColumn(input.value, false);
			}
		}
	}

	_onCheckboxChange(event) {
		if (event.target.type === 'checkbox') {
			const columnText = event.target.value;
			const isChecked = event.target.checked;

			// Prevent unchecking if this is the last checked column
			if (!isChecked) {
				const allCheckboxes = this._toolsElement.querySelectorAll(
					'input[type="checkbox"]',
				);
				const checkedCount = Array.from(allCheckboxes).filter(
					(cb) => cb.checked,
				).length;

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
		if (!this._table) {
			return;
		}
		// Use cached column index if available
		let columnIndex = this._columnIndexCache.get(columnText);

		if (columnIndex === undefined) {
			// Find the header with matching text in the first header row
			const headerRow = this._table.querySelector('thead tr');
			if (!headerRow) {
				console.warn('table-modifiable: No header row found');
				return;
			}

			const headers = headerRow.children;
			columnIndex = -1;

			for (let i = 0; i < headers.length; i++) {
				if (headers[i].textContent.trim() === columnText) {
					columnIndex = i;
					this._columnIndexCache.set(columnText, i);
					break;
				}
			}

			if (columnIndex === -1) {
				console.warn(
					`table-modifiable: Header "${columnText}" not found`,
				);
				return;
			}
		}

		const displayValue = show ? '' : 'none';

		// Toggle the header cell
		const headerRow = this._table.querySelector('thead tr');
		if (headerRow?.children[columnIndex]) {
			headerRow.children[columnIndex].style.display = displayValue;
		}

		// Toggle all cells in this column across all body rows
		const rows = this._table.querySelectorAll('tbody tr');
		for (const row of rows) {
			if (row.children[columnIndex]) {
				row.children[columnIndex].style.display = displayValue;
			}
		}
	}

	_scheduleInitialization() {
		if (!this.isConnected) {
			return;
		}

		if (this._pendingInitFrame !== null) {
			cancelAnimationFrame(this._pendingInitFrame);
		}

		this._pendingInitFrame = requestAnimationFrame(() => {
			this._pendingInitFrame = null;
			this._withMutationSuppressed(() => {
				this._cleanup();
				this._initialize();
			});
		});
	}

	_setupMutationObserver() {
		if (this._mutationObserver) {
			this._mutationObserver.disconnect();
		}

		this._mutationObserver = new MutationObserver((mutations) => {
			if (this._suppressMutationObserver) {
				return;
			}
			for (const mutation of mutations) {
				if (
					mutation.type === 'childList' &&
					this._mutationTouchesTable(mutation)
				) {
					this._scheduleInitialization();
					return;
				}
			}
		});

		this._mutationObserver.observe(this, {
			childList: true,
			subtree: true,
		});
	}

	_teardownMutationObserver() {
		if (this._mutationObserver) {
			this._mutationObserver.disconnect();
			this._mutationObserver = null;
		}
	}

	_withMutationSuppressed(callback) {
		const wasSuppressed = this._suppressMutationObserver;
		this._suppressMutationObserver = true;
		try {
			callback();
		} finally {
			this._suppressMutationObserver = wasSuppressed;
		}
	}

	_reflectStringAttribute(attrName, value) {
		if (value === null || value === undefined || value === '') {
			this.removeAttribute(attrName);
			return;
		}
		this.setAttribute(attrName, String(value));
	}

	_mutationTouchesTable(mutation) {
		if (TableModifiableElement._isTableStructureNode(mutation.target)) {
			return true;
		}

		const nodes = [
			...mutation.addedNodes,
			...mutation.removedNodes,
		];

		for (const node of nodes) {
			if (TableModifiableElement._isGeneratedControlNode(node)) {
				continue;
			}
			if (TableModifiableElement._isTableStructureNode(node)) {
				return true;
			}
		}

		return false;
	}

	_upgradeProperty(prop) {
		if (Object.prototype.hasOwnProperty.call(this, prop)) {
			const value = this[prop];
			delete this[prop];
			this[prop] = value;
		}
	}
}
