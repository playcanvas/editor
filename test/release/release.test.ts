import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';

import { latestEngine, release } from '../../scripts/release';
import type { Backport, Deps } from '../../scripts/release';

const sh = (cwd: string, ...args: string[]) =>
    execFileSync('git', args, { cwd, encoding: 'utf8', stdio: 'pipe' }).trim();

const writePkg = (cwd: string, edit: (pkg: { devDependencies: Record<string, string> }) => void) => {
    for (const file of ['package.json', 'package-lock.json']) {
        const json = JSON.parse(readFileSync(join(cwd, file), 'utf8'));
        edit(file === 'package.json' ? json : json.packages['']);
        if (file === 'package-lock.json') {
            json.version = json.packages[''].version;
        }
        writeFileSync(join(cwd, file), `${JSON.stringify(json, null, 2)}\n`);
    }
};

describe('release', function () {
    this.timeout(30000);

    let root: string;
    let remote: string;
    let dev: string;
    let ci: string;
    let picks: Backport[];

    const deps: Deps = {
        engine: () => '2.24.0',
        setEngine: (cwd, version) =>
            writePkg(cwd, (pkg) => {
                pkg.devDependencies.playcanvas = version;
            }),
        backports: () => picks
    };
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

    const minor = () => release(ci, { type: 'minor', bumpEngine: false }, deps);

    it('cuts a minor from main and moves main to the next beta', () => {
        expect(minor()).to.deep.equal({ tag: 'v2.34.0', released: true });
        expect(show('release-2.34').version).to.equal('2.34.0');
        expect(show('v2.34.0').version).to.equal('2.34.0');
        expect(show('main').version).to.equal('2.35.0-beta.0');
        expect(sh(remote, 'rev-parse', 'v2.34.0^{commit}')).to.equal(sh(remote, 'rev-parse', 'release-2.34'));
    });

    it('pins the latest Engine on both branches when cutting a minor', () => {
        release(ci, { type: 'minor', bumpEngine: true }, deps);
        expect(show('release-2.34').devDependencies.playcanvas).to.equal('2.24.0');
        expect(show('main').devDependencies.playcanvas).to.equal('2.24.0');
    });

    it('does nothing when main has no changes since the last minor', () => {
        minor();
        const before = refs();
        expect(minor()).to.deep.equal({ tag: 'v2.34.0', released: false });
        expect(refs()).to.equal(before);
    });

    it('backports labeled fixes and tags the next patch', () => {
        minor();
        const sha = land('main', 'b.txt', 'b');
        picks = [{ number: 7, title: 'fix: b', sha }];
        expect(release(ci, { type: 'patch', bumpEngine: false }, deps)).to.deep.equal({
            tag: 'v2.34.1',
            released: true
        });
        expect(show('release-2.34').version).to.equal('2.34.1');
        expect(sh(remote, 'show', 'release-2.34:b.txt')).to.equal('b');
        expect(show('main').version).to.equal('2.35.0-beta.0');
    });

    it('skips fixes already on the release branch', () => {
        minor();
        const sha = land('main', 'b.txt', 'b');
        land('release-2.34', 'b.txt', 'b');
        picks = [{ number: 7, title: 'fix: b', sha }];
        const result = release(ci, { type: 'patch', bumpEngine: false }, deps);
        expect(result.tag).to.equal('v2.34.1');
        expect(sh(remote, 'rev-list', '--count', 'v2.34.0..release-2.34')).to.equal('2');
    });

    it('stops on a conflicting backport without pushing', () => {
        minor();
        const sha = land('main', 'a.txt', 'main');
        land('release-2.34', 'a.txt', 'branch');
        picks = [{ number: 8, title: 'fix: a', sha }];
        const before = refs();
        expect(() => release(ci, { type: 'patch', bumpEngine: false }, deps)).to.throw(
            /Backport of #8 conflicts on release-2.34/
        );
        expect(refs()).to.equal(before);
    });

    it('does nothing when the release branch has no changes', () => {
        minor();
        const before = refs();
        expect(release(ci, { type: 'patch', bumpEngine: false }, deps)).to.deep.equal({
            tag: 'v2.34.0',
            released: false
        });
        expect(refs()).to.equal(before);
    });

    it('releases an Engine bump as a patch and keeps main in step', () => {
        minor();
        const result = release(ci, { type: 'patch', bumpEngine: true }, deps);
        expect(result).to.deep.equal({ tag: 'v2.34.1', released: true });
        expect(show('v2.34.1').devDependencies.playcanvas).to.equal('2.24.0');
        expect(show('main').devDependencies.playcanvas).to.equal('2.24.0');
    });
});

describe('latestEngine', () => {
    it('picks the newest stable 2.x', () => {
        expect(latestEngine(['1.99.0', '2.9.0', '2.10.1', '2.11.0-beta.1', '3.0.0'])).to.equal('2.10.1');
    });

    it('throws without a stable 2.x', () => {
        expect(() => latestEngine(['1.0.0', '2.1.0-beta.0'])).to.throw(/No stable Engine/);
    });
});
