import { expect } from 'chai';
import { describe, it } from 'mocha';

import {
    acceptsAssetDropType,
    toLinkedFieldValue,
    toOptions
} from '../../src/common/pcui/compat-utils';

describe('attributes pcui compatibility utils', () => {
    it('keeps empty enum placeholders empty when converting numeric options', () => {
        expect(toOptions([{ v: '', t: '...' }, { v: '2', t: 'Two' }], 'number')).to.deep.equal([
            { v: '', t: '...' },
            { v: 2, t: 'Two' }
        ]);
    });

    it('accepts wildcard asset drop types', () => {
        expect(acceptsAssetDropType('*', 'asset.texture')).to.equal(true);
        expect(acceptsAssetDropType('texture', 'asset.material')).to.equal(false);
    });

    it('does not write the entity multi-select label into the input value', () => {
        expect(toLinkedFieldValue('entity', 'various', true)).to.equal(null);
        expect(toLinkedFieldValue('string', 'various', true)).to.equal('various');
    });
});
