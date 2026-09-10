import { expect, test } from '../../lib/fixtures';

test('editor page is ready', async ({ editorPage, project }) => {
    await expect(editorPage.locator('#layout-hierarchy')).toBeVisible();
    expect(await editorPage.evaluate(() => window.editor.call('editor:ready'))).toBe(true);
    expect(await editorPage.evaluate(() => window.config.project.id)).toBe(project.id);
});

test('blank page is ready', async ({ blankPage }) => {
    await expect(blankPage.locator('.picker-project-cms')).toBeVisible();
});

test('code editor is ready', async ({ codeEditorPage }) => {
    await expect(codeEditorPage.locator('#ui-left')).toBeVisible();
});

test('launch page runs', async ({ openLaunch, project }) => {
    const launch = await openLaunch(project.sceneId);
    expect(await launch.evaluate(() => (window as any).pc.app.frame)).toBeGreaterThan(0);
});
