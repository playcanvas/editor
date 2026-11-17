import { expect } from 'chai';
import { describe, it } from 'mocha';

import { profilerParam } from '../../../src/editor/mcp/engine-version';

describe('profilerParam', () => {
    it('uses profile before engine 2.25, which loads the profiler build', () => {
        expect(profilerParam('1.77.0')).to.equal('profile');
        expect(profilerParam('2.23.3')).to.equal('profile');
        expect(profilerParam('2.24.1')).to.equal('profile');
    });

    it('uses profiler from engine 2.25, which has no profiler build', () => {
        expect(profilerParam('2.25.0')).to.equal('profiler');
        expect(profilerParam('2.25.0-beta.7')).to.equal('profiler');
        expect(profilerParam('2.30.1')).to.equal('profiler');
        expect(profilerParam('3.0.0')).to.equal('profiler');
    });
});
