import { expect } from 'chai';
import { describe, it } from 'mocha';

import { isReferencedFont } from '../../../src/editor/inspector/assets/font-mode';

describe('isReferencedFont', () => {
    const asset = (value: unknown) =>
        ({
            get: (path: string) => (path === 'data.jsonAsset' ? value : undefined)
        }) as any;

    it('is false for a legacy font with an explicit null', () => {
        expect(isReferencedFont(asset(null))).to.equal(false);
    });

    it('is false for a legacy font with the key absent', () => {
        expect(isReferencedFont(asset(undefined))).to.equal(false);
    });

    it('is true for a referenced font', () => {
        expect(isReferencedFont(asset(1234))).to.equal(true);
    });
});
