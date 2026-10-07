import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';

import { release } from '../../scripts/release';
import type { Backport } from '../../scripts/release';

const sh = (cwd: string, ...args: string[]) =>
    execFileSync('git', args, { cwd, encoding: 'utf8', stdio: 'pipe' }).trim();

describe('release', function () {
    this.timeout(30000);

    let root: string;
    let remote: string;
    let dev: string;
    let ci: string;
    let picks: Backport[];

    const run = (type: string) =>
        release(
            ci,
            { type, bumpEngine: false },
            { engine: () => '', setEngine: () => undefined, backports: () => picks }
        );
    const show = (ref: string) => JSON.parse(sh(remote, 'show', `${ref}:package.json`));
    const refs = () => sh(remote, 'for-each-ref', '--format=%(refname) %(objectname)');

    // land a change on a remote branch the way a merged PR would, returning its commit
    const land = (branch: string, file: string, text: string) => {
        sh(dev, 'fetch', '-q', 'origin');
        sh(dev, 'checkout', '-q', '-B', branch, `origin/${branch}`);
        writeFileSync(join(dev, file), text);
        sh(dev, 'add', file);
        sh(dev, 'commit', '-q', '-m', `fix: ${file}`);
        sh(dev, 'push', '-q', 'origin', branch);
        return sh(dev, 'rev-parse', 'HEAD');
    };

    beforeEach(() => {
        root = mkdtempSync(join(tmpdir(), 'editor-release-'));
        remote = join(root, 'remote.git');
        dev = join(root, 'dev');
        ci = join(root, 'ci');
        picks = [];
        execFileSync('git', ['init', '-q', '--bare', '-b', 'main', remote]);
        for (const dir of [dev, ci]) {
            execFileSync('git', ['clone', '-q', remote, dir], { stdio: 'pipe' });
            sh(dir, 'config', 'user.name', 'test');
            sh(dir, 'config', 'user.email', 'test@example.com');
        }
        const pkg = { name: 'editor', version: '2.34.0-beta.0', devDependencies: { playcanvas: '2.23.1' } };
        writeFileSync(join(dev, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);
        writeFileSync(
            join(dev, 'package-lock.json'),
            `${JSON.stringify({ name: 'editor', version: pkg.version, lockfileVersion: 3, requires: true, packages: { '': pkg } }, null, 2)}\n`
        );
        sh(dev, 'add', '.');
        sh(dev, 'commit', '-q', '-m', 'chore: bump version to 2.34.0-beta.0');
        sh(dev, 'push', '-q', 'origin', 'main');
        land('main', 'a.txt', 'a');
    });

    afterEach(() => rmSync(root, { recursive: true, force: true }));

    it('cuts a minor from main and moves main to the next beta', () => {
        expect(run('minor')).to.deep.equal({ tag: 'v2.34.0', released: true });
        expect(show('release-2.34').version).to.equal('2.34.0');
        expect(sh(remote, 'rev-parse', 'v2.34.0^{commit}')).to.equal(sh(remote, 'rev-parse', 'release-2.34'));
        expect(show('main').version).to.equal('2.35.0-beta.0');
    });

    it('backports labeled fixes and tags the next patch', () => {
        run('minor');
        picks = [{ number: 7, title: 'fix: b', sha: land('main', 'b.txt', 'b') }];
        expect(run('patch')).to.deep.equal({ tag: 'v2.34.1', released: true });
        expect(show('v2.34.1').version).to.equal('2.34.1');
        expect(sh(remote, 'show', 'release-2.34:b.txt')).to.equal('b');
    });

    it('stops on a conflicting backport without pushing', () => {
        run('minor');
        picks = [{ number: 8, title: 'fix: a', sha: land('main', 'a.txt', 'main') }];
        land('release-2.34', 'a.txt', 'branch');
        const before = refs();
        expect(() => run('patch')).to.throw(/Backport of #8 conflicts on release-2.34/);
        expect(refs()).to.equal(before);
    });

    it('does nothing when there is nothing to release', () => {
        run('minor');
        const before = refs();
        expect(run('patch')).to.deep.equal({ tag: 'v2.34.0', released: false });
        expect(refs()).to.equal(before);
    });
});
