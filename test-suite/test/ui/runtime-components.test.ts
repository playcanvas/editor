import { readFileSync } from 'node:fs';

import { JOB_TEST_TIMEOUT, READY_TIMEOUT } from '../../lib/constants';
import { expect, test } from '../../lib/fixtures';
import { AssetWorkflows } from '../../lib/pages/asset-workflows';
import { AssetsPanel } from '../../lib/pages/assets';
import { EditorShell, type ProjectState } from '../../lib/pages/common';
import { HierarchyPanel } from '../../lib/pages/hierarchy';
import { Inspector } from '../../lib/pages/inspector';
import { waitForEditor } from '../../lib/ready';
import { uniqueName } from '../../lib/utils';

const JOINTS = ['Fixed', 'Ball', 'Hinge', 'Slider', '6DoF'];
const AMMO = ['ammo.js', 'ammo.wasm.js', 'ammo.wasm.wasm'].map(name => ({
    name,
    mimeType: name.endsWith('.wasm') ? 'application/wasm' : 'text/javascript',
    buffer: readFileSync(new URL(`../fixtures/files/ammo/${name}`, import.meta.url))
}));
let baseline: ProjectState;

test.describe('runtime components', () => {
    test.beforeEach(async ({ editorPage }) => {
        baseline = await new EditorShell(editorPage).snapshot();
    });

    test.afterEach(async ({ editorPage }) => {
        await new EditorShell(editorPage).restore(baseline);
    });

    for (const type of JOINTS) {
        test(`create ${type} joint, assign bodies and launch`, async ({ editorPage }) => {
            test.setTimeout(JOB_TEST_TIMEOUT);
            const inspector = new Inspector(editorPage);
            const hierarchy = new HierarchyPanel(editorPage);
            const assets = new AssetsPanel(editorPage);
            const workflows = new AssetWorkflows(editorPage);
            const modules = [];
            for (const file of AMMO) {
                const wasm = file.name.endsWith('.wasm');
                const [asset] = await workflows.upload(file, [wasm ? 'wasm' : 'script']);
                modules.push(asset);
                await assets.select(asset.name);
                if (await assets.field(asset.id, 'preload') !== wasm) {
                    await inspector.toggle(inspector.asset, 'Preload');
                }
                expect(await assets.field(asset.id, 'preload')).toBe(wasm);
                await assets.flush(asset.id);
            }
            const [fallback, glue, wasm] = modules;
            const module = inspector.panel(inspector.asset, 'WASM MODULE');
            await inspector.setText(module, 'Name', 'Ammo');
            await inspector.assignAsset(module, 'Glue script', glue.name);
            await inspector.assignAsset(module, 'Fallback script', fallback.name);
            const data = { moduleName: 'Ammo', glueScriptId: glue.id, fallbackScriptId: fallback.id };
            expect(await assets.field(wasm.id, 'data')).toMatchObject(data);
            await assets.flush(wasm.id);
            const names = [uniqueName('anchor'), uniqueName('body')];
            const a = await hierarchy.createEntity({ name: names[0], components: { collision: {}, rigidbody: { type: 'static' }, render: { type: 'box' } } });
            const b = await hierarchy.createEntity({ name: names[1], components: { collision: {}, rigidbody: { type: 'dynamic' }, render: { type: 'box' } } });
            const id = await hierarchy.createEntity({ name: uniqueName('joint') });

            await hierarchy.setSelection([id]);
            await inspector.addComponent(['Physics', 'Joint']);
            const joint = inspector.component('joint');
            await expect(joint).toBeVisible();
            await inspector.setSelect(joint, 'Type', type);
            await inspector.pickEntity(joint, 'Entity A', names[0]);
            await inspector.pickEntity(joint, 'Entity B', names[1]);

            if (type === 'Hinge' || type === 'Slider') {
                await inspector.toggle(joint, 'Enable Limits');
                await inspector.setVector(joint, 'Limits', [-1, 1]);
                await inspector.setNumber(joint, 'Motor Speed', 0.5);
                await inspector.setNumber(joint, 'Max Motor Force', 2);
                expect(await inspector.read(id, 'components.joint.limits')).toEqual([-1, 1]);
                expect(await inspector.read(id, 'components.joint.motorSpeed')).toBe(0.5);
            }

            expect(await inspector.read(id, 'components.joint.entityA')).toBe(a);
            expect(await inspector.read(id, 'components.joint.entityB')).toBe(b);
            await inspector.shell.flushScene();
            await editorPage.reload();
            await waitForEditor(editorPage);
            expect(await assets.field(wasm.id, 'data')).toMatchObject(data);
            for (const asset of modules) {
                expect(await assets.field(asset.id, 'preload')).toBe(asset.id === wasm.id);
            }
            expect(await inspector.read(id, 'components.joint.entityA')).toBe(a);
            expect(await inspector.read(id, 'components.joint.entityB')).toBe(b);

            const launch = await workflows.launch();
            const state = await launch.evaluate((id) => {
                const joint = (window as any).pc.app.root.findByGuid(id).joint;
                return { type: joint.type, a: joint.entityA.getGuid(), b: joint.entityB.getGuid(), constraint: !!joint.constraint };
            }, id);
            expect(state).toEqual({ type: type.toLowerCase(), a, b, constraint: true });
            if (type === 'Slider') {
                const moved = await new EditorShell(launch).arm((id: string) => {
                    const app = (window as any).pc.app;
                    const body = app.root.findByGuid(id);
                    return { done: new Promise<number>((resolve) => {
                        const check = () => {
                            const x = body.getPosition().x;
                            if (Math.abs(x) > 0.01) {
                                app.off('frameend', check);
                                resolve(x);
                            }
                        };
                        app.on('frameend', check);
                        check();
                    }) };
                }, b, { what: 'slider motor to move its body', timeout: READY_TIMEOUT });
                expect(Math.abs(await moved())).toBeLessThanOrEqual(1.1);
            }
            await launch.close();
        });
    }
});
