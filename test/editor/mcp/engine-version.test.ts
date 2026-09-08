import { expect } from 'chai';
import { describe, it } from 'mocha';

import { defaultEngineVersion, engineChannels, resolveEngineVersion } from '../../../src/editor/mcp/engine-version';

const VERSIONS = {
    current: { version: '2.10.0' },
    force: { version: '2.9.0' },
    previous: { version: '2.8.0' },
    releaseCandidate: { version: '2.11.0-rc.1' }
};

describe('engineChannels', () => {
    it('lists the channels that have a version, current first', () => {
        expect(engineChannels(VERSIONS)).to.deep.equal([
            { channel: 'current', version: '2.10.0' },
            { channel: 'previous', version: '2.8.0' },
            { channel: 'releaseCandidate', version: '2.11.0-rc.1' }
        ]);
    });

    it('skips missing channels', () => {
        expect(engineChannels({ current: { version: '2.10.0' } })).to.deep.equal([
            { channel: 'current', version: '2.10.0' }
        ]);
    });
});

describe('defaultEngineVersion', () => {
    it('uses current when nothing is selected', () => {
        expect(defaultEngineVersion(VERSIONS)).to.deep.equal({
            channel: 'current',
            version: '2.10.0',
            source: 'current'
        });
    });

    it('uses the release candidate when the launch option is ticked', () => {
        expect(defaultEngineVersion(VERSIONS, { releaseCandidate: true })).to.deep.equal({
            channel: 'releaseCandidate',
            version: '2.11.0-rc.1',
            source: 'launch-option'
        });
    });

    it('ignores the launch option when there is no release candidate', () => {
        const versions = { current: { version: '2.10.0' } };
        expect(defaultEngineVersion(versions, { releaseCandidate: true }).source).to.equal('current');
    });

    it('uses the session setting', () => {
        expect(defaultEngineVersion(VERSIONS, { sessionKey: 'previous' })).to.deep.equal({
            channel: 'previous',
            version: '2.8.0',
            source: 'session-setting'
        });
    });

    it('prefers the launch option over the session setting', () => {
        expect(defaultEngineVersion(VERSIONS, { releaseCandidate: true, sessionKey: 'previous' }).channel).to.equal(
            'releaseCandidate'
        );
    });

    it('falls back to current for a session setting with no version', () => {
        expect(defaultEngineVersion(VERSIONS, { sessionKey: 'current' }).source).to.equal('current');
        expect(defaultEngineVersion({ current: { version: '2.10.0' } }, { sessionKey: 'previous' }).source).to.equal(
            'current'
        );
    });
});

describe('resolveEngineVersion', () => {
    it('falls back to the launch default', () => {
        expect(resolveEngineVersion(VERSIONS, { releaseCandidate: true })).to.deep.equal({
            channel: 'releaseCandidate',
            version: '2.11.0-rc.1',
            source: 'launch-option'
        });
    });

    it('accepts a channel key', () => {
        expect(resolveEngineVersion(VERSIONS, { requested: 'previous' })).to.deep.equal({
            channel: 'previous',
            version: '2.8.0',
            source: 'explicit'
        });
    });

    it('accepts an exact version', () => {
        expect(resolveEngineVersion(VERSIONS, { requested: '2.11.0-rc.1' })).to.deep.equal({
            channel: 'releaseCandidate',
            version: '2.11.0-rc.1',
            source: 'explicit'
        });
        expect(resolveEngineVersion(VERSIONS, { requested: '2.9.0' })).to.deep.equal({
            channel: 'force',
            version: '2.9.0',
            source: 'explicit'
        });
    });

    it('rejects an unknown version and lists the channels', () => {
        expect(resolveEngineVersion(VERSIONS, { requested: '1.0.0' })).to.deep.equal({
            error: 'Unknown engine version: 1.0.0. Available: current=2.10.0, previous=2.8.0, releaseCandidate=2.11.0-rc.1.'
        });
    });

    it('rejects a channel key that has no version', () => {
        expect(
            resolveEngineVersion({ current: { version: '2.10.0' } }, { requested: 'releaseCandidate' })
        ).to.deep.equal({ error: 'Unknown engine version: releaseCandidate. Available: current=2.10.0.' });
    });
});
