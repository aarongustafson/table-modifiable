import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const read = (path) =>
	readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
const source = await read('table-modifiable.js');
const definition = await read('define.js');
const tokens = [
	'Canvas',
	'CanvasText',
	'ButtonFace',
	'ButtonText',
	'Field',
	'FieldText',
];
// The study's 62 observations reduce to 19 palettes, not 19 OS repainting tests.
const palettes = [
	['#ffffff', '#000000', '#efefef', '#000000', '#ffffff', '#000000'],
	['#121212', '#ffffff', '#6b6b6b', '#ffffff', '#3b3b3b', '#ffffff'],
	['#ffffff', '#000000', '#e9e9ed', '#000000', '#ffffff', '#000000'],
	['#1c1b22', '#fbfbfe', '#2b2a33', '#fbfbfe', '#2b2a33', '#fbfbfe'],
	['#ffffff', '#000000', '#c0c0c0', '#000000d8', '#ffffff', '#000000d8'],
	['#1e1e1e', '#ffffff', '#ffffff3f', '#ffffffd8', '#ffffff3f', '#ffffffd8'],
	['#ffffff', '#000000', '#f0f0f0', '#000000', '#ffffff', '#000000'],
	['#202020', '#ffffff', '#202020', '#ffffff', '#202020', '#ffffff'],
	['#fffaef', '#3d3d3d', '#fffaef', '#202020', '#fffaef', '#3d3d3d'],
	['#2d3236', '#ffffff', '#2d3236', '#b6f6f0', '#2d3236', '#ffffff'],
	['#000000', '#ffffff', '#000000', '#ffee32', '#000000', '#ffffff'],
	['#000000', '#ffffff', '#000000', '#ffee32', '#000000', '#ffee32'],
	['#2d3236', '#ffffff', '#2d3236', '#b6f6f0', '#2d3236', '#b6f6f0'],
	['#fffaef', '#3d3d3d', '#fffaef', '#202020', '#fffaef', '#202020'],
	['#ffffff', '#000000', '#c0c0c0', '#000000', '#ffffff', '#000000'],
	['#000000', '#ffffff', '#c0c0c0', '#000000', '#ffffff', '#000000'],
	['#ffffff', '#000000', '#ffffff', '#000000d8', '#ffffff', '#000000d8'],
	['#282828', '#ffffff', '#202020', '#ffffff', '#202020', '#ffffff'],
	['#202020', '#ffffff', '#00000000', '#ffffff', '#00000000', '#ffffff'],
];

function substitute(css, palette) {
	const colors = Object.fromEntries(
		tokens.map((token, index) => [token.toLowerCase(), palette[index]]),
	);
	return css.replace(
		/\b(CanvasText|Canvas|ButtonFace|ButtonText|FieldText|Field)\b/gi,
		(token) => colors[token.toLowerCase()],
	);
}

async function measurements(locator) {
	return locator.evaluate((element) => {
		const canvas = document.createElement('canvas');
		canvas.width = canvas.height = 1;
		const context = canvas.getContext('2d', { willReadFrequently: true });
		if (!context) throw new Error('Canvas measurement unavailable.');
		const pixel = () => [...context.getImageData(0, 0, 1, 1).data];
		const paint = (color) => {
			context.fillStyle = color;
			context.fillRect(0, 0, 1, 1);
			return pixel();
		};
		const background = (node) => {
			context.clearRect(0, 0, 1, 1);
			const ancestors = [];
			for (; node; node = node.parentElement) ancestors.unshift(node);
			for (const ancestor of ancestors) {
				const style = getComputedStyle(ancestor);
				if (style.opacity !== '1')
					throw new Error('Opacity requires group compositing.');
				if (ancestor.matches('colgroup, col'))
					throw new Error(
						'Column backgrounds need a different fixture.',
					);
				paint(style.backgroundColor);
				if (style.backgroundImage !== 'none') {
					const gradient = style.backgroundImage.match(
						/^linear-gradient\((.+), \1\)$/,
					);
					if (!gradient)
						throw new Error(
							`Unsupported background: ${style.backgroundImage}`,
						);
					paint(gradient[1]);
				}
			}
			if (pixel()[3] !== 255)
				throw new Error('Expected an opaque surface.');
			return pixel();
		};
		const luminance = (rgb) =>
			rgb.slice(0, 3).reduce((sum, channel, index) => {
				const value = channel / 255;
				return (
					sum +
					(value <= 0.04045
						? value / 12.92
						: ((value + 0.055) / 1.055) ** 2.4) *
						[0.2126, 0.7152, 0.0722][index]
				);
			}, 0);
		const ratio = (a, b) => {
			const values = [luminance(a), luminance(b)].sort((a, b) => b - a);
			return (values[0] + 0.05) / (values[1] + 0.05);
		};
		const style = getComputedStyle(element);
		const fill = background(element);
		const foreground = paint(style.color);
		const surround = background(element.parentElement);
		background(element);
		const border = paint(style.borderTopColor);
		const paintsBorder =
			parseFloat(style.borderTopWidth) > 0 &&
			!['none', 'hidden'].includes(style.borderTopStyle);
		return {
			text: ratio(foreground, fill),
			boundary: Math.max(
				ratio(fill, surround),
				paintsBorder ? ratio(border, surround) : 1,
			),
		};
	});
}

async function demo(page, name = 'index.html') {
	await page.route('https://esm.sh/**', (route) =>
		route.fulfill({ contentType: 'text/javascript', body: source }),
	);
	await page.route('https://unpkg.com/**', (route) =>
		route.fulfill({
			contentType: 'text/javascript',
			body: definition.replace(
				"'./table-modifiable.js'",
				"'http://127.0.0.1:4182/table-modifiable.js'",
			),
		}),
	);
	await page.goto(`/demo/${name}`);
	await expect(
		page.locator('.modification-tools-toggle').first(),
	).toBeVisible();
}

test('palette substitution exercises mixed-case and CSSOM-normalized keywords', async ({
	page,
}) => {
	const css =
		'.probe { background: cAnVaS; color: canvastext; border-color: BUTTONFACE; outline-color: buttontext; text-decoration-color: field; column-rule-color: FieldText; }';
	await page.setContent(
		`<style>${css}</style><div class="probe">Palette</div>`,
	);
	const serialized = await page
		.locator('style')
		.evaluate((style) => style.sheet.cssRules[0].cssText);
	const palette = [
		'#010203',
		'#112233',
		'#445566',
		'#778899',
		'#aabbcc',
		'#ddeeff',
	];
	for (const input of [css, serialized.toLowerCase()]) {
		const output = substitute(input, palette);
		for (const value of palette) expect(output).toContain(value);
		await page.locator('style').evaluate((style, css) => {
			style.textContent = css;
		}, output);
		expect(
			await page.locator('.probe').evaluate((element) => {
				const style = getComputedStyle(element);
				return [
					'backgroundColor',
					'color',
					'borderTopColor',
					'outlineColor',
					'textDecorationColor',
					'columnRuleColor',
				].map((property) => style[property]);
			}),
		).toEqual([
			'rgb(1, 2, 3)',
			'rgb(17, 34, 51)',
			'rgb(68, 85, 102)',
			'rgb(119, 136, 153)',
			'rgb(170, 187, 204)',
			'rgb(221, 238, 255)',
		]);
	}
});

test('package entry stays class-only and the definition module registers automatically', async ({
	page,
}) => {
	await page.route('**/fixture.html', (route) =>
		route.fulfill({
			contentType: 'text/html',
			body: '<!doctype html><table-modifiable removable="Name"><table><caption>Contacts</caption><thead><tr><th>Name</th></tr></thead><tbody><tr><td>Alice</td></tr></tbody></table></table-modifiable><script type="module">import { TableModifiableElement } from "/index.js"; window.classOnlyLoaded = typeof TableModifiableElement === "function";</script>',
		}),
	);
	await page.goto('/fixture.html');
	await expect
		.poll(() => page.evaluate(() => window.classOnlyLoaded))
		.toBe(true);
	expect(
		await page.evaluate(() =>
			Boolean(customElements.get('table-modifiable')),
		),
	).toBe(false);
	await expect(page.locator('table-modifiable button')).toHaveCount(0);
	await expect(page.locator('td')).toHaveText('Alice');
	await page.evaluate((path) => import(path), '/define.js');
	await expect(page.locator('.modification-tools-toggle')).toBeVisible();
});

for (const colorScheme of ['light', 'dark']) {
	test(`${colorScheme}: reading surfaces and footer retain text contrast`, async ({
		page,
	}) => {
		await page.emulateMedia({ colorScheme });
		await demo(page);
		for (const selector of [
			'footer',
			'.demo-section',
			'table th',
			'tbody tr:nth-child(odd) td',
			'tbody tr:nth-child(even) td',
			'.event-log',
		]) {
			expect(
				(await measurements(page.locator(selector).first())).text,
				selector,
			).toBeGreaterThanOrEqual(4.5);
		}
	});
	test(`${colorScheme}: native button pair is measured separately`, async ({
		page,
		browserName,
	}) => {
		test.fail(
			browserName === 'webkit' &&
				process.platform === 'linux' &&
				colorScheme === 'dark',
			'Bundled Linux WebKit native dark ButtonText/ButtonFace pair.',
		);
		await page.emulateMedia({ colorScheme });
		await demo(page);
		expect(
			(
				await measurements(
					page.locator('.modification-tools-toggle').first(),
				)
			).text,
		).toBeGreaterThanOrEqual(4.5);
	});
}

test('all 19 palettes cover table, button, top-layer popover, hover and supporting surfaces', async ({
	page,
}) => {
	test.setTimeout(120_000);
	await page.setViewportSize({ width: 1400, height: 900 });
	await demo(page);
	const originals = await page.evaluate(() =>
		[...document.styleSheets].map((sheet, index) => {
			const text = [...sheet.cssRules]
				.map((rule) => rule.cssText)
				.join('\n');
			const replacement = document.createElement('style');
			replacement.dataset.paletteIndex = index;
			sheet.ownerNode.replaceWith(replacement);
			return text;
		}),
	);
	for (const [index, palette] of palettes.entries()) {
		for (const [sheet, css] of originals.entries()) {
			await page.locator(`style[data-palette-index="${sheet}"]`).evaluate(
				(style, css) => {
					style.textContent = css;
				},
				substitute(css, palette),
			);
		}
		for (const selector of [
			'footer',
			'.demo-section',
			'pre',
			'.event-log',
			'.api-reference',
		]) {
			expect(
				(await measurements(page.locator(selector).first())).text,
				`${index}: ${selector}`,
			).toBeGreaterThanOrEqual(4.5);
		}
		for (const host of await page.locator('table-modifiable').all()) {
			for (const cell of await host
				.locator('th:visible, td:visible')
				.all()) {
				expect(
					(await measurements(cell)).text,
					`${index}: cell`,
				).toBeGreaterThanOrEqual(4.5);
			}
			const button = host.locator('.modification-tools-toggle');
			const control = await measurements(button);
			expect(control.text, `${index}: button`).toBeGreaterThanOrEqual(
				4.5,
			);
			expect(
				control.boundary,
				`${index}: button boundary`,
			).toBeGreaterThanOrEqual(3);
			await button.click();
			const panel = host.locator('.modification-tools');
			await expect(panel).toBeVisible();
			expect(
				await panel.evaluate((panel) => panel.matches(':popover-open')),
			).toBe(true);
			expect(
				(await measurements(panel)).text,
				`${index}: popover`,
			).toBeGreaterThanOrEqual(4.5);
			for (const label of await panel.locator('label').all()) {
				expect(
					(await measurements(label)).text,
					`${index}: label`,
				).toBeGreaterThanOrEqual(4.5);
			}
			await panel.locator('label').first().hover();
			expect(
				(await measurements(panel.locator('label').first())).text,
				`${index}: hover`,
			).toBeGreaterThanOrEqual(4.5);
			await page.keyboard.press('Escape');
		}
	}
});

test('author stylesheet hooks change the actual top-layer colors', async ({
	page,
}) => {
	await demo(page);
	const host = page.locator('table-modifiable').first();
	await host.evaluate((host) => {
		host.style.setProperty('--table-modifiable-tool-bg', '#102a43');
		host.style.setProperty('--table-modifiable-tool-color', '#f0f4f8');
	});
	await host.locator('button').click();
	await expect(host.locator('.modification-tools')).toHaveCSS(
		'color',
		'rgb(240, 244, 248)',
	);
	expect(
		(await measurements(host.locator('.modification-tools'))).text,
	).toBeGreaterThanOrEqual(4.5);
});

test('native keyboard popover controls preserve data, focus and a last selectable column', async ({
	page,
	browserName,
}) => {
	await demo(page);
	const host = page.locator('table-modifiable').first();
	const button = host.getByRole('button', {
		name: 'Modify Table',
		exact: true,
	});
	const data = await host.locator('tbody').textContent();
	const tabKey =
		browserName === 'webkit' && process.platform === 'darwin'
			? 'Alt+Tab'
			: 'Tab';
	await button.focus();
	await page.keyboard.press('Enter');
	await page.keyboard.press(tabKey);
	const first = host.getByRole('checkbox', { name: 'Name', exact: true });
	await expect(first).toBeFocused();
	await expect(first).toHaveCSS('outline-style', 'auto');
	await page.keyboard.press('Space');
	await expect(first).not.toBeChecked();
	await expect(host.locator('thead th').first()).toBeHidden();
	await expect(host.locator('tbody td:first-child')).toHaveCount(3);
	for (const cell of await host.locator('tbody td:first-child').all())
		await expect(cell).toBeHidden();
	expect(await host.locator('tbody').textContent()).toBe(data);
	await page.keyboard.press(tabKey);
	await expect(
		host.getByRole('checkbox', { name: 'Email', exact: true }),
	).toBeFocused();
	await page.keyboard.press('Space');
	const last = host.getByRole('checkbox', { name: 'Phone', exact: true });
	await page.keyboard.press(tabKey);
	await expect(last).toBeFocused();
	await page.keyboard.press('Space');
	await expect(last).toBeChecked();
	await expect(host.locator('thead th').last()).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(host.locator('.modification-tools')).toBeHidden();
	await expect(button).toBeFocused();
	await page.keyboard.press('Enter');
	await first.check();
	await expect(host.locator('thead th').first()).toBeVisible();
	expect(await host.locator('tbody').textContent()).toBe(data);
});

test('localized custom controls keep translated names and descriptions', async ({
	page,
}) => {
	await demo(page);
	const host = page.locator('table-modifiable[lang="fr"]');
	const button = host.getByRole('button', {
		name: 'Choisir les colonnes du personnel',
		exact: true,
	});
	await button.click();
	await expect(host.locator('.modification-tools-heading')).toHaveText(
		'Colonnes à afficher',
	);
	await expect(
		host.getByRole('checkbox', { name: 'Courriel', exact: true }),
	).toBeVisible();
	await host
		.getByRole('checkbox', { name: 'Téléphone', exact: true })
		.check();
	await expect(
		host.getByRole('columnheader', { name: 'Téléphone', exact: true }),
	).toBeVisible();
});

test('short localized checkbox labels fit at 320px with enlarged text', async ({
	page,
}) => {
	await page.setViewportSize({ width: 320, height: 900 });
	await demo(page);
	await page.addStyleTag({ content: ':root { font-size: 200%; }' });
	const host = page.locator('table-modifiable[lang="fr"]');
	await host.locator('button').click();
	for (const label of await host.locator('label').all()) {
		const lines = await label.evaluate((label) => {
			const text = [...label.childNodes].find(
				(node) => node.nodeType === Node.TEXT_NODE,
			);
			if (!text) throw new Error('Expected an authored checkbox name.');
			const range = document.createRange();
			range.selectNodeContents(text);
			return [...range.getClientRects()].filter((rect) => rect.width > 0)
				.length;
		});
		expect(lines, await label.textContent()).toBe(1);
	}
});

test('events report literal column text and the demo log stays bounded', async ({
	page,
}) => {
	await demo(page);
	const host = page.locator('#event-demo');
	await host.locator('button').click();
	const box = host.getByRole('checkbox').first();
	await box.click();
	await expect(page.locator('.event-log')).toContainText('"visible": false');
	for (let index = 0; index < 6; index++) await box.click();
	await host.evaluate((host) =>
		host.dispatchEvent(
			new CustomEvent('table-modifiable:change', {
				detail: {
					column: '<img src=x onerror=alert(1)>',
					visible: false,
				},
				bubbles: true,
			}),
		),
	);
	await expect(page.locator('.event-log')).toContainText(
		'<img src=x onerror=alert(1)>',
	);
	await expect(page.locator('.event-log img')).toHaveCount(0);
	await expect(page.locator('.event-log pre')).toHaveCount(5);
});

test('forced colors retain native focus, checkbox state and automatic adjustment', async ({
	page,
	browserName,
}) => {
	test.skip(
		browserName !== 'chromium',
		'Forced-color emulation is Chromium-only.',
	);
	await page.emulateMedia({ forcedColors: 'active' });
	await demo(page);
	const host = page.locator('table-modifiable').first();
	await host.locator('button').focus();
	await page.keyboard.press('Enter');
	const box = host.getByRole('checkbox').first();
	await box.focus();
	await expect(box).toBeChecked();
	await expect(box).toHaveCSS('outline-style', 'auto');
	await expect(box).toHaveCSS('forced-color-adjust', 'auto');
	await page.keyboard.press('Space');
	await expect(box).not.toBeChecked();
	await expect(host.locator('th').first()).toBeHidden();
});

test('increased contrast restores full-strength footer text', async ({
	page,
}) => {
	await page.emulateMedia({ contrast: 'more' });
	await demo(page);
	const color = await page
		.locator('body')
		.evaluate((body) => getComputedStyle(body).color);
	await expect(page.locator('footer')).toHaveCSS('color', color);
});

for (const name of ['index.html', 'esm.html', 'unpkg.html']) {
	test(`${name}: all code/live pairs and named scroll regions reflow`, async ({
		page,
	}) => {
		await demo(page, name);
		await expect(page.locator('.code-demo-pair').first()).toBeVisible();
		for (const pair of await page.locator('.code-demo-pair').all()) {
			await expect(pair.locator(':scope > *')).toHaveCount(2);
			await expect(pair.locator(':scope > pre')).toHaveCount(1);
			await expect(pair.locator(':scope > .demo')).toHaveCount(1);
		}
		for (const width of [1400, 1024, 768, 320]) {
			await page.setViewportSize({ width, height: 900 });
			expect(
				await page.evaluate(
					() => document.documentElement.scrollWidth > innerWidth,
				),
			).toBe(false);
			await expect(page.locator('.code-demo-pair').first()).toHaveCSS(
				'flex-direction',
				width < 768 ? 'column' : 'row',
			);
			if (width === 1400)
				for (const host of await page.locator('table-modifiable').all())
					expect(
						await host.evaluate((host) => host.clientWidth),
					).toBeGreaterThanOrEqual(320);
		}
		await page.addStyleTag({ content: ':root { font-size: 200%; }' });
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth > innerWidth,
			),
		).toBe(false);
		for (const host of await page.locator('table-modifiable').all()) {
			await expect(host).toHaveAttribute('role', 'region');
			await expect(host).toHaveAttribute('tabindex', '0');
			await expect(host).toHaveAccessibleName(/.+/);
			await expect(host.locator('table')).toHaveAccessibleName(/.+/);
			await host.locator('button').click();
			const panel = host.locator('.modification-tools');
			const rect = await panel.boundingBox();
			expect(rect.x).toBeGreaterThanOrEqual(0);
			expect(rect.x + rect.width).toBeLessThanOrEqual(320);
			expect(
				await panel.evaluate(
					(panel) => panel.scrollWidth <= panel.clientWidth,
				),
			).toBe(true);
			for (const label of await panel.locator('label').all())
				expect(
					await label.evaluate(
						(label) => label.getBoundingClientRect().height,
					),
				).toBeGreaterThanOrEqual(44);
			await page.keyboard.press('Escape');
		}
		const first = page.locator('table-modifiable').first();
		await first.scrollIntoViewIfNeeded();
		await first.focus();
		await expect(first).toBeFocused();
		await page.keyboard.press('ArrowRight', { delay: 100 });
		await expect
			.poll(() => first.evaluate((host) => host.scrollLeft))
			.toBeGreaterThan(0);
	});
	for (const failure of ['no JavaScript', 'module failure']) {
		test(`${name}: ${failure} retains all native table data`, async ({
			browser,
		}) => {
			const context = await browser.newContext({
				javaScriptEnabled: failure !== 'no JavaScript',
				viewport: { width: 320, height: 900 },
			});
			try {
				const page = await context.newPage();
				await page.route(/(\.js(\?|$)|esm\.sh|unpkg\.com)/, (route) =>
					route.abort(),
				);
				await page.goto(`http://127.0.0.1:4182/demo/${name}`);
				await expect(
					page.locator('.modification-tools-toggle'),
				).toHaveCount(0);
				await expect(
					page.locator('table').first(),
				).toHaveAccessibleName(/.+/);
				const cells = page.locator('tbody td');
				expect(await cells.count()).toBeGreaterThanOrEqual(9);
				for (const cell of await cells.all())
					await expect(cell).toBeVisible();
				expect(
					await page.evaluate(
						() => document.documentElement.scrollWidth > innerWidth,
					),
				).toBe(false);
			} finally {
				await context.close();
			}
		});
	}
}
