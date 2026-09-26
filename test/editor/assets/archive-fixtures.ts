export const BRANCH = 'b1';

export const url = (id: number, filename: string) =>
    `/api/assets/${id}/file/${encodeURIComponent(filename)}?branchId=${BRANCH}`;

// mimics Observer.get: returns a deep copy unless raw, null for missing leaves
export const fake = (doc: Record<string, any>, raw = false) => ({
    get: (path: string) => {
        const v = path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), doc as any);
        if (v == null) {
            return v;
        }
        return raw ? v : structuredClone(v);
    }
});

export const registry = (...docs: Record<string, any>[]) => {
    const map = new Map(docs.map((d) => [d.id, fake(d)]));
    return (id: number | string) => map.get(Number(id)) ?? null;
};

export const albedo = { id: 40, type: 'texture', source: false, name: 'Albedo', file: { filename: 'albedo.png', size: 100 } };
export const sheen = { id: 41, type: 'texture', source: false, name: 'Sheen', file: { filename: 'sheen.png', size: 50 } };
export const sourceTex = { id: 42, type: 'texture', source: true, name: 'Albedo.psd', file: { filename: 'albedo.psd', size: 999 } };
export const sky = {
    id: 50,
    type: 'cubemap',
    source: false,
    name: 'Sky',
    file: { filename: 'sky.dds', size: 400 },
    data: { textures: [40, 40, null, 41, 404, null] }
};
export const steel = {
    id: 30,
    type: 'material',
    source: false,
    name: 'Steel',
    data: { diffuseMap: 40, normalMap: 404, opacityMap: null, aoMap: 42, cubeMap: 50, opacity: 0, useMetalness: false, sheenMap: 41 }
};
export const car = {
    id: 60,
    type: 'model',
    source: false,
    name: 'My Model.glb',
    file: { filename: 'model.glb', size: 1000 },
    data: { mapping: [{ material: 30 }, { material: 404 }], area: 0 }
};
export const legacyFont = {
    id: 10,
    uniqueId: '5001',
    type: 'font',
    source: false,
    name: 'Arial.json',
    file: { filename: 'arial.png', size: 70 },
    data: { info: { maps: [{}, {}] }, chars: {} }
};
export const refFont = {
    id: 20,
    uniqueId: '6001',
    type: 'font',
    source: false,
    name: 'unisans.otf',
    file: { filename: 'unisans.json', size: 2 },
    data: { jsonAsset: 21, textureAssets: [22, 23] }
};
export const refJson = { id: 21, type: 'json', source: false, name: 'unisans.json', file: { filename: 'unisans.json', size: 300 } };
export const refPage0 = { id: 22, type: 'texture', source: false, name: 'unisans.png', file: { filename: 'unisans.png', size: 500 } };
export const refPage1 = { id: 23, type: 'texture', source: false, name: 'unisans1.png', file: { filename: 'unisans1.png', size: 600 } };

export const lookup = registry(albedo, sheen, sourceTex, sky, steel, car, legacyFont, refFont, refJson, refPage0, refPage1);
