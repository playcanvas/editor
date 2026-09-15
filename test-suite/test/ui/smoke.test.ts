import { expect, test } from '../../lib/fixtures';

test.describe('smoke', { tag: '@gate' }, () => {
    test('load editor', async ({ editorPage, project }) => {
        await expect(editorPage.locator('#layout-hierarchy')).toBeVisible();
        expect(await editorPage.evaluate(() => window.editor.call('editor:ready'))).toBe(true);
        expect(await editorPage.evaluate(() => window.config.project.id)).toBe(project.id);
    });

    test('load blank page', async ({ blankPage }) => {
        await expect(blankPage.locator('.picker-project-cms')).toBeVisible();
    });

    test('load code editor', async ({ codeEditorPage }) => {
        await expect(codeEditorPage.locator('#ui-left')).toBeVisible();
    });

    test('load launcher', async ({ openLaunch, project }) => {
        const launch = await openLaunch(project.sceneId);
        expect(await launch.evaluate(() => (window as any).pc.app.frame)).toBeGreaterThan(0);
    });
});
