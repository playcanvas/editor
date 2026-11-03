import { expect } from 'chai';
import { describe, it } from 'mocha';

import { createScriptSources } from '../../../src/editor/assets/esm-script-sources';

// an esm script asset when named `.mjs`, anything else is a classic script
const asset = (name: string, hash = 'h1') => ({
    name,
    get: (path: string) => (path === 'file.hash' ? hash : undefined)
});

const label = (a: unknown) => (a as ReturnType<typeof asset>).name;

const setup = (initial: ReturnType<typeof asset>[]) => {
    const state = { assets: initial, fetched: [] as string[], failing: new Set<string>() };
    const sources = createScriptSources({
        list: () => state.assets,
        isModule: (a) => label(a).endsWith('.mjs'),
        virtualPath: (a) => `/${label(a)}`,
        realPath: (a) => `files/${label(a)}`,
        fetchText: async (url) => {
            state.fetched.push(url);
            if (state.failing.has(url)) {
                throw new Error('network');
            }
            return `// ${url}`;
        }
    });
    return { state, sources };
};

describe('createScriptSources', () => {
    const names = (count: number) => Array.from({ length: count }, (_, i) => `s${i}.mjs`);

    it('fetches each module once when many parses ask at the same time', async () => {
        const { state, sources } = setup(names(50).map((n) => asset(n)));

        const results = await Promise.all(Array.from({ length: 50 }, () => sources()));

        expect(state.fetched).to.have.lengthOf(50);
        expect(new Set(state.fetched).size).to.equal(50);
        expect(results[0][0]).to.have.lengthOf(50);
        results.slice(1).forEach(([files]) => expect(files).to.deep.equal([]));
    });

    it('returns each module as a [path, content] pair, skipping classic scripts', async () => {
        const { sources } = setup([asset('a.mjs'), asset('b.js')]);

        const [files, deleted] = await sources();

        expect(files).to.deep.equal([['/a.mjs', '// files/a.mjs']]);
        expect(deleted).to.deep.equal([]);
    });

    it('skips the paths it is asked to filter out', async () => {
        const { state, sources } = setup([asset('a.mjs'), asset('b.mjs')]);

        const [files] = await sources(['/a.mjs']);

        expect(files.map(([path]) => path)).to.deep.equal(['/b.mjs']);
        expect(state.fetched).to.deep.equal(['files/b.mjs']);
    });

    it('refetches only the module whose hash changed', async () => {
        const { state, sources } = setup([asset('a.mjs'), asset('b.mjs')]);
        await sources();

        state.assets = [asset('a.mjs'), asset('b.mjs', 'h2')];
        state.fetched.length = 0;
        const [files] = await sources();

        expect(files.map(([path]) => path)).to.deep.equal(['/b.mjs']);
        expect(state.fetched).to.deep.equal(['files/b.mjs']);
    });

    it('reports modules that are no longer assets as deleted', async () => {
        const { state, sources } = setup([asset('a.mjs'), asset('b.mjs')]);
        await sources();

        state.assets = [asset('a.mjs')];
        const [files, deleted] = await sources();

        expect(files).to.deep.equal([]);
        expect(deleted).to.deep.equal(['/b.mjs']);
        expect((await sources())[1]).to.deep.equal([]);
    });

    it('retries a module whose fetch failed', async () => {
        const { state, sources } = setup([asset('a.mjs')]);
        const error = console.error;
        console.error = () => undefined;

        state.failing.add('files/a.mjs');
        const [failed] = await sources();
        state.failing.clear();
        const [retried] = await sources();
        console.error = error;

        expect(failed).to.deep.equal([]);
        expect(retried).to.deep.equal([['/a.mjs', '// files/a.mjs']]);
    });

    it('keeps serving later calls after a lookup throws', async () => {
        const { state, sources } = setup([asset('a.mjs')]);
        const list = state.assets;

        state.assets = null;
        const failed = await sources().then(
            () => null,
            (e) => e
        );
        state.assets = list;
        const [files] = await sources();

        expect(failed).to.be.instanceOf(Error);
        expect(files).to.have.lengthOf(1);
    });
});
