import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';
import { build } from 'esbuild';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const SOURCE = `
    import { Observer } from '@playcanvas/observer';
    import { History } from './src/editor-api/history';
    import { AttributesInspector } from './src/editor/inspector/attributes-inspector';

    window.numeric = (values, type = 'slider', args = {}) => {
        const history = new History();
        let changes = 0;
        history.on('add', () => changes++);
        const observers = values.map(reflectivity => new Observer({ data: { reflectivity } }));
        const inspector = new AttributesInspector({ history });
        const field = inspector.createFieldForAttribute({
            type, path: 'data.reflectivity',
            args: { min: 0, max: 8, precision: 3, step: 0.01, ...args }
        });
        document.body.replaceChildren(field.dom);
        field.link(observers, 'data.reflectivity');
        window.numericState = () => ({
            values: observers.map(observer => observer.get('data.reflectivity')),
            changes
        });
        window.numericUndo = () => history.undo();
        window.numericRedo = () => history.redo();
    };
`;

type NumericWindow = typeof window & {
    numeric: (values: number[], type?: string, args?: { readOnly?: boolean; enabled?: boolean }) => void;
    numericState: () => { values: number[]; changes: number };
    numericUndo: () => void;
    numericRedo: () => void;
};

let bundle: string;

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeAll(async () => {
    const result = await build({
        stdin: { contents: SOURCE, resolveDir: ROOT },
        tsconfig: `${ROOT}/tsconfig.json`,
        bundle: true,
        write: false,
        external: ['node:*']
    });
    bundle = result.outputFiles[0].text;
});

test.beforeEach(async ({ page }) => {
    await page.setContent('<html><body></body></html>');
    await page.evaluate(() => {
        Object.assign(window, {
            config: { sentry: { enabled: false } },
            editor: { method() {}, once() {}, on() {}, call() {} }
        });
    });
    await page.addScriptTag({ content: bundle });
});

for (const type of ['slider', 'number']) {
    for (const value of [8.000000000000002, 8.0001, 9]) {
        test(`${type}: committing displayed 8 repairs stored ${value}`, async ({ page }) => {
            await page.evaluate(({ value, type }) => (window as NumericWindow).numeric([value], type), { value, type });
            const input = page.locator('input');
            await expect(input).toHaveValue('8');
            expect(await page.evaluate(() => (window as NumericWindow).numericState())).toEqual({
                values: [value],
                changes: 0
            });

            await input.fill('8');
            await input.press('Enter');
            expect(await page.evaluate(() => (window as NumericWindow).numericState())).toEqual({
                values: [8],
                changes: 1
            });

            await page.evaluate(() => (window as NumericWindow).numericUndo());
            expect(await page.evaluate(() => (window as NumericWindow).numericState())).toEqual({
                values: [value],
                changes: 1
            });
            await page.evaluate(() => (window as NumericWindow).numericRedo());
            expect(await page.evaluate(() => (window as NumericWindow).numericState())).toEqual({
                values: [8],
                changes: 1
            });
        });
    }
}

test('does not add history for unchanged values or duplicate a normal edit', async ({ page }) => {
    await page.evaluate(() => (window as NumericWindow).numeric([8]));
    const input = page.locator('input');
    await input.press('Enter');
    expect(await page.evaluate(() => (window as NumericWindow).numericState())).toEqual({ values: [8], changes: 0 });
    await input.fill('7.999');
    await input.press('Enter');
    expect(await page.evaluate(() => (window as NumericWindow).numericState())).toEqual({
        values: [7.999],
        changes: 1
    });
});

test('commits a clamped native change and preserves undo', async ({ page }) => {
    await page.evaluate(() => (window as NumericWindow).numeric([9]));
    await page.locator('input').fill('10');
    await page.locator('input').blur();
    expect(await page.evaluate(() => (window as NumericWindow).numericState())).toEqual({ values: [8], changes: 1 });
    await page.evaluate(() => (window as NumericWindow).numericUndo());
    expect(await page.evaluate(() => (window as NumericWindow).numericState())).toEqual({ values: [9], changes: 1 });
});

test('commits a retyped displayed value on blur', async ({ page }) => {
    await page.evaluate(() => (window as NumericWindow).numeric([9]));
    const input = page.locator('input');
    await input.fill('8');
    await input.blur();
    expect(await page.evaluate(() => (window as NumericWindow).numericState())).toEqual({ values: [8], changes: 1 });
});

test('repairs a selection whose different stored values display as 8', async ({ page }) => {
    await page.evaluate(() => (window as NumericWindow).numeric([8, 8.0001, 9]));
    await page.locator('input').press('Enter');
    expect(await page.evaluate(() => (window as NumericWindow).numericState())).toEqual({
        values: [8, 8, 8],
        changes: 1
    });
    await page.evaluate(() => (window as NumericWindow).numericUndo());
    expect(await page.evaluate(() => (window as NumericWindow).numericState())).toEqual({
        values: [8, 8.0001, 9],
        changes: 1
    });
});

test('leaves an empty mixed selection unchanged on Enter', async ({ page }) => {
    await page.evaluate(() => (window as NumericWindow).numeric([1, 2]));
    await expect(page.locator('input')).toHaveValue('');
    await page.locator('input').press('Enter');
    expect(await page.evaluate(() => (window as NumericWindow).numericState())).toEqual({ values: [1, 2], changes: 0 });
});

for (const args of [{ readOnly: true }, { enabled: false }]) {
    test(`does not repair a protected field ${JSON.stringify(args)}`, async ({ page }) => {
        await page.evaluate(args => (window as NumericWindow).numeric([9], 'slider', args), args);
        await page.locator('input').press('Enter');
        expect(await page.evaluate(() => (window as NumericWindow).numericState())).toEqual({
            values: [9],
            changes: 0
        });
    });
}

test('does not change stored values just by focusing, blurring or cancelling', async ({ page }) => {
    await page.evaluate(() => (window as NumericWindow).numeric([9]));
    const input = page.locator('input');
    await input.focus();
    await input.blur();
    await input.fill('7');
    await input.press('Escape');
    expect(await page.evaluate(() => (window as NumericWindow).numericState())).toEqual({ values: [9], changes: 0 });
});
