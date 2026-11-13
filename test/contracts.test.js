import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

it('documents constructor reuse restrictions for registration helpers', async () => {
	const manifest = JSON.parse(await read('../custom-elements.json'));
	const helpers = manifest.modules.find(
		(entry) => entry.path === 'define.js',
	).declarations;
	const description = helpers.find(
		(entry) => entry.name === 'defineTableModifiable',
	).description;
	expect(description).toContain('NotSupportedError');
	expect(description).toContain('class-only');
	expect(description).toContain('table-modifiable.js');
	expect(
		helpers.find((entry) => entry.name === 'defineComponentName')
			.description,
	).toContain('registration restrictions');
});

it('describes real reflected properties, author-style hooks and registration exports', async () => {
	const manifest = JSON.parse(await read('../custom-elements.json'));
	expect(manifest).not.toHaveProperty('readme');
	const component = manifest.modules.find(
		(entry) => entry.path === 'table-modifiable.js',
	).declarations[0];
	const declarations = await read('../table-modifiable.d.ts');
	for (const [attribute, property] of [
		['removable', 'removable'],
		['start-with', 'startWith'],
		['button-label', 'buttonLabel'],
		['button-aria-label', 'buttonAriaLabel'],
		['tools-label', 'toolsLabel'],
	]) {
		expect(
			component.attributes.find((entry) => entry.name === attribute)
				.fieldName,
		).toBe(property);
		const member = component.members.find(
			(entry) => entry.name === property,
		);
		expect(member.type.text).toBe('string | null');
		expect(member.reflects).toBe(true);
		expect(declarations).toContain(`${property}: string | null`);
	}
	expect(component.slots || []).toEqual([]);
	expect(component.cssProperties.map((entry) => entry.name)).toEqual([
		'--table-modifiable-tool-bg',
		'--table-modifiable-tool-color',
	]);
	const helper = manifest.modules.find((entry) => entry.path === 'define.js');
	expect(helper.exports.map((entry) => entry.name)).toEqual(
		expect.arrayContaining([
			'defineTableModifiable',
			'defineComponentName',
		]),
	);
	expect(manifest.modules.some((entry) => entry.path === 'index.js')).toBe(
		true,
	);
});
