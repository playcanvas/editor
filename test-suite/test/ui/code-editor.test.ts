import type { Page } from '@playwright/test';

import { createEsmScript } from '../../lib/common';
import { expect, test } from '../../lib/fixtures';
import { CodeEditor } from '../../lib/pages/code-editor';
import { uniqueName } from '../../lib/utils';

// asset creates, renames and deletes go through the rest api and take seconds to come back
const SERVER = { timeout: 30_000 };
// tests that make their own script, so the hook should not make one for them
const NO_SCRIPT = '@no-script';

// the worker project outlives every test, so each script gets a unique name and is removed after
const created: number[] = [];
let script: { id: number; name: string };

const makeScript = async (page: Page) => {
    const name = `${uniqueName('script')}.mjs`;
    const id = await createEsmScript(page, name);
    created.push(id);
    return { id, name };
};

/** Creates a script through the main editor and waits for the code editor tree to pick it up. */
const addScript = async (page: Page, code: CodeEditor) => {
    const added = await makeScript(page);
    await code.treeItem(added.name).waitFor(SERVER);
    return added;
};

test.beforeEach(async ({ editorPage, errors }, info) => {
    // monaco terminates its language worker when the last model goes away (closing a tab, or the
    // fixture closing the page), which aborts the nls import the worker had in flight
    errors.allow(/Failed trying to load default language strings/);
    if (info.tags.includes(NO_SCRIPT)) {
        return;
    }
    script = await makeScript(editorPage);
});

test.afterEach(async ({ editorPage }) => {
    const ids = created.splice(0);
    await editorPage.evaluate(async (list) => {
        const assets = window.editor.api.globals.assets;
        const targets = list.flatMap((id) => {
            const asset = assets.get(id);
            return asset ? [asset] : [];
        });
        if (targets.length) {
            await assets.delete(targets);
        }
    }, ids);
});

test('clicking a tree item opens a temporary tab and double-click pins it', async ({ codeEditorPage }) => {
    const code = new CodeEditor(codeEditorPage);

    await expect(code.treeItem(script.name)).toHaveCount(1);

    await code.open(script.name, script.id);

    await expect(code.tab(script.name)).toHaveClass(/temporary/);
    await expect(code.treeContents(script.name)).toHaveClass(/pcui-treeview-item-selected/);
    expect(await code.isTemp(script.id)).toBe(true);
    expect(await code.focusedId()).toBe(String(script.id));
    expect(await code.content()).toContain('extends Script');

    await code.pin(script.name);

    await expect(code.tab(script.name)).not.toHaveClass(/temporary/);
    expect(await code.isTemp(script.id)).toBe(false);
});

test('Ctrl+S saves the typed edit and clears the dirty state', async ({ codeEditorPage }) => {
    const code = new CodeEditor(codeEditorPage);
    const token = `// ${uniqueName('edit')}`;
    await code.open(script.name, script.id);

    await code.typeAtEnd(`\n${token}`);
    await expect(code.tab(script.name)).toHaveClass(/dirty/);

    await code.arm('documents:save:success');
    await code.save();
    await code.waitArmed();

    await expect(code.tab(script.name)).not.toHaveClass(/dirty/);
    await expect(code.status).toHaveText(`Saved "${script.name}"`);
    expect(await code.isDirty(script.id)).toBe(false);
    expect((await code.content()).trimEnd().endsWith(token)).toBe(true);
    expect((await code.fileContents(script.id)).trimEnd().endsWith(token)).toBe(true);
});

test('typing marks the tab and the tree item dirty and pins the tab', async ({ codeEditorPage }) => {
    const code = new CodeEditor(codeEditorPage);
    await code.open(script.name, script.id);
    expect(await code.isDirty(script.id)).toBe(false);

    await code.typeAtEnd(`\n// ${uniqueName('dirty')}`);

    await expect(code.tab(script.name)).toHaveClass(/dirty/);
    await expect(code.treeItem(script.name)).toHaveClass(/dirty/);
    await expect.poll(() => code.isDirty(script.id)).toBe(true);

    // a local edit also promotes the temporary tab
    expect(await code.isTemp(script.id)).toBe(false);
});

// the ui creates the script here, and every extra module script in the project widens the file
// fan-out of the parse that follows (handle-script-parse getScripts), so start from an empty tree
test('File > Create New > Script Asset creates the asset and opens it pinned', { tag: NO_SCRIPT }, async ({ codeEditorPage }) => {
    const code = new CodeEditor(codeEditorPage);
    const name = `${uniqueName('script')}.mjs`;
    await code.waitForParser();

    await code.openMenu('File', 'Create New', 'Script Asset');
    await expect(code.createInput).toBeVisible();
    await code.retype(code.createInput, name);

    await expect(code.treeItem(name)).toHaveCount(1, SERVER);
    await expect(code.tab(name)).toHaveCount(1, SERVER);
    const id = await code.assetId(name);
    expect(id).not.toBeNull();
    created.push(id as number);
    expect(await code.asset(id as number, 'type')).toBe('script');
    await expect.poll(() => code.focusedId(), SERVER).toBe(String(id));
    expect(await code.isTemp(id as number)).toBe(false);
});

test('renaming to a taken name errors and a free name renames the asset', async ({ codeEditorPage, editorPage }) => {
    const code = new CodeEditor(codeEditorPage);
    const other = await addScript(editorPage, code);
    const renamed = `${uniqueName('script')}.mjs`;
    await code.open(script.name, script.id);

    await code.contextMenu(script.name, 'Rename');
    await expect(code.renameInput).toBeVisible();
    await code.retype(code.renameInput, other.name);

    await expect(code.renameError).toBeVisible();
    await expect(code.renameError).toContainText(other.name);
    expect(await code.asset(script.id, 'name')).toBe(script.name);
    await expect(code.treeItem(script.name)).toHaveCount(1);

    await code.retype(code.renameInput, renamed);

    await expect(code.renameInput).toHaveCount(0);
    await expect(code.treeItem(renamed)).toHaveCount(1, SERVER);
    await expect(code.treeItem(script.name)).toHaveCount(0, SERVER);
    await expect.poll(() => code.asset(script.id, 'name'), SERVER).toBe(renamed);

    // the server renames the file with the asset, so the code editor rebuilds the dependency graph
    // off the new virtual path and drops the view still registered under the old one, tab included
    // (assets.ts file:set -> asset:update-dependencies -> documents:close). this only holds for
    // assets that existed when the page loaded, because file:set is bound in the assets:load loop
    // and never in assets:add, so the test pins today's behaviour - which reads like a bug, not
    // like the intent
    await expect(code.tab(script.name)).toHaveCount(0, SERVER);
    await expect(code.tab(renamed)).toHaveCount(0, SERVER);
    await expect.poll(() => code.tabIds(), SERVER).not.toContain(String(script.id));
});

test('context Delete removes the asset with its tab and tree item', async ({ codeEditorPage }) => {
    const code = new CodeEditor(codeEditorPage);
    await code.open(script.name, script.id);

    await code.contextMenu(script.name, 'Delete');
    await expect(code.shell.confirm.text).toHaveText('Delete Asset?');
    await code.shell.confirm.yes.click();

    await expect(code.treeItem(script.name)).toHaveCount(0, SERVER);
    await expect(code.tab(script.name)).toHaveCount(0);
    await expect.poll(() => code.asset(script.id, 'name'), SERVER).toBeUndefined();
    expect(await code.tabIds()).not.toContain(String(script.id));

    // the asset is already gone, so keep the cleanup pass off it
    created.splice(created.indexOf(script.id), 1);
});

test('Find in Files reports the match and double-click jumps to its line', async ({ codeEditorPage }) => {
    const code = new CodeEditor(codeEditorPage);
    const token = uniqueName('needle');
    await code.open(script.name, script.id);
    await code.typeAtEnd(`\n// ${token}`);
    const line = (await code.content()).split('\n').findIndex(l => l.includes(token)) + 1;
    expect(line).toBeGreaterThan(1);

    await code.findInFiles(token);

    await expect(code.resultsTab).toHaveClass(/focused/);
    const results = await code.content();
    expect(results).toContain(token);
    expect(results).toContain('1 matches across 1 files');

    await code.jumpToResult(token);

    await expect.poll(() => code.focusedId()).toBe(String(script.id));
    await expect.poll(() => code.cursorLine()).toBe(line);
});

test('Edit > Preferences font size drives the monaco option and the ide setting', async ({ codeEditorPage }) => {
    const code = new CodeEditor(codeEditorPage);
    const before = await code.setting('ide.fontSize');
    const size = before === 20 ? 16 : 20;

    await code.openMenu('Edit', 'Preferences');
    await expect(code.prefs).toBeVisible();

    await code.retype(code.shell.labelGroup(code.prefs, 'Font Size:').locator('input'), String(size));

    await expect.poll(() => code.setting('ide.fontSize')).toBe(size);
    await expect.poll(() => code.option('fontSize')).toBe(size);

    // the ide settings belong to the account, so hand back the size it came with
    await code.setSetting('ide.fontSize', before);
    await expect.poll(() => code.option('fontSize')).toBe(before);
});

test('Alt+W closes the focused tab and Alt+Shift+W closes them all', async ({ codeEditorPage, editorPage }) => {
    const code = new CodeEditor(codeEditorPage);
    const other = await addScript(editorPage, code);
    await code.open(script.name, script.id);
    await code.pin(script.name);
    await code.open(other.name, other.id);

    expect(await code.tabIds()).toEqual([String(script.id), String(other.id)]);
    expect(await code.focusedId()).toBe(String(other.id));

    await code.monaco.focus();
    await codeEditorPage.keyboard.press('Alt+w');

    await expect(code.tab(other.name)).toHaveCount(0);
    await expect(code.tab(script.name)).toHaveCount(1);
    await expect.poll(() => code.focusedId()).toBe(String(script.id));

    await code.monaco.focus();
    await codeEditorPage.keyboard.press('Alt+Shift+w');

    await expect(code.tabs.locator('.tab')).toHaveCount(0);
    expect(await code.tabIds()).toEqual([]);
});

test('a script created in the editor page reaches the open code editor tree', async ({ codeEditorPage, editorPage }) => {
    const code = new CodeEditor(codeEditorPage);
    const before = await code.assetNames();
    const added = await makeScript(editorPage);

    expect(before).not.toContain(added.name);
    await expect(code.treeItem(added.name)).toHaveCount(1, SERVER);
    await expect.poll(() => code.assetNames()).toContain(added.name);

    await code.open(added.name, added.id);

    expect(await code.focusedId()).toBe(String(added.id));
    expect(await code.content()).toContain('extends Script');
});
