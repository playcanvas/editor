import { expect } from 'chai';
import { describe, it } from 'mocha';

import { buildArchive } from '../../../src/editor/assets/archive/entries';

import { albedo, BRANCH, car, fake, lookup, sheen, sky, sourceTex, steel, url } from './archive-fixtures';

describe('buildArchive model', () => {
    it('matches the model-archive layout', () => {
        const [err, plan] = buildArchive(fake(car), lookup, BRANCH);
        expect(err).to.equal(null);
        expect(plan.name).to.equal('My Model.zip');
        expect(plan.entries).to.deep.equal([
            { path: 'My Model.mapping.json', json: { mapping: [{ path: '30/Steel.json' }, { path: null }], area: 0 } },
            // model-archive prunes every falsy material field (opacity 0, useMetalness false)
            { path: '30/Steel.json', json: { diffuseMap: '../40/albedo.png', cubeMap: '../50/Sky.json', sheenMap: 41, mapping_format: 'path' } },
            { path: '50/sky.dds', id: 50, url: url(50, 'sky.dds'), size: 400 },
            {
                path: '50/Sky.json',
                json: {
                    textures: ['../40/albedo.png', '../40/albedo.png', null, '../41/sheen.png', 404, null],
                    prefiltered: 'sky.dds'
                }
            },
            { path: '40/albedo.png', id: 40, url: url(40, 'albedo.png'), size: 100 },
            { path: '41/sheen.png', id: 41, url: url(41, 'sheen.png'), size: 50 },
            { path: 'model.glb', id: 60, url: url(60, 'model.glb'), size: 1000 }
        ]);
    });

    it('derives names like the job', () => {
        const name = (n: string | undefined) => buildArchive(fake({ ...car, name: n }), lookup, BRANCH)[1].name;
        expect(name('Scene.json')).to.equal('Scene.zip');
        // lowercase test but case-sensitive strip in the job
        expect(name('Car.GLB')).to.equal('Car.GLB.zip');
        expect(name(undefined)).to.equal('Untitled.zip');
        expect(name('dir/Scene.json')).to.equal('Scene.zip');
        // node basename strips a bare extension to ''
        expect(name('.glb')).to.equal('.zip');
    });

    it('fails without a file', () => {
        expect(buildArchive(fake({ ...car, file: null }), lookup, BRANCH)[0]).to.equal('Asset 60 has no file');
    });

    it('does not mutate registry documents', () => {
        const docs = [albedo, sheen, sourceTex, sky, steel].map((d) => structuredClone(d));
        const raw = new Map(docs.map((d) => [d.id, fake(d, true)]));
        const model = structuredClone(car);
        buildArchive(fake(model, true), (id) => raw.get(Number(id)) ?? null, BRANCH);
        expect(docs).to.deep.equal([albedo, sheen, sourceTex, sky, steel]);
        expect(model).to.deep.equal(car);
    });
});
