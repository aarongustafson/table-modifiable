import { beforeAll } from 'vitest';
import { TableModifiableElement } from '../table-modifiable.js';

// Define the custom element before tests run
beforeAll(() => {
	if (!customElements.get('table-modifiable')) {
		customElements.define('table-modifiable', TableModifiableElement);
	}

	// Make the class available globally for testing static methods
	globalThis.TableModifiableElement = TableModifiableElement;
});
