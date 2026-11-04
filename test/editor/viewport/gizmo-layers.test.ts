import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { expect } from 'chai';
import { build } from 'esbuild';
import { after, describe, it } from 'mocha';
import type { Entity } from 'playcanvas';
import {
    AppBase,
    AppOptions,
    Layer,
    ModelComponentSystem,
    NullGraphicsDevice,
    RenderComponentSystem
} from 'playcanvas';

const handle = { unbind: (): void => undefined };

// minimal stand-in for the editor global and an entity observer
const createEditor = () => {
    const handlers = new Map<string, ((...args: any[]) => void)[]>();
    const methods = new Map<string, (...args: any[]) => any>();
    const layers = new Map<string, Layer>();
    const on = (name: string, fn: (...args: any[]) => void) => {
        handlers.set(name, [...(handlers.get(name) ?? []), fn]);
        return handle;
    };
    return {
        on,
        once: on,
        emit: (name: string, ...args: any[]) => handlers.get(name)?.forEach((fn) => fn(...args)),
        method: (name: string, fn: (...args: any[]) => any) => methods.set(name, fn),
        call: (name: string, ...args: any[]) => {
            if (name === 'gizmo:layers') {
                if (!layers.has(args[0])) {
                    layers.set(args[0], new Layer({ name: args[0] }));
                }
                return layers.get(args[0]);
            }
            if (name === 'color:hsl2rgb') {
                return [1, 1, 1];
            }
            return methods.get(name)?.(...args);
        }
    };
};

const createObserver = (component: string) => ({
    get: (path: string) => (path === 'resource_id' ? `${component}-entity` : undefined),
    has: (path: string) => path === `components.${component}`,
    on: () => handle,
    once: () => handle
});

describe('viewport gizmo addModelToLayers overrides', () => {
    after(() => {
        delete (globalThis as any).editor;
    });

    it('do not throw when the layer composition changes before a gizmo has a model', async function () {
        // bundling and loading the engine can exceed the default timeout
        this.timeout(30000);

        const editor = createEditor();
        (globalThis as any).editor = editor;

        // bundle so the '@/' path alias resolves, keeping the same playcanvas module as this test
        const outfile = path.resolve('node_modules/.cache/gizmo-layers.test.mjs');
        await build({
            stdin: {
                contents: ['collision', 'particles', 'zone'].map((name) => `import './gizmo-${name}';`).join('\n'),
                resolveDir: path.resolve('src/editor/viewport/gizmo'),
                loader: 'ts'
            },
            bundle: true,
            format: 'esm',
            platform: 'node',
            external: ['playcanvas'],
            alias: { '@': path.resolve('src') },
            outfile,
            logLevel: 'silent'
        });
        await import(pathToFileURL(outfile).href);

        const options = new AppOptions();
        options.graphicsDevice = new NullGraphicsDevice({} as HTMLCanvasElement);
        options.componentSystems = [ModelComponentSystem, RenderComponentSystem];
        const app = new AppBase({} as HTMLCanvasElement);
        app.init(options);

        editor.emit('load');
        editor.emit('viewport:load', app);
        editor.emit('entities:add', createObserver('collision'));
        editor.emit('entities:add', createObserver('zone'));
        editor.emit('selector:change', 'entity', [createObserver('particlesystem')]);

        const gizmos = app.root.find(
            (e: any) => e.model && Object.hasOwn(e.model, 'addModelToLayers') && !e.model.meshInstances
        ) as Entity[];
        expect(gizmos.length).to.equal(3);
        for (const gizmo of gizmos) {
            for (let e: any = gizmo; e; e = e.parent) {
                e.enabled = true;
            }
            gizmo.model.enabled = true;
        }

        for (const gizmo of gizmos) {
            expect(() => (gizmo.model as any).addModelToLayers()).to.not.throw();
        }
        expect(() => app.scene.fire('set:layers', app.scene.layers, app.scene.layers)).to.not.throw();
    });
});
