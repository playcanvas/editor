import { expect } from 'chai';
import { describe, it } from 'mocha';
import { DEVICETYPE_WEBGL2, DEVICETYPE_WEBGPU } from 'playcanvas';

import { migrateGlslTranspilation, useGlslTranspilation } from '../../src/common/project-settings';

describe('GLSL shader transpilation', () => {
    it('is enabled only for WebGPU when not explicitly disabled', () => {
        expect(useGlslTranspilation(true, undefined)).to.equal(true);
        expect(useGlslTranspilation(true, true)).to.equal(true);
        expect(useGlslTranspilation(true, false)).to.equal(false);
        expect(useGlslTranspilation(false, undefined)).to.equal(false);
        expect(useGlslTranspilation(false, true)).to.equal(false);
        expect(useGlslTranspilation(false, false)).to.equal(false);
    });

    it('migrates legacy device types to a definite boolean only once', () => {
        const webgpu = { deviceTypes: [DEVICETYPE_WEBGPU] };
        const webgl = { deviceTypes: [DEVICETYPE_WEBGL2] };

        const migrateWebGpu = migrateGlslTranspilation(webgpu);
        const migrateWebGl = migrateGlslTranspilation(webgl);

        expect(migrateWebGpu).to.be.a('function');
        expect(migrateWebGl).to.be.a('function');
        expect(webgpu['enableGlslTranspilation']).to.equal(true);
        expect(webgl['enableGlslTranspilation']).to.equal(false);
        expect(migrateWebGpu({})).to.equal(true);
        expect(migrateWebGpu({})).to.equal(false);
        expect(migrateWebGl({})).to.equal(true);
        expect(migrateWebGl({})).to.equal(false);
    });

    it('skips migration when realtime data has an explicit value', () => {
        for (const value of [false, true]) {
            const migrate = migrateGlslTranspilation({});

            expect(migrate?.({ enableGlslTranspilation: value })).to.equal(false);
            expect(migrate?.({})).to.equal(false);
        }
    });

    it('migrates empty legacy settings to false', () => {
        const settings = {};
        const migrate = migrateGlslTranspilation(settings);

        expect(settings['enableGlslTranspilation']).to.equal(false);
        expect(migrate?.({})).to.equal(true);
        expect(migrate?.({})).to.equal(false);
    });

    it('preserves explicit GLSL shader transpilation values', () => {
        const settings = {
            enableGlslTranspilation: false,
            enableWebGpu: true
        };

        expect(migrateGlslTranspilation(settings)).to.equal(undefined);
        expect(settings.enableGlslTranspilation).to.equal(false);
    });
});
