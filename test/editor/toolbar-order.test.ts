import { expect } from 'chai';
import { describe, it } from 'mocha';

import { mergeToolbarOrder, moveToolbarItem } from '../../src/editor/toolbar/toolbar-order';

describe('toolbar order', () => {
    it('keeps valid preferences and appends new actions', () => {
        expect(mergeToolbarOrder(['publish', 'mcp', 'publish', 'removed'], ['mcp', 'code', 'publish'])).to.deep.equal([
            'publish',
            'mcp',
            'code'
        ]);
    });

    it('moves actions before and after a target', () => {
        expect(moveToolbarItem(['mcp', 'code', 'publish'], 'publish', 'mcp', false)).to.deep.equal([
            'publish',
            'mcp',
            'code'
        ]);
        expect(moveToolbarItem(['mcp', 'code', 'publish'], 'mcp', 'publish', true)).to.deep.equal([
            'code',
            'publish',
            'mcp'
        ]);
    });
});
