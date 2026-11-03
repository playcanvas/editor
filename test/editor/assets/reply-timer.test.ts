import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { createReplyTimer } from '../../../src/editor/assets/reply-timer';

describe('createReplyTimer', () => {
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
        clock = sinon.useFakeTimers();
    });

    afterEach(() => {
        clock.restore();
    });

    it('fails a request that gets no reply in time', () => {
        const wait = createReplyTimer(1000);
        const fail = sinon.spy();
        wait(fail);

        clock.tick(999);
        expect(fail.called).to.equal(false);
        clock.tick(1);
        expect(fail.calledOnce).to.equal(true);
    });

    it('does not fail a request that was answered', () => {
        const wait = createReplyTimer(1000);
        const fail = sinon.spy();
        wait(fail)();

        clock.tick(5000);
        expect(fail.called).to.equal(false);
    });

    it('keeps waiting requests alive while other replies arrive', () => {
        const wait = createReplyTimer(1000);
        const slow = sinon.spy();
        wait(slow);

        // a reply every 600ms for 6s, so the slow request outlasts several timeouts
        for (let i = 0; i < 10; i++) {
            const done = wait(sinon.spy());
            clock.tick(600);
            done();
        }
        expect(slow.called).to.equal(false);

        clock.tick(1000);
        expect(slow.calledOnce).to.equal(true);
    });

    it('fails every pending request together once replies stop', () => {
        const wait = createReplyTimer(1000);
        const fails = [sinon.spy(), sinon.spy(), sinon.spy()];
        fails.forEach(wait);

        clock.tick(1000);
        fails.forEach((fail) => expect(fail.calledOnce).to.equal(true));
    });

    it('starts a new window for a request made after the others failed', () => {
        const wait = createReplyTimer(1000);
        wait(sinon.spy());
        clock.tick(1000);

        const fail = sinon.spy();
        wait(fail);
        clock.tick(999);
        expect(fail.called).to.equal(false);
        clock.tick(1);
        expect(fail.calledOnce).to.equal(true);
    });

    it('ignores a reply that arrives after its request failed', () => {
        const wait = createReplyTimer(1000);
        const done = wait(sinon.spy());
        clock.tick(1000);

        const fail = sinon.spy();
        wait(fail);
        done();
        clock.tick(1000);
        expect(fail.calledOnce).to.equal(true);
    });

    it('leaves no timer running once everything is answered', () => {
        const wait = createReplyTimer(1000);
        wait(sinon.spy())();
        wait(sinon.spy())();

        expect(clock.countTimers()).to.equal(0);
    });
});
