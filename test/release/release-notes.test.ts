import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';

import { notes } from '../../scripts/release-notes';

const sh = (cwd: string, ...args: string[]) =>
    execFileSync('git', args, { cwd, encoding: 'utf8', stdio: 'pipe' }).trim();

describe('release notes', function () {
    this.timeout(30000);

    let dir: string;

    // only fix: b (main~1) was merged through a PR
    const pull = (sha: string) =>
        sha === sh(dir, 'rev-parse', 'main~1')
            ? { title: 'fix: b', author: 'dev', url: 'https://github.com/playcanvas/editor/pull/7' }
            : undefined;

    const commit = (file: string, message: string) => {
        writeFileSync(join(dir, file), message);
        sh(dir, 'add', file);
        sh(dir, 'commit', '-q', '-m', message);
    };

    beforeEach(() => {
        dir = mkdtempSync(join(tmpdir(), 'editor-release-notes-'));
        sh(dir, 'init', '-q', '-b', 'main');
        sh(dir, 'config', 'user.name', 'test');
        sh(dir, 'config', 'user.email', 'test@example.com');
        commit('a.txt', 'chore: bump version to 2.34.0');
        sh(dir, 'tag', 'v2.34.0');
        sh(dir, 'checkout', '-q', '-b', 'release-2.34');
        sh(dir, 'checkout', '-q', 'main');
        commit('b.txt', 'fix: b (#7)');
        commit('c.txt', 'fix: c (#8)');
        sh(dir, 'checkout', '-q', 'release-2.34');
        sh(dir, 'cherry-pick', '-x', 'main~1');
        commit('d.txt', 'chore: bump version to 2.34.1');
        sh(dir, 'tag', 'v2.34.1');
    });

    afterEach(() => rmSync(dir, { recursive: true, force: true }));

    it("lists the PRs a patch's backports were picked from", () => {
        expect(notes(dir, 'v2.34.1', pull)).to.equal(
            "## What's Changed\n* fix: b by @dev in https://github.com/playcanvas/editor/pull/7\n"
        );
    });

    it('leaves minors to the generated notes', () => {
        expect(notes(dir, 'v2.34.0', pull)).to.equal('');
    });

    it('is empty when no backport maps to a PR', () => {
        expect(notes(dir, 'v2.34.1', () => undefined)).to.equal('');
    });
});
