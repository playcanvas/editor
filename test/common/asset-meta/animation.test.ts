import { expect } from 'chai';
import { describe, it } from 'mocha';

import { animationMeta } from '../../../src/common/asset-meta/animation';

import { glb } from './model.test';

describe('animationMeta', () => {
    it('reads json animations', () => {
        const b = new TextEncoder().encode(JSON.stringify({ animation: { name: 'run', duration: 1.5 } }));
        expect(animationMeta(b, 'run.json')).to.deep.equal({ name: 'run', duration: 1.5 });
    });

    it('spans all scalar sampler inputs of the first glb animation', () => {
        const gltf = {
            animations: [{ name: 'walk', samplers: [{ input: 0 }, { input: 1 }, { input: 2 }, { input: 9 }] }, { name: 'other', samplers: [] }],
            accessors: [
                { type: 'SCALAR', min: [0.5], max: [2] },
                { type: 'SCALAR', min: [0], max: [1.5] },
                { type: 'VEC3', min: [-9, -9, -9], max: [9, 9, 9] }
            ]
        };
        expect(animationMeta(glb(gltf), 'walk.glb')).to.deep.equal({ name: 'walk', duration: 2 });
    });

    it('throws for a glb without animations', () => {
        expect(() => animationMeta(glb({ animations: [] }), 'a.glb')).to.throw('no animations found');
    });
});
