import { readFileSync } from 'node:fs';

import type { Page } from '@playwright/test';

import { waitForParser } from '../../lib/common';
import { JOB_TEST_TIMEOUT, JOB_TIMEOUT } from '../../lib/constants';
import { expect, test } from '../../lib/fixtures';
import { AssetsPanel } from '../../lib/pages/assets';
import { EditorShell, type ProjectState } from '../../lib/pages/common';
import { HierarchyPanel } from '../../lib/pages/hierarchy';
import { Inspector } from '../../lib/pages/inspector';
import { uniqueName } from '../../lib/utils';

const WAV = readFileSync(new URL('../fixtures/files/test.wav', import.meta.url));

// scripts:handleParse is registered only once the script worker has finished init

const SLOT_PANEL = '.sound-component-inspector-slot';
const CLIP_PANEL = '.sprite-component-inspector-clip';
const LAYER_PANEL = '.anim-component-layer';

const SPRITE_TYPES = [
    { type: 'simple', item: 'Sprite' },
    { type: 'animated', item: 'Animated Sprite' }
];

const esm = (name: string) => `import { Script } from 'playcanvas';

export class Test extends Script {
    static scriptName = '${name}';

    /** @attribute */
    speed = 1;
}
`;

const createScript = async (page: Page, filename: string, text: string) => {
    await waitForParser(page);
    return page.evaluate(([name, body]) => {
        return window.editor.api.globals.assets
        .createScript({ filename: name, text: body })
        .then((asset: any) => asset.get('id') as number);
    }, [filename, text] as const);
};

// the worker project is shared by the whole run, so hand back what we were given
let baseline: ProjectState;

test.describe('components-media', () => {
    test.beforeEach(async ({ editorPage }) => {
        baseline = await new EditorShell(editorPage).snapshot();
    });

    test.afterEach(async ({ editorPage }) => {
        await new EditorShell(editorPage).restore(baseline);
    });

    test('add sound slot', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { sound: {} } });

        await hierarchy.setSelection([id]);
        const sound = inspector.component('sound');
        await expect(sound).toBeVisible();

        // a fresh sound component already ships one slot, keyed "1"
        await expect(sound.locator(SLOT_PANEL)).toHaveCount(1);

        await sound.locator('button', { hasText: 'ADD SLOT' }).click();

        await expect(sound.locator(SLOT_PANEL)).toHaveCount(2);
        await expect.poll(() => inspector.read(id, 'components.sound.slots.2.name')).toBe('Slot 2');
    });

    test('edit slot volume', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { sound: {} } });

        await hierarchy.setSelection([id]);
        const sound = inspector.component('sound');

        // the component carries its own Volume too, so scope to the slot panel
        const slot = sound.locator(SLOT_PANEL);
        await expect(slot).toBeVisible();

        await inspector.setSlider(slot, 'Volume', 0.4);

        await expect.poll(() => inspector.read(id, 'components.sound.slots.1.volume')).toBe(0.4);
        expect(await inspector.read(id, 'components.sound.volume')).toBe(1);
    });

    test('assign audio asset', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const assets = new AssetsPanel(editorPage);
        const audio = await assets.uploadFile({
            name: `${uniqueName('sfx')}.wav`,
            type: 'audio',
            mimeType: 'audio/wav',
            buffer: WAV
        });
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { sound: {} } });

        await hierarchy.setSelection([id]);
        const slot = inspector.component('sound').locator(SLOT_PANEL);
        await expect(inspector.assetSlot(slot, 'Asset')).toBeVisible();

        await inspector.assignAsset(slot, 'Asset', audio.name);

        await expect.poll(() => inspector.read(id, 'components.sound.slots.1.asset')).toBe(audio.id);
    });

    test('assign state graph shows layers', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const assets = new AssetsPanel(editorPage);
        const graph = await assets.create('createAnimStateGraph', { name: uniqueName('graph') });
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { anim: {} } });

        await hierarchy.setSelection([id]);
        const anim = inspector.component('anim');
        await expect(inspector.assetSlot(anim, 'State Graph')).toBeVisible();
        await expect(anim.locator(LAYER_PANEL)).toHaveCount(0);

        await inspector.assignAsset(anim, 'State Graph', graph.name);

        await expect.poll(() => inspector.read(id, 'components.anim.stateGraphAsset')).toBe(graph.id);

        // one collapsible panel per layer of the graph, headed "Layer: <name>"
        await expect(anim.locator(LAYER_PANEL).first()).toBeVisible();
        await expect(anim.locator(`${LAYER_PANEL} .pcui-panel-header-title`).first()).toContainText('Layer:');
    });

    test('edit anim speed', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { anim: {} } });

        await hierarchy.setSelection([id]);
        const anim = inspector.component('anim');
        await expect(anim).toBeVisible();

        await inspector.setSlider(anim, 'Speed', 0.5);

        await expect.poll(() => inspector.read(id, 'components.anim.speed')).toBe(0.5);

        await inspector.shell.undo();
        await expect.poll(() => inspector.read(id, 'components.anim.speed')).toBe(1);
    });

    for (const { type, item } of SPRITE_TYPES) {
        test(`add sprite (type: ${type})`, async ({ editorPage }) => {
            const inspector = new Inspector(editorPage);
            const hierarchy = new HierarchyPanel(editorPage);
            const id = await hierarchy.createEntity({ name: uniqueName('ent') });

            await hierarchy.setSelection([id]);
            await expect(inspector.entity).toBeVisible();
            await inspector.addComponent(['2D', item]);

            const sprite = inspector.component('sprite');
            await expect(sprite).toBeVisible();
            await expect.poll(() => inspector.read(id, 'components.sprite.type')).toBe(type);

            // an animated sprite plays clips, so it drops the single frame and sprite slot
            expect(await inspector.fieldVisible(sprite, 'Frame')).toBe(type === 'simple');
            await expect(sprite.locator(CLIP_PANEL)).toHaveCount(type === 'animated' ? 1 : 0);
        });
    }

    test('assign sprite asset', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const assets = new AssetsPanel(editorPage);
        const asset = await assets.create('createSprite', { name: uniqueName('sprite') });
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { sprite: {} } });

        await hierarchy.setSelection([id]);
        const sprite = inspector.component('sprite');
        await expect(inspector.assetSlot(sprite, 'Sprite')).toBeVisible();

        await inspector.assignAsset(sprite, 'Sprite', asset.name);

        await expect.poll(() => inspector.read(id, 'components.sprite.spriteAsset')).toBe(asset.id);

        await inspector.clearAsset(sprite, 'Sprite');
        await expect.poll(() => inspector.read(id, 'components.sprite.spriteAsset')).toBeNull();
    });

    test('edit sprite colour', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { sprite: {} } });

        await hierarchy.setSelection([id]);
        const sprite = inspector.component('sprite');
        await expect(sprite).toBeVisible();

        await inspector.openColorPicker(sprite, 'Color');
        await inspector.setColorChannel('b', 32);
        await inspector.closeColorPicker();

        await expect.poll(async () => (await inspector.read(id, 'components.sprite.color'))[2]).toBeCloseTo(32 / 255, 5);
    });

    test('add animation clip', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({
            name: uniqueName('ent'),
            components: { sprite: { type: 'animated' } }
        });

        await hierarchy.setSelection([id]);
        const sprite = inspector.component('sprite');
        await expect(sprite).toBeVisible();
        await expect(sprite.locator(CLIP_PANEL)).toHaveCount(0);

        await sprite.locator('button', { hasText: 'ADD CLIP' }).click();

        await expect(sprite.locator(CLIP_PANEL)).toHaveCount(1);
        await expect.poll(() => inspector.read(id, 'components.sprite.clips.0.name')).toBe('Clip 1');

        const clip = sprite.locator(CLIP_PANEL);
        await inspector.setNumber(clip, 'Frames Per Second', 12);
        await expect.poll(() => inspector.read(id, 'components.sprite.clips.0.fps')).toBe(12);
    });

    test('edit script attribute value', async ({ editorPage }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const name = uniqueName('attr').replace(/[^a-z0-9]/gi, '');

        await createScript(editorPage, `${name}.mjs`, esm(name));

        const id = await hierarchy.createEntity({ name: uniqueName('ent') });
        await editorPage.evaluate(([entityId, script]) => {
            const entities = window.editor.api.globals.entities;
            return entities.addScript([entities.get(entityId)!], script);
        }, [id, name] as const);

        await hierarchy.setSelection([id]);
        const panel = inspector.component('script').locator('.script-component-inspector-script');
        await expect(panel).toBeVisible();

        // the attribute label is the declared name, since the script gives no title
        await expect.poll(() => inspector.fieldVisible(panel, 'speed'), { timeout: JOB_TIMEOUT }).toBe(true);

        await inspector.setNumber(panel, 'speed', 9);

        await expect.poll(() => inspector.read(id, `components.script.scripts.${name}.attributes.speed`)).toBe(9);

        await inspector.shell.undo();
        await expect.poll(() => inspector.read(id, `components.script.scripts.${name}.attributes.speed`)).toBe(1);
    });
});
