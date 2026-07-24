import { expect } from 'chai';
import { describe, it } from 'mocha';

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
