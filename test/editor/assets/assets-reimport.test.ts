import { expect } from 'chai';
import { after, describe, it } from 'mocha';

type Fn = (...args: any[]) => any;

// the smallest editor the module touches: once('load'), method/call and the rest client
const boot = async (reimport: Fn) => {
    const methods = new Map<string, Fn>();
    const log: unknown[][] = [];
    let load: Fn = () => undefined;
    (globalThis as any).editor = {
        once: (_e: string, fn: Fn) => {
            load = fn;
        },
        method: (name: string, fn: Fn) => methods.set(name, fn),
        call: (name: string, ...args: unknown[]) => {
            log.push([name, ...args]);
            return methods.get(name)?.(...args);
        },
        api: {
            globals: {
                rest: {
                    assets: {
                        assetReimport: (id: number, data: unknown) => {
                            log.push(['rest', id, data]);
                            const req = {
                                on: (evt: string, fn: Fn) => (evt === 'load' && fn(200, { id, server: true }), req)
                            };
                            return req;
                        }
                    }
                }
            }
        }
    };
    await import(`../../../src/editor/assets/assets-reimport.ts?${Math.random()}`);
    load();
    methods.set('textures:reimport', reimport);
    methods.set('assets:pipeline:options', (o: object) => ({ pow2: true, ...o }));
    methods.set('assets:get', (id: number) => ({ json: () => ({ id, client: true }) }));
    const run = (type: string) =>
        new Promise<unknown[]>((resolve) => {
            methods.get('assets:reimport')(7, type, { pow2: false }, (...res: unknown[]) => resolve(res));
        });
    return { run, log };
};

describe('assets:reimport', () => {
    after(() => {
        delete (globalThis as any).editor;
    });

    it('re-imports a texture in the editor and answers with the asset json', async () => {
        const t = await boot(async () => true);
        expect(await t.run('texture')).to.deep.equal([null, { id: 7, client: true }]);
        expect(t.log.some(([n]) => n === 'rest')).to.equal(false);
    });

    it('falls back to the server re-import when the editor declines', async () => {
        const t = await boot(async () => false);
        expect(await t.run('textureatlas')).to.deep.equal([null, { id: 7, server: true }]);
        expect(t.log.find(([n]) => n === 'rest')).to.deep.equal(['rest', 7, { pow2: false }]);
    });

    it('reports a client failure after an upload instead of re-importing twice', async () => {
        const t = await boot(() => Promise.reject(new Error('network down')));
        expect(await t.run('texture')).to.deep.equal(['network down']);
        expect(t.log).to.deep.include(['status:error', 'network down']);
        expect(t.log.some(([n]) => n === 'rest')).to.equal(false);
    });

    it('never tries the editor for other types', async () => {
        let asked = false;
        const t = await boot(async () => {
            asked = true;
            return true;
        });
        expect(await t.run('scene')).to.deep.equal([null, { id: 7, server: true }]);
        expect(asked).to.equal(false);
    });
});
