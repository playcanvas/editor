import { expect, test } from '../../lib/fixtures';
import { EditorShell } from '../../lib/pages/common';
import { SettingsDialog } from '../../lib/pages/settings';
import { waitForEditor } from '../../lib/ready';

const CLUSTERED = 'render.clusteredLightingEnabled';
const PROJECT_KEYS = ['useTouch', 'externalScripts'];
const URL_ONE = 'https://example.com/e2e-external-a.js';

// the worker project and its scene outlive every test here, so snapshot the settings these
// tests write and put them back even when a test fails part way through
let snapshot: { project: Record<string, unknown>; clustered: unknown; engine: unknown };

test.describe('settings', () => {
    test.beforeEach(async ({ editorPage }) => {
        const settings = new SettingsDialog(editorPage);
        const project: Record<string, unknown> = {};
        for (const key of PROJECT_KEYS) {
            project[key] = await settings.projectSetting(key);
        }
        snapshot = {
            project,
            clustered: await settings.sceneSetting(CLUSTERED),
            engine: await settings.sessionSetting('engineVersion')
        };
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

            // scene settings ride the scene sharedb doc, not the project settings doc, so flush that
            // one too or the next spec in this worker opens the scene with clustered lighting still on
            await editorPage.evaluate(() => new Promise<void>((resolve) => {
                window.editor.api.globals.realtime.scenes.current.whenNothingPending(resolve);
            }));
        }
        if (await settings.sessionSetting('engineVersion') !== snapshot.engine) {
            await settings.setSessionSetting('engineVersion', snapshot.engine);
        }
        await settings.flushProjectSettings();
    });

    test('toggle touch setting', async ({ editorPage }) => {
        const settings = new SettingsDialog(editorPage);
        const before = snapshot.project.useTouch;

        await settings.open();

        await expect(settings.root).toBeVisible();
        await settings.expand('INPUT');
        const changed = await settings.armSetting('project', 'useTouch', !before);
        await settings.toggle('INPUT', 'Touch');
        await changed();

        // the change has to reach the server before the reload reads it back
        await settings.flushProjectSettings();
        await editorPage.reload();
        await waitForEditor(editorPage);

        expect(await settings.projectSetting('useTouch')).toBe(!before);
    });

    test('add external script', async ({ editorPage }) => {
        const settings = new SettingsDialog(editorPage);
        const before = (snapshot.project.externalScripts ?? []) as string[];
        await settings.open();
        await settings.expand('EXTERNAL SCRIPTS');
        const urls = settings.field('EXTERNAL SCRIPTS', 'Number of URLs');

        const added = await settings.armSetting('project', 'externalScripts', [...before, URL_ONE]);
        await settings.setArraySize(urls, before.length + 1);
        await settings.setArrayItem(urls, before.length, URL_ONE);
        await added();

        const removed = await settings.armSetting('project', 'externalScripts', before);
        await settings.removeArrayItem(urls, before.length);
        await removed();

        await expect(settings.arrayItem(urls, before.length)).toHaveCount(0);
        expect(await settings.projectSetting('externalScripts')).toEqual(before);
    });

    test('switch engine version', async ({ editorPage }) => {
        const settings = new SettingsDialog(editorPage);
        await settings.open();
        const versions = await settings.engineVersions();

        await expect(settings.engineVersion.locator('.pcui-select-input-value')).toHaveText(versions.current.description);
        expect(await settings.sessionSetting('engineVersion')).toBe('current');

        test.skip(!versions.previous, 'this deployment exposes no previous engine version');

        // the afterEach puts the session choice back; the worker's page outlives this test
        const changed = await settings.armSetting('session', 'engineVersion', 'previous');
        await settings.selectOption(settings.engineVersion, versions.previous!.description);
        await changed();

        await expect(settings.engineVersion.locator('.pcui-select-input-value')).toHaveText(versions.previous!.description);
        expect(await settings.sessionSetting('engineVersion')).toBe('previous');
    });

    test('toggle clustered lighting', async ({ editorPage, errors }) => {
        const settings = new SettingsDialog(editorPage);
        const before = snapshot.clustered;

        // viewport-scene-settings.ts pushes every scene settings change into the live engine, and
        // `Scene.clusteredLightingEnabled` refuses to switch on at runtime with this error. it is
        // the exact condition the restart modal exists for, so the scenario cannot avoid it.
        errors.allow(/Turning on disabled clustered lighting is not currently supported/);

        await settings.open();
        await settings.expand('RENDERING');
        await settings.mark();

        const changed = await settings.armSetting('scene', CLUSTERED, !before);
        await settings.toggle('RENDERING', 'Clustered Lighting');

        await expect(settings.restartModal).toBeVisible();
        await expect(settings.restartModal.locator('.pcui-button')).toHaveText('RELOAD');

        // rendering.ts compares the observer against the new value, so the change handler opens the
        // modal first and the binding writes the value through after it
        await changed();

        await new EditorShell(editorPage).flushScene();
        await Promise.all([
            editorPage.waitForEvent('domcontentloaded'),
            settings.restartModal.locator('.pcui-button').click()
        ]);
        await waitForEditor(editorPage);

        await expect(settings.restartModal).toHaveCount(0);
        expect(await settings.marked()).toBe(false);
        expect(await settings.sceneSetting(CLUSTERED)).toBe(!before);
    });
});
