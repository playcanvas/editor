import { expect } from 'chai';
import { describe, it } from 'mocha';

import { artifactName, findBuild, pickArtifact } from '../../../src/editor/driver/artifact';

const service = (items: any[]) => ({
    calls: [] as number[],
    projectBuilds(limit: number, offset: number) {
        this.calls.push(offset);
        return {
            promisify: async () => ({
                result: items.slice(offset, offset + limit),
                pagination: { total: items.length }
            })
        };
    }
});

describe('findBuild', () => {
    it('finds a build by numeric or string id', async () => {
        const builds = service([{ id: 1 }, { id: 2 }]);
        expect(await findBuild(builds, '2')).to.deep.equal({ id: 2 });
    });

    it('pages until the build is found', async () => {
        const builds = service(Array.from({ length: 501 }, (_, i) => ({ id: i + 1 })));
        expect(await findBuild(builds, 501)).to.deep.equal({ id: 501 });
        expect(builds.calls).to.deep.equal([0, 500]);
    });

    it('returns undefined for an unknown build', async () => {
        const builds = service([{ id: 1 }]);
        expect(await findBuild(builds, 9)).to.equal(undefined);
        expect(await findBuild(service([]), 9)).to.equal(undefined);
    });
});

describe('pickArtifact', () => {
    const done = { id: 3, status: 'complete' };

    it('prefers the download artifact', () => {
        const artifacts = [
            { type: 'other', url: '/a' },
            { type: 'download', url: '/b' }
        ];
        expect(pickArtifact({ ...done, artifacts }).url).to.equal('/b');
    });

    it('falls back to the first artifact', () => {
        expect(pickArtifact({ ...done, artifacts: [{ type: 'other', url: '/a' }] }).url).to.equal('/a');
    });

    it('rejects an incomplete build', () => {
        expect(() => pickArtifact({ id: 3, status: 'running', artifacts: [] })).to.throw('not complete');
    });

    it('rejects a build without an artifact url', () => {
        expect(() => pickArtifact(done)).to.throw('no downloadable artifact');
        expect(() => pickArtifact({ ...done, artifacts: [{ type: 'download' }] })).to.throw('no downloadable artifact');
    });
});

describe('artifactName', () => {
    it('decodes the last path segment', () => {
        expect(artifactName('/api/downloads/7/my%20app.zip')).to.equal('my app.zip');
    });

    it('ignores the query and hash', () => {
        expect(artifactName('/x/app.zip?token=1#y')).to.equal('app.zip');
    });

    it('falls back to a default', () => {
        expect(artifactName('/x/')).to.equal('download.zip');
    });
});
