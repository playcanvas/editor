import { expect } from 'chai';
import { describe, it } from 'mocha';

import { remapAnimStateAssets } from '../../../src/editor/animstategraph/data';
import { modifyAnimationEvents } from '../../../src/editor/animstategraph/events-data';

describe('modifyAnimationEvents', () => {
    it('accepts normalized event times from 0 to 1', () => {
        const result = modifyAnimationEvents({}, [
            { kind: 'event.add', name: 'start', time: 0 },
            { kind: 'event.add', name: 'end', time: 1 }
        ]);

        expect(result.events[0].time).to.equal(0);
        expect(result.events[1].time).to.equal(1);
        expect(() => modifyAnimationEvents({}, [{ kind: 'event.add', name: 'late', time: 1.01 }])).to.throw(
            'Event time must be between 0 and 1.'
        );
    });
});

describe('remapAnimStateAssets', () => {
    it('remaps chained keys without overwriting source values', () => {
        expect(
            remapAnimStateAssets(
                {
                    'Layer:A': { asset: 1 },
                    'Layer:B': { asset: 2 }
                },
                [
                    { key: 'Layer:A', next: 'Layer:B', drop: true },
                    { key: 'Layer:B', next: 'Layer:C', drop: false }
                ]
            )
        ).to.deep.equal({
            'Layer:B': { asset: 1 },
            'Layer:C': { asset: 2 }
        });
    });

    it('remaps swapped keys without losing values', () => {
        expect(
            remapAnimStateAssets(
                {
                    'Layer:A': { asset: 1 },
                    'Layer:B': { asset: 2 }
                },
                [
                    { key: 'Layer:A', next: 'Layer:B', drop: true },
                    { key: 'Layer:B', next: 'Layer:A', drop: false }
                ]
            )
        ).to.deep.equal({
            'Layer:A': { asset: 2 },
            'Layer:B': { asset: 1 }
        });
    });
});
