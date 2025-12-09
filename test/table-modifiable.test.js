import { describe, it, expect, beforeEach } from 'vitest';
import { TableModifiableElement } from '../table-modifiable.js';

describe('TableModifiableElement', () => {
	let element;

	beforeEach(() => {
		element = document.createElement('table-modifiable');
		document.body.appendChild(element);
	});

	it('should be defined', () => {
		expect(customElements.get('table-modifiable')).toBe(TableModifiableElement);
	});

	it('should create an instance', () => {
		expect(element).toBeInstanceOf(TableModifiableElement);
		expect(element).toBeInstanceOf(HTMLElement);
	});

	it('should have a shadow root', () => {
		expect(element.shadowRoot).toBeTruthy();
	});

	// Add more tests here
});
