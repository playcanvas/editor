import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PATCH_TAG = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.([1-9]\d*)$/;
const PICKED = /^\(cherry picked from commit ([0-9a-f]{40})\)$/m;

export type Pull = { title: string; author: string; url: string };

/**
 * "What's Changed" for a patch tag, listing the main PRs its backports were picked from.
 *
 * GitHub's generated notes can't link cherry-picked commits to their PRs, so they list
 * nothing for a patch. Empty for minors, whose generated notes are already complete.
 */
export const notes = (cwd: string, tag: string, pull: (sha: string) => Pull | undefined) => {
    const match = PATCH_TAG.exec(tag);
    if (!match) {
        return '';
    }
    const [, major, minor, patch] = match;
    const range = `v${major}.${minor}.${Number(patch) - 1}..${tag}`;
    const lines = execFileSync('git', ['log', '-z', '--reverse', '--format=%B', range], { cwd, encoding: 'utf8' })
        .split('\0')
        .flatMap((body) => {
            const sha = PICKED.exec(body)?.[1];
            const pr = sha && pull(sha);
            return pr ? [`* ${pr.title} by @${pr.author} in ${pr.url}`] : [];
        });
    return lines.length ? ["## What's Changed", ...lines, ''].join('\n') : '';
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const { TAG = process.argv[2], GITHUB_REPOSITORY = 'playcanvas/editor' } = process.env;
    if (!TAG) {
        throw new Error('Usage: node scripts/release-notes.ts <tag>');
    }
    process.stdout.write(
        notes(process.cwd(), TAG, (sha) => {
            const pulls = JSON.parse(
                execFileSync('gh', ['api', `repos/${GITHUB_REPOSITORY}/commits/${sha}/pulls`], { encoding: 'utf8' })
            ) as { title: string; html_url: string; merged_at: string | null; user: { login: string } }[];
            const pr = pulls.find((p) => p.merged_at);
            return pr && { title: pr.title, author: pr.user.login, url: pr.html_url };
        })
    );
}
