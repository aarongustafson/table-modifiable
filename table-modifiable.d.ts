export interface TableModifiableChangeDetail {
	column: string;
	visible: boolean;
}

export type TableModifiableChangeEvent =
	CustomEvent<TableModifiableChangeDetail>;

export declare class TableModifiableElement extends HTMLElement {
	removable: string | null;
	startWith: string | null;
	buttonLabel: string | null;
	buttonAriaLabel: string | null;
	toolsLabel: string | null;
}

declare global {
	interface HTMLElementTagNameMap {
		'table-modifiable': TableModifiableElement;
	}

	interface GlobalEventHandlersEventMap {
		'table-modifiable:change': TableModifiableChangeEvent;
	}
}
