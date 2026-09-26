import { expect } from 'chai';
import { describe, it } from 'mocha';

import { modelMeta } from '../../../src/common/asset-meta/model';

export const glb = (json: object) => {
    const text = new TextEncoder().encode(JSON.stringify(json));
    const pad = (4 - (text.length % 4)) % 4;
    const b = new Uint8Array(20 + text.length + pad).fill(0x20, 20 + text.length);
    const v = new DataView(b.buffer);
    v.setUint32(0, 0x46546c67, true);
    v.setUint32(4, 2, true);
    v.setUint32(8, b.length, true);
    v.setUint32(12, text.length + pad, true);
    v.setUint32(16, 0x4e4f534a, true);
    b.set(text, 20);
    return b;
};

const json = (value: object) => new TextEncoder().encode(JSON.stringify(value));

const MODEL = {
    model: {
        meshes: [{ count: 6 }],
        meshInstances: [{}],
        nodes: [{}, {}],
        vertices: [{ position: { data: [0, 0, 0, 1, 1, 1] }, normal: { data: [] } }]
    }
};

describe('modelMeta', () => {
    it('counts a json model like the server', () => {
        expect(modelMeta(json(MODEL), 'a.json')).to.deep.equal({
            meshes: 1,
            meshInstances: 1,
            nodes: 2,
            skins: 0,
            vertices: 2,
            triangles: 2,
            attributes: { position: 1, normal: 1 },
            meshCompression: 'none'
        });
    });

    it('counts a glb like the server', () => {
        const gltf = {
            meshes: [
                {
                    primitives: [
                        { attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, mode: 4 },
                        { attributes: { POSITION: 0 }, mode: 4, extensions: { KHR_draco_mesh_compression: {} } }
                    ]
                }
            ],
            accessors: [{ count: 3 }, { count: 3 }, { count: 6 }],
            nodes: [{ name: 'a', mesh: 0 }, { name: 'b' }, { name: 'c', mesh: 0, skin: 0 }]
        };
        expect(modelMeta(glb(gltf), 'a.glb')).to.deep.equal({
            meshes: 2,
            meshInstances: 4,
            meshInstancesNames: ['a', 'a', 'c', 'c'],
            nodes: 3,
            skins: 1,
            vertices: 3,
            triangles: 3,
            attributes: { POSITION: 2, NORMAL: 1 },
            meshCompression: 'draco'
        });
    });

    it('skips primitives without an explicit mode, as the server does', () => {
        const gltf = { meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }], accessors: [{ count: 3 }], nodes: [] };
        expect(modelMeta(glb(gltf), 'a.glb').triangles).to.equal(0);
    });

    it('reads the file the way the server picks it, by name', () => {
        expect(() => modelMeta(json(MODEL), 'a.glb')).to.throw();
        expect(() => modelMeta(glb({ meshes: [], nodes: [] }), 'a.json')).to.throw();
    });

    it('throws on json the server cannot parse, a byte order mark included', () => {
        expect(() => modelMeta(new TextEncoder().encode('{'), 'a.json')).to.throw();
        expect(() => modelMeta(new Uint8Array([0xef, 0xbb, 0xbf, ...json(MODEL)]), 'a.json')).to.throw();
    });
});
