import { expect } from 'chai';
import { describe, it } from 'mocha';

import { isUnsetPriorityScripts } from '../../../src/editor/scene-settings/priority-scripts';

describe('priority_scripts cleanup', () => {
    it('treats a raw null the same as an absent key', () => {
        expect(isUnsetPriorityScripts(undefined)).to.equal(true);
        expect(isUnsetPriorityScripts(null)).to.equal(true);
        expect(isUnsetPriorityScripts([])).to.equal(false);
        expect(isUnsetPriorityScripts(['a.js'])).to.equal(false);
    });
});
