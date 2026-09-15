import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

import { expect } from 'chai';
import { describe, it } from 'mocha';
import { spy } from 'sinon';
import { ModuleKind, transpileModule } from 'typescript';

import { redactText, sanitize } from '../../src/common/redact';

const SOURCE = transpileModule(readFileSync('src/common/sentry.ts', 'utf8'), {
    compilerOptions: { module: ModuleKind.CommonJS }
}).outputText;

const setup = (protocol = 'https:') => {
    let options;
    const increment = spy();
    const sdk = {
        BrowserClient: class {
            constructor(config) {
                options = config;
            }

            init = spy();
        },
        Scope: class {
            setClient = spy();

            setTag = spy();
        },
        getDefaultIntegrations: () => [],
        getIntegrationsToSetup: () => []
    };
    runInNewContext(SOURCE, {
        exports: {},
        require: (name: string) => {
            if (name === './redact') return { redactText, sanitize };
            if (name.endsWith('package.json')) return { version: 'test' };
            return sdk;
        },
        config: { sentry: { enabled: true, send: false, page: 'editor', service: 'editor' } },
        window: { metrics: true },
        location: { protocol },
        metrics: { increment },
        Error
    });
    return { send: options.beforeSend, increment };
};

describe('Sentry event filtering', () => {
    it('drops file pages before counting an Editor error', () => {
        const { send, increment } = setup('file:');
        expect(send({ message: 'worker failed' }, {})).to.equal(null);
        expect(increment.called).to.equal(false);
    });

    for (const protocol of ['https:', 'http:']) {
        it(`keeps ${protocol} page errors even with local stack references`, () => {
            const { send, increment } = setup(protocol);
            const event = { exception: { values: [{ stacktrace: { frames: [{ filename: 'file:///tool.js' }] } }] } };
            expect(send(event, {})).to.deep.equal(event);
            expect(increment.calledOnce).to.equal(true);
        });
    }

    it('preserves redaction and the existing user-script filter', () => {
        const { send } = setup();
        expect(send({ message: 'token=private', extra: { password: 'private' } }, {})).to.deep.equal({
            message: 'token=<redacted>',
            extra: { password: '********' }
        });
        expect(
            send({ exception: { values: [{ stacktrace: { frames: [{ filename: '/api/assets/123/file.js' }] } }] } }, {})
        ).to.equal(null);
    });

    for (const [frame, caller] of [
        [{ filename: 'chrome-extension://example/userscript.html' }, 'extension'],
        [{ filename: 'moz-extension://example/script.js' }, 'extension'],
        [{ filename: 'pptr:evaluate;tool' }, 'automation'],
        [{ filename: '<anonymous>', function: 'UtilityScript.evaluate' }, 'automation']
    ] as const) {
        it(`retains and tags an ${caller} caller`, () => {
            const { send } = setup();
            const result = send(
                {
                    tags: { source: 'editor/assets' },
                    exception: {
                        values: [{ stacktrace: { frames: [frame, { filename: '/editor/scene/js/editor.js' }] } }]
                    }
                },
                {}
            );
            expect(result.tags).to.deep.equal({ source: 'editor/assets', external_caller: caller });
        });
    }
});
