import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

import type { FullConfig, FullResult, Reporter, Suite } from '@playwright/test/reporter';

import { HOST, LAUNCH_HOST, LOCAL_FRONTEND } from './config';

const OUTPUT = 'test-results/release.json';

const fingerprint = (dir: string) => {
    if (!existsSync(resolve(dir, 'js/editor.js'))) return '';
    const hash = createHash('sha256');
    for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => resolve(entry.parentPath, entry.name)).sort()) {
        hash.update(relative(dir, entry));
        hash.update('\0');
        hash.update(createHash('sha256').update(new Uint8Array(readFileSync(entry))).digest('hex'));
    }
    return hash.digest('hex');
};

/** A release succeeds only when the complete selected artifact suite finishes without skips. */
export default class ReleaseReporter implements Reporter {
    private suite?: Suite;

    private reasons: string[] = [];

    private candidate = '';

    private revision = '';

    private dist = '';

    onBegin(config: FullConfig, suite: Suite) {
        this.suite = suite;
        const frontend = resolve(process.env.PC_FRONTEND_DIR ?? '..');
        this.dist = resolve(frontend, 'dist');
        this.candidate = fingerprint(this.dist);
        if (!LOCAL_FRONTEND || !this.candidate) {
            this.reasons.push('release verification requires the candidate dist via PC_LOCAL_FRONTEND=true');
        }
        this.revision = process.env.GITHUB_SHA ?? execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
        if (config.shard || config.grepInvert || String(config.grep) !== '/.*/') {
            this.reasons.push('release verification cannot be filtered or sharded');
        }
        if (process.argv.some(arg => /^--(?:last-failed|test-list|test-list-invert|only-changed)(?:=|$)/.test(arg) || /\.test\.ts:\d/.test(arg))) {
            this.reasons.push('release verification cannot select individual tests');
        }
        const expected = readdirSync('test', { recursive: true }).filter(path => /(?:\.test\.ts|auth\.setup\.ts)$/.test(String(path)));
        const files = new Set(suite.allTests().map(test => relative(resolve('test'), test.location.file)));
        for (const file of expected) {
            if (!files.has(String(file))) this.reasons.push(`missing spec: ${file}`);
        }
    }

    onEnd(result: FullResult) {
        const tests = this.suite?.allTests() ?? [];
        if (this.candidate && fingerprint(this.dist) !== this.candidate) this.reasons.push('candidate dist changed during verification');
        if (result.status !== 'passed') this.reasons.push(`run status: ${result.status}`);
        if (!tests.length) this.reasons.push('no tests executed');
        for (const test of tests) {
            if (test.outcome() !== 'expected' || test.results.length !== 1 || test.results[0].status !== 'passed') {
                this.reasons.push(`${test.titlePath().join(' > ')}: ${test.outcome()}`);
            }
        }
        const passed = result.status === 'passed' && !this.reasons.length;
        mkdirSync('test-results', { recursive: true });
        writeFileSync(OUTPUT, `${JSON.stringify({
            passed,
            suiteRevision: this.revision,
            candidate: this.candidate,
            host: HOST,
            launch: LAUNCH_HOST,
            tests: tests.length,
            reasons: this.reasons
        }, null, 2)}\n`);
        if (!passed) process.stderr.write(`Release blocked:\n${this.reasons.join('\n')}\n`);
        return Promise.resolve({ status: passed ? 'passed' as const : 'failed' as const });
    }
}
