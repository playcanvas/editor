import { expect, test } from '../../lib/fixtures';

const INPUT = '#numeric-test input';
const INSPECTOR = '.entity-inspector .pcui-inspector';

type NumericWindow = typeof window & {
    numeric: (values: number[], type?: string, args?: { readOnly?: boolean; enabled?: boolean }) => void;
    numericState: () => { values: number[]; changes: number };
    numericUndo: () => void;
    numericRedo: () => void;
};

type AttributesInspector = {
    createFieldForAttribute(attribute: object): { dom: HTMLElement; link(observers: Observer[], path: string): void };
};

test.beforeEach(async ({ editorPage }) => {
    // inspectors are built on first selection, so select the root to get one
    await editorPage.evaluate(() => {
        const { selection, entities } = window.editor.api.globals;
        selection.set([entities.root], { history: false });
    });
    await editorPage.locator(INSPECTOR).first().waitFor({ state: 'attached' });

    await editorPage.evaluate((inspector) => {
        // the built editor exports nothing, so take the classes from live instances
        const AttributesInspector = (document.querySelector(inspector) as Element & { ui: object }).ui.constructor as new (args: { history: unknown }) => AttributesInspector;
        const History = window.editor.api.globals.history.constructor as new () => typeof window.editor.api.globals.history;
        const Observer = (window.editor.api.globals.entities.root.observer as Observer).constructor as new (data: object) => Observer;

        const root = document.createElement('div');
        root.id = 'numeric-test';
        root.style.cssText = 'position: fixed; top: 0; left: 0; width: 320px; z-index: 10000';
        document.body.append(root);

        const win = window as NumericWindow;
        win.numeric = (values, type = 'slider', args = {}) => {
            const history = new History();
            let changes = 0;
            history.on('add', () => changes++);
            const observers = values.map(reflectivity => new Observer({ data: { reflectivity } }));
            const inspector = new AttributesInspector({ history });
            const field = inspector.createFieldForAttribute({
                type,
                path: 'data.reflectivity',
                args: { min: 0, max: 8, precision: 3, step: 0.01, ...args }
            });
            root.replaceChildren(field.dom);
            field.link(observers, 'data.reflectivity');
            win.numericState = () => ({
                values: observers.map(observer => observer.get('data.reflectivity')),
                changes
            });
            win.numericUndo = () => history.undo();
            win.numericRedo = () => history.redo();
        };
    }, INSPECTOR);
});

test.afterEach(async ({ editorPage }) => {
    await editorPage.evaluate(() => {
        document.getElementById('numeric-test')?.remove();
        window.editor.api.globals.selection.clear({ history: false });
    });
});

for (const type of ['slider', 'number']) {
    for (const value of [8.000000000000002, 8.0001, 9]) {
        test(`${type}: committing displayed 8 repairs stored ${value}`, async ({ editorPage: page }) => {
            await page.evaluate(({ value, type }) => (window as NumericWindow).numeric([value], type), { value, type });
            const input = page.locator(INPUT);
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

test('does not add history for unchanged values or duplicate a normal edit', async ({ editorPage: page }) => {
    await page.evaluate(() => (window as NumericWindow).numeric([8]));
    const input = page.locator(INPUT);
    await input.press('Enter');
    expect(await page.evaluate(() => (window as NumericWindow).numericState())).toEqual({ values: [8], changes: 0 });
    await input.fill('7.999');
    await input.press('Enter');
    expect(await page.evaluate(() => (window as NumericWindow).numericState())).toEqual({
        values: [7.999],
        changes: 1
    });
});

test('commits a clamped native change and preserves undo', async ({ editorPage: page }) => {
    await page.evaluate(() => (window as NumericWindow).numeric([9]));
    await page.locator(INPUT).fill('10');
    await page.locator(INPUT).blur();
    expect(await page.evaluate(() => (window as NumericWindow).numericState())).toEqual({ values: [8], changes: 1 });
    await page.evaluate(() => (window as NumericWindow).numericUndo());
    expect(await page.evaluate(() => (window as NumericWindow).numericState())).toEqual({ values: [9], changes: 1 });
});

test('commits a retyped displayed value on blur', async ({ editorPage: page }) => {
    await page.evaluate(() => (window as NumericWindow).numeric([9]));
    const input = page.locator(INPUT);
    await input.fill('8');
    await input.blur();
    expect(await page.evaluate(() => (window as NumericWindow).numericState())).toEqual({ values: [8], changes: 1 });
});

test('repairs a selection whose different stored values display as 8', async ({ editorPage: page }) => {
    await page.evaluate(() => (window as NumericWindow).numeric([8, 8.0001, 9]));
    await page.locator(INPUT).press('Enter');
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

test('leaves an empty mixed selection unchanged on Enter', async ({ editorPage: page }) => {
    await page.evaluate(() => (window as NumericWindow).numeric([1, 2]));
    await expect(page.locator(INPUT)).toHaveValue('');
    await page.locator(INPUT).press('Enter');
    expect(await page.evaluate(() => (window as NumericWindow).numericState())).toEqual({ values: [1, 2], changes: 0 });
});

for (const args of [{ readOnly: true }, { enabled: false }]) {
    test(`does not repair a protected field ${JSON.stringify(args)}`, async ({ editorPage: page }) => {
        await page.evaluate(args => (window as NumericWindow).numeric([9], 'slider', args), args);
        await page.locator(INPUT).press('Enter');
        expect(await page.evaluate(() => (window as NumericWindow).numericState())).toEqual({
            values: [9],
            changes: 0
        });
    });
}

test('does not change stored values just by focusing, blurring or cancelling', async ({ editorPage: page }) => {
    await page.evaluate(() => (window as NumericWindow).numeric([9]));
    const input = page.locator(INPUT);
    await input.focus();
    await input.blur();
    await input.fill('7');
    await input.press('Escape');
    expect(await page.evaluate(() => (window as NumericWindow).numericState())).toEqual({ values: [9], changes: 0 });
});
