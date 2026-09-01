import { expect } from 'chai';
import { describe, it } from 'mocha';

import { SANDBOX_PERMISSIONS, buildSandboxCsp, buildSandboxSrcdoc } from '../../src/workers/classic-parse-sandbox';

describe('classic-parse-sandbox', () => {
    describe('SANDBOX_PERMISSIONS', () => {
        it('allows scripts so the parser can run', () => {
            expect(SANDBOX_PERMISSIONS.split(/\s+/)).to.include('allow-scripts');
        });

        it('withholds allow-same-origin so the sandbox gets an opaque origin', () => {
            expect(SANDBOX_PERMISSIONS).to.not.contain('allow-same-origin');
        });
    });

    describe('buildSandboxCsp', () => {
        const csp = buildSandboxCsp('n0nce');

        it('blocks all network egress from executed code', () => {
            expect(csp).to.contain("default-src 'none'");
            expect(csp).to.contain("connect-src 'none'");
        });

        it('permits blob-based script and worker execution so parsing still works', () => {
            expect(csp).to.match(/script-src[^;]*\bblob:/);
            expect(csp).to.match(/worker-src[^;]*\bblob:/);
        });

        it('nonces its own bootstrap instead of allowing arbitrary inline scripts', () => {
            expect(csp).to.match(/script-src[^;]*'nonce-n0nce'/);
            expect(csp).to.not.match(/script-src[^;]*'unsafe-inline'/);
        });

        it('never allows a network origin to load scripts (no importScripts exfil)', () => {
            expect(csp).to.not.match(/script-src[^;]*https?:/);
            expect(csp).to.not.match(/script-src[^;]*[^-]\*/);
        });
    });

    describe('buildSandboxSrcdoc', () => {
        const srcdoc = buildSandboxSrcdoc('n0nce');

        it('applies the CSP via a meta http-equiv tag', () => {
            expect(srcdoc).to.contain('http-equiv="Content-Security-Policy"');
            expect(srcdoc).to.contain(buildSandboxCsp('n0nce'));
        });

        it('runs the parser worker from a blob, never a remote URL', () => {
            expect(srcdoc).to.contain('createObjectURL');
            expect(srcdoc).to.not.match(/https?:\/\//);
        });
    });
});
