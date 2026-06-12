import { expect } from 'chai';
import { describe, it } from 'mocha';

import { summarizeDiff } from '../../src/editor/pickers/version-control/vc-helpers';

describe('summarizeDiff', () => {
    it('labels whole-item adds and deletes from pathless entries', () => {
        const summary = summarizeDiff({
            numConflicts: 2,
            conflicts: [
                { itemType: 'texture', itemName: 'brick.png', data: [{ missingInDst: true }] },
                { itemType: 'texture', itemName: 'old.png', data: [{ missingInSrc: true }] }
            ]
        });
        expect(summary.groups[0].items[0].status).to.equal('added');
        expect(summary.groups[0].items[1].status).to.equal('deleted');
    });

    it('keeps items modified when only fields carry missing flags', () => {
        const summary = summarizeDiff({
            numConflicts: 1,
            conflicts: [
                { itemType: 'scene', itemName: 'Main', data: [{ path: 'entities.g.components.light.color', missingInDst: true }] }
            ]
        });
        expect(summary.groups[0].items[0].status).to.equal('modified');
    });
});
