import { TableModifiableElement } from './table-modifiable.js';

export function defineTableModifiable(tagName = 'table-modifiable') {
	const hasWindow = typeof window !== 'undefined';
	const registry = hasWindow ? window.customElements : undefined;

	if (!registry || typeof registry.define !== 'function') {
		return false;
	}

	if (!registry.get(tagName)) {
		registry.define(tagName, TableModifiableElement);
	}

	return true;
}

export function defineComponentName(tagName = 'table-modifiable') {
	return defineTableModifiable(tagName);
}

defineTableModifiable();
