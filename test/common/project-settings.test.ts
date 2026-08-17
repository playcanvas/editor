import { expect } from 'chai';
import { describe, it } from 'mocha';
import { DEVICETYPE_WEBGL2, DEVICETYPE_WEBGPU } from 'playcanvas';

import { migrateGlslShaderTranspilation, useGlslShaderTranspilation } from '../../src/common/project-settings';

describe('GLSL shader transpilation', () => {
    it('is enabled only for WebGPU when not explicitly disabled', () => {
        expect(useGlslShaderTranspilation(true, undefined)).to.equal(true);
        expect(useGlslShaderTranspilation(true, true)).to.equal(true);
        expect(useGlslShaderTranspilation(true, false)).to.equal(false);
        expect(useGlslShaderTranspilation(false, undefined)).to.equal(false);
        expect(useGlslShaderTranspilation(false, true)).to.equal(false);
        expect(useGlslShaderTranspilation(false, false)).to.equal(false);
    });

    it('migrates legacy device types to a definite boolean only once', () => {
        const webgpu = { deviceTypes: [DEVICETYPE_WEBGPU] };
        const webgl = { deviceTypes: [DEVICETYPE_WEBGL2] };

        const migrateWebGpu = migrateGlslShaderTranspilation(webgpu);
        const migrateWebGl = migrateGlslShaderTranspilation(webgl);

        expect(migrateWebGpu).to.be.a('function');
        expect(migrateWebGl).to.be.a('function');
        expect(webgpu['enableGlslShaderTranspilation']).to.equal(true);
        expect(webgl['enableGlslShaderTranspilation']).to.equal(false);
        expect(migrateWebGpu({})).to.equal(true);
        expect(migrateWebGpu({})).to.equal(false);
        expect(migrateWebGl({})).to.equal(true);
        expect(migrateWebGl({})).to.equal(false);
    });

    it('skips migration when realtime data has an explicit value', () => {
        for (const value of [false, true]) {
            const migrate = migrateGlslShaderTranspilation({});

            expect(migrate?.({ enableGlslShaderTranspilation: value })).to.equal(false);
            expect(migrate?.({})).to.equal(false);
        }
    });

    it('migrates empty legacy settings to false', () => {
        const settings = {};
        const migrate = migrateGlslShaderTranspilation(settings);

        expect(settings['enableGlslShaderTranspilation']).to.equal(false);
        expect(migrate?.({})).to.equal(true);
        expect(migrate?.({})).to.equal(false);
    });

    it('preserves explicit GLSL shader transpilation values', () => {
        const settings = {
            enableGlslShaderTranspilation: false,
            enableWebGpu: true
        };

        expect(migrateGlslShaderTranspilation(settings)).to.equal(undefined);
        expect(settings.enableGlslShaderTranspilation).to.equal(false);
    });
});
