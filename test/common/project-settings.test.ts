import { expect } from 'chai';
import { describe, it } from 'mocha';

import { useGlslTranspilation } from '../../src/common/project-settings';

describe('GLSL shader transpilation', () => {
    it('is enabled only for WebGPU when not explicitly disabled', () => {
        expect(useGlslTranspilation(true, undefined)).to.equal(true);
        expect(useGlslTranspilation(true, true)).to.equal(true);
        expect(useGlslTranspilation(true, false)).to.equal(false);
        expect(useGlslTranspilation(false, undefined)).to.equal(false);
        expect(useGlslTranspilation(false, true)).to.equal(false);
        expect(useGlslTranspilation(false, false)).to.equal(false);
    });
});
