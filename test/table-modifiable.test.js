import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TableModifiableElement } from '../table-modifiable.js';

describe('TableModifiableElement', () => {
	let element;

	beforeEach(() => {
		// Define the custom element if not already defined
		if (!customElements.get('table-modifiable')) {
			customElements.define('table-modifiable', TableModifiableElement);
		}

		element = document.createElement('table-modifiable');
		document.body.appendChild(element);
	});

	afterEach(() => {
		if (element && element.parentNode) {
			element.remove();
		}
	});

	it('should be defined', () => {
		expect(customElements.get('table-modifiable')).toBe(
			TableModifiableElement,
		);
	});

	it('should create an instance', () => {
		expect(element).toBeInstanceOf(TableModifiableElement);
		expect(element).toBeInstanceOf(HTMLElement);
	});

	it('should not have a shadow root (Light DOM)', () => {
		expect(element.shadowRoot).toBeFalsy();
	});

	it('should render modification tools when table and removable attribute are present', async () => {
		element.setAttribute('removable', 'Name,Email');
		element.innerHTML = `
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Email</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>John</td>
						<td>john@example.com</td>
					</tr>
				</tbody>
			</table>
		`;

		// Wait for initialization
		await new Promise((resolve) => setTimeout(resolve, 10));

		const button = element.querySelector('.modification-tools-toggle');
		const popover = element.querySelector('.modification-tools');
		expect(button).toBeTruthy();
		expect(popover).toBeTruthy();
		expect(popover.getAttribute('popover')).toBe('auto');
	});

	it('should create checkboxes for each removable column', async () => {
		element.setAttribute('removable', 'Name,Email,Phone');
		element.innerHTML = `
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Email</th>
						<th>Phone</th>
					</tr>
				</thead>
			</table>
		`;

		await new Promise((resolve) => setTimeout(resolve, 10));

		const checkboxes = element.querySelectorAll(
			'.modification-tools input[type="checkbox"]',
		);
		expect(checkboxes.length).toBe(3);
		expect(checkboxes[0].value).toBe('Name');
		expect(checkboxes[1].value).toBe('Email');
		expect(checkboxes[2].value).toBe('Phone');
	});

	it('should check all boxes by default when start-with is not specified', async () => {
		element.setAttribute('removable', 'Name,Email');
		element.innerHTML = `
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Email</th>
					</tr>
				</thead>
			</table>
		`;

		await new Promise((resolve) => setTimeout(resolve, 10));

		const checkboxes = element.querySelectorAll(
			'.modification-tools input[type="checkbox"]',
		);
		checkboxes.forEach((checkbox) => {
			expect(checkbox.checked).toBe(true);
		});
	});

	it('should only check specified columns when start-with is provided', async () => {
		element.setAttribute('removable', 'Name,Email,Phone');
		element.setAttribute('start-with', 'Name,Email');
		element.innerHTML = `
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Email</th>
						<th>Phone</th>
					</tr>
				</thead>
			</table>
		`;

		await new Promise((resolve) => setTimeout(resolve, 10));

		const checkboxes = element.querySelectorAll(
			'.modification-tools input[type="checkbox"]',
		);
		expect(checkboxes[0].checked).toBe(true); // Name
		expect(checkboxes[1].checked).toBe(true); // Email
		expect(checkboxes[2].checked).toBe(false); // Phone
	});

	it('should hide columns that are not in start-with', async () => {
		element.setAttribute('removable', 'Name,Email,Phone');
		element.setAttribute('start-with', 'Name');
		element.innerHTML = `
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
						<td>John</td>
						<td>john@example.com</td>
						<td>555-1234</td>
					</tr>
				</tbody>
			</table>
		`;

		await new Promise((resolve) => setTimeout(resolve, 10));

		const table = element.querySelector('table');
		const emailHeader = table.querySelectorAll('th')[1];
		const phoneHeader = table.querySelectorAll('th')[2];
		const emailCell = table.querySelectorAll('td')[1];
		const phoneCell = table.querySelectorAll('td')[2];

		expect(emailHeader.style.display).toBe('none');
		expect(phoneHeader.style.display).toBe('none');
		expect(emailCell.style.display).toBe('none');
		expect(phoneCell.style.display).toBe('none');
	});

	it('should toggle column visibility when checkbox is clicked', async () => {
		element.setAttribute('removable', 'Name,Email');
		element.innerHTML = `
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Email</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>John</td>
						<td>john@example.com</td>
					</tr>
				</tbody>
			</table>
		`;

		await new Promise((resolve) => setTimeout(resolve, 10));

		const table = element.querySelector('table');
		const checkboxes = element.querySelectorAll(
			'.modification-tools input[type="checkbox"]',
		);
		const emailCheckbox = checkboxes[1]; // Email checkbox
		const emailHeader = table.querySelectorAll('th')[1];
		const emailCell = table.querySelectorAll('td')[1];

		// Initially visible
		expect(emailHeader.style.display).not.toBe('none');
		expect(emailCell.style.display).not.toBe('none');

		// Uncheck to hide
		emailCheckbox.checked = false;
		emailCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

		expect(emailHeader.style.display).toBe('none');
		expect(emailCell.style.display).toBe('none');

		// Check to show
		emailCheckbox.checked = true;
		emailCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

		expect(emailHeader.style.display).toBe('');
		expect(emailCell.style.display).toBe('');
	});

	it('should dispatch custom event when column visibility changes', async () => {
		element.setAttribute('removable', 'Name,Email');
		element.innerHTML = `
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Email</th>
					</tr>
				</thead>
			</table>
		`;

		await new Promise((resolve) => setTimeout(resolve, 10));

		const eventHandler = vi.fn();
		element.addEventListener('table-modifiable:change', eventHandler);

		const checkboxes = element.querySelectorAll(
			'.modification-tools input[type="checkbox"]',
		);
		const emailCheckbox = checkboxes[1];

		emailCheckbox.checked = false;
		emailCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

		expect(eventHandler).toHaveBeenCalledOnce();
		expect(eventHandler.mock.calls[0][0].detail).toEqual({
			column: 'Email',
			visible: false,
		});
	});

	it('should handle simple multi-column tables', async () => {
		element.setAttribute('removable', 'Product,Price,Stock,Category');
		element.setAttribute('start-with', 'Product,Price');
		element.innerHTML = `
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
					<tr>
						<td>Gadget</td>
						<td>$19.99</td>
						<td>15</td>
						<td>Electronics</td>
					</tr>
				</tbody>
			</table>
		`;

		await new Promise((resolve) => setTimeout(resolve, 10));

		const table = element.querySelector('table');
		const headerRow = table.querySelector('thead tr');
		const bodyRows = table.querySelectorAll('tbody tr');

		// Stock and Category should be hidden initially
		const stockHeader = headerRow.querySelectorAll('th')[2];
		const categoryHeader = headerRow.querySelectorAll('th')[3];
		const stockCell1 = bodyRows[0].querySelectorAll('td')[2];
		const categoryCell1 = bodyRows[0].querySelectorAll('td')[3];
		const stockCell2 = bodyRows[1].querySelectorAll('td')[2];
		const categoryCell2 = bodyRows[1].querySelectorAll('td')[3];

		expect(stockHeader.style.display).toBe('none');
		expect(categoryHeader.style.display).toBe('none');
		expect(stockCell1.style.display).toBe('none');
		expect(categoryCell1.style.display).toBe('none');
		expect(stockCell2.style.display).toBe('none');
		expect(categoryCell2.style.display).toBe('none');

		// Now show Stock column
		const checkboxes = element.querySelectorAll(
			'.modification-tools input[type="checkbox"]',
		);
		const stockCheckbox = checkboxes[2]; // Stock checkbox
		stockCheckbox.checked = true;
		stockCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

		expect(stockHeader.style.display).toBe('');
		expect(stockCell1.style.display).toBe('');
		expect(stockCell2.style.display).toBe('');
	});

	it('should warn if no table is found', async () => {
		const consoleWarnSpy = vi
			.spyOn(console, 'warn')
			.mockImplementation(() => {});

		element.setAttribute('removable', 'Name,Email');
		// No table in element

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(consoleWarnSpy).toHaveBeenCalledWith(
			'table-modifiable: No table element found',
		);

		consoleWarnSpy.mockRestore();
	});

	it('should warn if removable attribute is missing', async () => {
		const consoleWarnSpy = vi
			.spyOn(console, 'warn')
			.mockImplementation(() => {});

		element.innerHTML = `
			<table>
				<thead>
					<tr>
						<th>Name</th>
					</tr>
				</thead>
			</table>
		`;

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(consoleWarnSpy).toHaveBeenCalledWith(
			'table-modifiable: No removable attribute specified',
		);

		consoleWarnSpy.mockRestore();
	});

	it('should cleanup when removed from DOM', async () => {
		element.setAttribute('removable', 'Name,Email');
		element.innerHTML = `
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Email</th>
					</tr>
				</thead>
			</table>
		`;

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(element.querySelector('.modification-tools')).toBeTruthy();

		element.remove();

		// Tools should be removed
		expect(document.querySelector('.modification-tools')).toBeFalsy();
	});

	it('should use default button label when not specified', async () => {
		element.setAttribute('removable', 'Name,Email');
		element.innerHTML = `
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Email</th>
					</tr>
				</thead>
			</table>
		`;

		await new Promise((resolve) => setTimeout(resolve, 10));

		const button = element.querySelector('.modification-tools-toggle');
		expect(button.textContent).toBe('Modify Table');
		expect(button.getAttribute('aria-label')).toBe('Modify Table');
	});

	it('should use custom button labels when specified', async () => {
		element.setAttribute('removable', 'Name,Email');
		element.setAttribute('button-label', 'Customize');
		element.setAttribute('button-aria-label', 'Customize table columns');
		element.innerHTML = `
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Email</th>
					</tr>
				</thead>
			</table>
		`;

		await new Promise((resolve) => setTimeout(resolve, 10));

		const button = element.querySelector('.modification-tools-toggle');
		expect(button.textContent).toBe('Customize');
		expect(button.getAttribute('aria-label')).toBe(
			'Customize table columns',
		);
	});

	it('should use custom tools label when specified', async () => {
		element.setAttribute('removable', 'Name,Email');
		element.setAttribute('tools-label', 'Select Columns');
		element.innerHTML = `
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Email</th>
					</tr>
				</thead>
			</table>
		`;

		await new Promise((resolve) => setTimeout(resolve, 10));

		const heading = element.querySelector('.modification-tools-heading');
		expect(heading.textContent).toBe('Select Columns');
	});

	it('should use default tools label when not specified', async () => {
		element.setAttribute('removable', 'Name,Email');
		element.innerHTML = `
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Email</th>
					</tr>
				</thead>
			</table>
		`;

		await new Promise((resolve) => setTimeout(resolve, 10));

		const heading = element.querySelector('.modification-tools-heading');
		expect(heading.textContent).toBe('Show/Hide Columns');
	});

	it('should prevent unchecking the last visible column', async () => {
		element.setAttribute('removable', 'Name,Email,Phone');
		element.setAttribute('start-with', 'Name');
		element.innerHTML = `
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
						<td>John</td>
						<td>john@example.com</td>
						<td>555-1234</td>
					</tr>
				</tbody>
			</table>
		`;

		await new Promise((resolve) => setTimeout(resolve, 10));

		const checkboxes = element.querySelectorAll(
			'.modification-tools input[type="checkbox"]',
		);
		const nameCheckbox = checkboxes[0]; // Only checked column

		// Try to uncheck the last visible column
		nameCheckbox.checked = false;
		nameCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

		// Should remain checked
		expect(nameCheckbox.checked).toBe(true);

		// Column should still be visible
		const table = element.querySelector('table');
		const nameHeader = table.querySelector('thead th');
		expect(nameHeader.style.display).not.toBe('none');
	});

	it('should allow unchecking when multiple columns are visible', async () => {
		element.setAttribute('removable', 'Name,Email');
		element.innerHTML = `
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Email</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>John</td>
						<td>john@example.com</td>
					</tr>
				</tbody>
			</table>
		`;

		await new Promise((resolve) => setTimeout(resolve, 10));

		const checkboxes = element.querySelectorAll(
			'.modification-tools input[type="checkbox"]',
		);
		const nameCheckbox = checkboxes[0];
		const emailCheckbox = checkboxes[1];

		// Both should be checked initially
		expect(nameCheckbox.checked).toBe(true);
		expect(emailCheckbox.checked).toBe(true);

		// Uncheck one (should work since there's another visible)
		nameCheckbox.checked = false;
		nameCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

		expect(nameCheckbox.checked).toBe(false);

		// Now try to uncheck the last one (should be prevented)
		emailCheckbox.checked = false;
		emailCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

		expect(emailCheckbox.checked).toBe(true);
	});
});
