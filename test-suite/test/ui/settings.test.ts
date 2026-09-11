import { expect, test } from '../../lib/fixtures';
import { SettingsDialog } from '../../lib/pages/settings';
import { waitForEditor } from '../../lib/ready';

const CLUSTERED = 'render.clusteredLightingEnabled';
const PROJECT_KEYS = ['useTouch', 'externalScripts'];
const URL_ONE = 'https://example.com/e2e-external-a.js';

// the worker project and its scene outlive every test here, so snapshot the settings these
// tests write and put them back even when a test fails part way through
let snapshot: { project: Record<string, unknown>; clustered: unknown };

test.beforeEach(async ({ editorPage }) => {
    const settings = new SettingsDialog(editorPage);
    const project: Record<string, unknown> = {};
    for (const key of PROJECT_KEYS) {
        project[key] = await settings.projectSetting(key);
    }
    snapshot = { project, clustered: await settings.sceneSetting(CLUSTERED) };
});

test.afterEach(async ({ editorPage }) => {
    const settings = new SettingsDialog(editorPage);
    for (const [key, value] of Object.entries(snapshot.project)) {
        if (JSON.stringify(await settings.projectSetting(key)) !== JSON.stringify(value)) {
            await settings.setProjectSetting(key, value);
        }
    }
    if (await settings.sceneSetting(CLUSTERED) !== snapshot.clustered) {
        await settings.setSceneSetting(CLUSTERED, snapshot.clustered);
    }
    await settings.flushProjectSettings();
});

test('logo menu Settings opens the dialog and the Touch toggle persists', async ({ editorPage }) => {
    const settings = new SettingsDialog(editorPage);
    const before = snapshot.project.useTouch;

    await settings.open();

    await expect(settings.root).toBeVisible();
    await settings.expand('INPUT');
    await settings.toggle('INPUT', 'Touch');
    await expect.poll(() => settings.projectSetting('useTouch')).toBe(!before);

    // the change has to reach the server before the reload reads it back
    await settings.flushProjectSettings();
    await editorPage.reload();
    await waitForEditor(editorPage);

    expect(await settings.projectSetting('useTouch')).toBe(!before);
});

test('EXTERNAL SCRIPTS adds and removes a url', async ({ editorPage }) => {
    const settings = new SettingsDialog(editorPage);
    const before = (snapshot.project.externalScripts ?? []) as string[];
    await settings.open();
    await settings.expand('EXTERNAL SCRIPTS');
    const urls = settings.field('EXTERNAL SCRIPTS', 'Number of URLs');

    await settings.setArraySize(urls, before.length + 1);
    await settings.setArrayItem(urls, before.length, URL_ONE);
    await expect.poll(() => settings.projectSetting('externalScripts')).toEqual([...before, URL_ONE]);

    await settings.removeArrayItem(urls, before.length);

    await expect(settings.arrayItem(urls, before.length)).toHaveCount(0);
    await expect.poll(() => settings.projectSetting('externalScripts')).toEqual(before);
});

test('ENGINE version select shows the current engine and switches session version', async ({ editorPage }) => {
    const settings = new SettingsDialog(editorPage);
    await settings.open();
    const versions = await settings.engineVersions();

    await expect(settings.engineVersion.locator('.pcui-select-input-value')).toHaveText(versions.current.description);
    expect(await settings.sessionSetting('engineVersion')).toBe('current');

    test.skip(!versions.previous, 'this deployment exposes no previous engine version');

    // session settings are in-memory and page scoped, so there is nothing to put back
    await settings.selectOption(settings.engineVersion, versions.previous!.description);

    await expect(settings.engineVersion.locator('.pcui-select-input-value')).toHaveText(versions.previous!.description);
    await expect.poll(() => settings.sessionSetting('engineVersion')).toBe('previous');
});

test('RENDERING Clustered Lighting asks for a restart without reloading', async ({ editorPage, errors }) => {
    const settings = new SettingsDialog(editorPage);
    const before = snapshot.clustered;

    // viewport-scene-settings.ts pushes every scene settings change into the live engine, and
    // `Scene.clusteredLightingEnabled` refuses to switch on at runtime with this error. it is
    // the exact condition the restart modal exists for, so the scenario cannot avoid it.
    errors.allow(/Turning on disabled clustered lighting is not currently supported/);

    await settings.open();
    await settings.expand('RENDERING');
    await settings.mark();

    await settings.toggle('RENDERING', 'Clustered Lighting');

    await expect(settings.restartModal).toBeVisible();
    await expect(settings.restartModal.locator('.pcui-button')).toHaveText('RELOAD');

    // the toggle writes through before the modal opens: the binding runs after the change event
    await expect.poll(() => settings.sceneSetting(CLUSTERED)).toBe(!before);

    // the modal only offers RELOAD, so drop it ourselves rather than let it reload the page
    await settings.dismissRestartModal();

    await expect(settings.restartModal).toHaveCount(0);
    expect(await settings.marked()).toBe(true);
});
