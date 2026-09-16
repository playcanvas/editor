import type { Page } from '@playwright/test';

import { createEsmScript } from '../../lib/common';
import { expect, test } from '../../lib/fixtures';
import { CodeEditor } from '../../lib/pages/code-editor';
import { waitForCodeEditor } from '../../lib/ready';
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

test.describe('code-editor', () => {
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

    test('save script', async ({ codeEditorPage }) => {
        const code = new CodeEditor(codeEditorPage);
        const token = `// ${uniqueName('edit')}`;
        await code.open(script.name, script.id);

        await code.typeAtEnd(`\n${token}`);
        await expect(code.tab(script.name)).toHaveClass(/dirty/);

        const persisted = await code.armEvent('documents:save:success');
        await code.save();
        await persisted();

        await expect(code.tab(script.name)).not.toHaveClass(/dirty/);
        await expect(code.status).toHaveText(`Saved "${script.name}"`);
        expect(await code.isDirty(script.id)).toBe(false);
        expect((await code.content()).trimEnd().endsWith(token)).toBe(true);
        expect((await code.fileContents(script.id)).trimEnd().endsWith(token)).toBe(true);

        const saved = await code.content();
        await codeEditorPage.reload();
        await waitForCodeEditor(codeEditorPage);
        await code.open(script.name, script.id);
        expect(await code.content()).toBe(saved);
        expect(await code.isDirty(script.id)).toBe(false);
    });

    test('switch dirty tabs and save each document independently', async ({ codeEditorPage, editorPage }) => {
        const code = new CodeEditor(codeEditorPage);
        const other = await addScript(editorPage, code);
        await code.open(script.name, script.id);
        await code.typeAtEnd(`\n// ${uniqueName('first')}`);
        const first = await code.content();
        await code.open(other.name, other.id);
        await code.typeAtEnd(`\n// ${uniqueName('second')}`);
        const second = await code.content();
        await expect(code.tab(script.name)).toHaveClass(/dirty/);
        await expect(code.tab(other.name)).toHaveClass(/dirty/);

        let persisted = await code.armEvent('documents:save:success');
        await code.save();
        await persisted();
        expect(await code.fileContents(other.id)).toBe(second);
        await expect(code.tab(other.name)).not.toHaveClass(/dirty/);
        await expect(code.tab(script.name)).toHaveClass(/dirty/);

        await code.tab(script.name).click();
        expect(await code.content()).toBe(first);
        persisted = await code.armEvent('documents:save:success');
        await code.save();
        await persisted();

        await codeEditorPage.reload();
        await waitForCodeEditor(codeEditorPage);
        await code.open(script.name, script.id);
        expect(await code.content()).toBe(first);
        await code.open(other.name, other.id);
        expect(await code.content()).toBe(second);
        expect(await code.isDirty(script.id)).toBe(false);
        expect(await code.isDirty(other.id)).toBe(false);
    });

    // the ui creates the script here, and every extra module script in the project widens the file
    // fan-out of the parse that follows (handle-script-parse getScripts), so start from an empty tree
    test('create script asset', { tag: NO_SCRIPT }, async ({ codeEditorPage }) => {
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
        await code.waitForDoc(id as number);
        expect(await code.focusedId()).toBe(String(id));
        expect(await code.isTemp(id as number)).toBe(false);
    });

    test('rename script', async ({ codeEditorPage, editorPage }) => {
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

        const updated = await code.armAssetField(script.id, 'name', renamed);
        await code.retype(code.renameInput, renamed);
        await updated();

        await expect(code.renameInput).toHaveCount(0);
        await expect(code.treeItem(renamed)).toHaveCount(1, SERVER);
        await expect(code.treeItem(script.name)).toHaveCount(0, SERVER);
        expect(await code.asset(script.id, 'name')).toBe(renamed);

        // the server renames the file with the asset, so the code editor rebuilds the dependency graph
        // off the new virtual path and drops the view still registered under the old one, tab included
        // (assets.ts file:set -> asset:update-dependencies -> documents:close). this only holds for
        // assets that existed when the page loaded, because file:set is bound in the assets:load loop
        // and never in assets:add, so the test pins today's behaviour - which reads like a bug, not
        // like the intent
        await expect(code.tab(script.name)).toHaveCount(0, SERVER);
        await expect(code.tab(renamed)).toHaveCount(0, SERVER);
        expect(await code.tabIds()).not.toContain(String(script.id));
    });

    test('delete script', async ({ codeEditorPage }) => {
        const code = new CodeEditor(codeEditorPage);
        await code.open(script.name, script.id);

        await code.contextMenu(script.name, 'Delete');
        await expect(code.shell.confirm.text).toHaveText('Delete Asset?');
        await code.shell.confirm.yes.click();

        await expect(code.treeItem(script.name)).toHaveCount(0, SERVER);
        await expect(code.tab(script.name)).toHaveCount(0);
        expect(await code.asset(script.id, 'name')).toBeUndefined();
        expect(await code.tabIds()).not.toContain(String(script.id));

        // the asset is already gone, so keep the cleanup pass off it
        created.splice(created.indexOf(script.id), 1);
    });

    test('sync new script', async ({ codeEditorPage, editorPage }) => {
        const code = new CodeEditor(codeEditorPage);
        const before = await code.assetNames();
        const added = await makeScript(editorPage);

        expect(before).not.toContain(added.name);
        await expect(code.treeItem(added.name)).toHaveCount(1, SERVER);
        expect(await code.assetNames()).toContain(added.name);

        await code.open(added.name, added.id);

        expect(await code.focusedId()).toBe(String(added.id));
        expect(await code.content()).toContain('extends Script');
    });
});
