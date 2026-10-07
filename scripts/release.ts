import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const STABLE_TAG = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const BETA = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.0-beta\.(0|[1-9]\d*)$/;
const ENGINE = /^2\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const BACKPORT_LABEL = 'release: next patch';

export type Backport = { number: number; title: string; sha: string };

export type Options = { type: string; bumpEngine: boolean; dryRun: boolean };

export type Deps = {
    engine: () => string;
    setEngine: (cwd: string, version: string) => void;
    backports: (since: string) => Backport[];
};

const compare = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

/**
 * Latest stable Engine 2.x from a list of published versions.
 */
export const latestEngine = (versions: string[]) => {
    const latest = versions.filter((v) => ENGINE.test(v)).sort((a, b) => compare(b, a))[0];
    if (!latest) {
        throw new Error('No stable Engine 2.x version found');
    }
    return latest;
};

/**
 * Cut an Editor release and publish every ref change in one atomic push.
 *
 * - minor: branch release-X.Y from main at X.Y.0, tag vX.Y.0, move main to X.(Y+1).0-beta.0
 * - patch: backport labeled main PRs onto the latest release branch, tag the next patch
 * - bumpEngine: pin the latest stable Engine first (and on main for patches)
 *
 * Returns the latest stable tag; `released` is false when there was nothing to release.
 */
export const release = (cwd: string, { type, bumpEngine, dryRun }: Options, deps: Deps) => {
    if (type !== 'minor' && type !== 'patch') {
        throw new Error(`Release type must be minor or patch, got "${type}"`);
    }
    const git = (...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: 'pipe' }).trim();
    const ok = (...args: string[]) => spawnSync('git', args, { cwd, stdio: 'pipe' }).status === 0;
    const pkg = (ref: string) => JSON.parse(git('show', `${ref}:package.json`));
    const commit = (ref: string, message: string, edit: () => void) => {
        git('checkout', '-q', '--detach', ref);
        edit();
        git('add', 'package.json', 'package-lock.json');
        git('commit', '-q', '-m', message);
        return git('rev-parse', 'HEAD');
    };
    const bump = (ref: string, version: string) =>
        commit(ref, `chore: bump version to ${version}`, () => {
            execFileSync('npm', ['version', version, '--no-git-tag-version', '--ignore-scripts'], {
                cwd,
                stdio: 'pipe'
            });
        });
    const engine = bumpEngine ? deps.engine() : '';

    // pin the selected Engine on ref unless it already has it (or something newer)
    const withEngine = (ref: string) => {
        if (!engine || compare(engine, pkg(ref).devDependencies.playcanvas) <= 0) {
            return ref;
        }
        return commit(ref, `chore: bump engine to ${engine}`, () => deps.setEngine(cwd, engine));
    };

    git('fetch', '-q', '--force', '--tags', 'origin', '+refs/heads/*:refs/remotes/origin/*');
    const main = git('rev-parse', 'refs/remotes/origin/main');
    const latest = git('tag', '--list', 'v*')
        .split('\n')
        .filter((t) => STABLE_TAG.test(t))
        .sort((a, b) => compare(b, a))[0];
    const updates: { sha: string; ref: string; lease: string }[] = [];
    let version: string;
    let head: string;

    if (type === 'minor') {
        const current = pkg(main).version;
        const match = BETA.exec(current);
        if (!match) {
            throw new Error(`Minor releases need main at X.Y.0-beta.N, found ${current}`);
        }
        const [, major, minor] = match;
        const base = withEngine(main);

        // main still sits on the beta bump from the last minor: nothing new to release
        if (base === main && git('log', '-1', '--format=%s', main) === `chore: bump version to ${current}`) {
            return { tag: latest, released: false };
        }
        version = `${major}.${minor}.0`;
        const branch = `release-${major}.${minor}`;
        if (ok('rev-parse', '--verify', '-q', `refs/remotes/origin/${branch}`)) {
            throw new Error(`${branch} already exists; inspect it before releasing ${version}`);
        }
        head = bump(base, version);
        updates.push(
            { sha: bump(base, `${major}.${Number(minor) + 1}.0-beta.0`), ref: 'refs/heads/main', lease: main },
            { sha: head, ref: `refs/heads/${branch}`, lease: '' }
        );
    } else {
        if (!latest) {
            throw new Error('No stable release tag to patch');
        }
        const [, major, minor, patch] = STABLE_TAG.exec(latest)!;
        const branch = `release-${major}.${minor}`;
        const base = git('rev-parse', `refs/remotes/origin/${branch}`);
        if (pkg(base).version !== latest.slice(1)) {
            throw new Error(`${branch} is at ${pkg(base).version}, expected ${latest.slice(1)}`);
        }
        head = base;

        // backport labeled fixes missing from the branch, oldest first
        const since = git('log', '-1', '--format=%cI', git('merge-base', main, base));
        for (const { number, sha } of deps.backports(since)) {
            if (!ok('merge-base', '--is-ancestor', sha, main)) {
                console.log(`Skipping #${number}: ${sha} is not on main`);
                continue;
            }
            if (ok('merge-base', '--is-ancestor', sha, head) || git('cherry', head, sha, `${sha}^`).startsWith('-')) {
                continue;
            }
            git('checkout', '-q', '--detach', head);
            if (!ok('cherry-pick', '-x', sha)) {
                git('cherry-pick', '--abort');
                throw new Error(
                    `Backport of #${number} conflicts on ${branch}; backport it by hand or remove its "${BACKPORT_LABEL}" label`
                );
            }
            head = git('rev-parse', 'HEAD');
            console.log(`Backported #${number}`);
        }
        head = withEngine(head);
        if (!git('rev-list', '-1', `${latest}..${head}`)) {
            return { tag: latest, released: false };
        }
        version = `${major}.${minor}.${Number(patch) + 1}`;
        head = bump(head, version);
        updates.push({ sha: head, ref: `refs/heads/${branch}`, lease: base });

        // keep main on at least the Engine the release branch ships
        const next = withEngine(main);
        if (next !== main) {
            updates.push({ sha: next, ref: 'refs/heads/main', lease: main });
        }
    }

    const tag = `v${version}`;
    if (ok('rev-parse', '--verify', '-q', `refs/tags/${tag}`)) {
        throw new Error(`Tag ${tag} already exists`);
    }
    git('tag', '-a', tag, '-m', tag, head);
    const args = [
        'push',
        '--atomic',
        ...updates.map(({ ref, lease }) => `--force-with-lease=${ref}:${lease}`),
        `--force-with-lease=refs/tags/${tag}:`,
        'origin',
        ...updates.map(({ sha, ref }) => `${sha}:${ref}`),
        `refs/tags/${tag}:refs/tags/${tag}`
    ];
    if (dryRun) {
        console.log(`Dry run, not pushing: git ${args.join(' ')}`);
    } else {
        git(...args);
    }
    return { tag, released: !dryRun };
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const { TYPE = 'patch', BUMP_ENGINE, DRY_RUN, GITHUB_REPOSITORY, GITHUB_STEP_SUMMARY } = process.env;
    const run = (cmd: string, args: string[], cwd = process.cwd()) =>
        execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
    const result = release(
        process.cwd(),
        { type: TYPE, bumpEngine: BUMP_ENGINE === 'true', dryRun: DRY_RUN === 'true' },
        {
            engine: () => latestEngine(JSON.parse(run('npm', ['view', 'playcanvas', 'versions', '--json']))),
            setEngine: (cwd, version) => {
                run(
                    'npm',
                    [
                        'install',
                        `playcanvas@${version}`,
                        '--save-dev',
                        '--save-exact',
                        '--package-lock-only',
                        '--ignore-scripts'
                    ],
                    cwd
                );
            },
            backports: (since) => {
                const prs = JSON.parse(
                    run('gh', [
                        'pr',
                        'list',
                        '--repo',
                        GITHUB_REPOSITORY ?? 'playcanvas/editor',
                        '--base',
                        'main',
                        '--state',
                        'merged',
                        '--label',
                        BACKPORT_LABEL,
                        '--search',
                        `merged:>=${since}`,
                        '--limit',
                        '500',
                        '--json',
                        'number,title,mergedAt,mergeCommit'
                    ])
                ) as { number: number; title: string; mergedAt: string; mergeCommit: { oid: string } }[];
                return prs
                    .sort((a, b) => a.mergedAt.localeCompare(b.mergedAt))
                    .map(({ number, title, mergeCommit }) => ({ number, title, sha: mergeCommit.oid }));
            }
        }
    );
    const summary = result.released ? `Released ${result.tag}` : `Nothing to release; latest is ${result.tag}`;
    console.log(summary);
    if (GITHUB_STEP_SUMMARY) {
        appendFileSync(GITHUB_STEP_SUMMARY, `${summary}\n`);
    }
}
