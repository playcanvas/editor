import vm from 'node:vm';

import { expect } from 'chai';
import { describe, it } from 'mocha';

import { concatenate, fetchScripts, selectScripts, vlq } from '../../src/launch/assets/concatenate-scripts';

const asset = (fields: Record<string, unknown>) => ({ get: (path: string) => fields[path] });

const script = (id: number, extra: Record<string, unknown> = {}) =>
    asset({ id, type: 'script', 'file.filename': `s${id}.js`, 'file.hash': `h${id}`, preload: true, ...extra });

const decodeMap = (code: string) => {
    const b64 = code.match(/sourceMappingURL=data:application\/json;charset=utf-8;base64,(\S+)/)[1];
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
};

describe('concatenate scripts', () => {
    describe('vlq', () => {
        it('encodes source map base64 vlq', () => {
            expect(vlq(0)).to.equal('A');
            expect(vlq(1)).to.equal('C');
            expect(vlq(-1)).to.equal('D');
            expect(vlq(15)).to.equal('e');
            expect(vlq(16)).to.equal('gB');
        });
    });

    describe('selectScripts', () => {
        it('keeps project script order and mirrors the server hash rule', () => {
            const all = {
                1: script(1),
                2: script(2, { preload: false }),
                3: script(3, { 'data.loadingType': 1 }),
                4: script(4, { 'data.loadingType': 2 }),
                5: script(5, { 'data.loadingType': 0 }),
                6: script(6, { 'file.filename': 's6.mjs' }),
                7: script(7, { 'file.hash': undefined }),
                8: asset({ id: 8, type: 'json', 'file.filename': 'x.js', 'file.hash': 'h' }),
                10: script(10, { 'file.filename': undefined })
            };
            const picked = selectScripts([5, 1, 2, 3, 4, 6, 7, 8, 9, 10], (id) => all[id]);
            expect(picked.map((a) => a.get('id'))).to.deep.equal([5, 1, 2, 8]);
        });

        it('joins a script listed twice only once', () => {
            const all = { 1: script(1) };
            expect(selectScripts([1, 1], (id) => all[id])).to.have.length(1);
        });
    });

    describe('concatenate', () => {
        const files = [
            { id: 1, url: 'https://l.test/api/assets/files/a.js?id=1', name: 'a.js', text: 'x\ny' },
            { id: 2, url: 'https://l.test/api/assets/files/b.js?id=2', name: 'b.js', text: 'z' }
        ];

        it('joins files with a filename header and an asi guard', () => {
            const { code } = concatenate(files);
            expect(code.split('//# sourceMappingURL=')[0]).to.equal('// a.js\nx\ny\n;\n// b.js\nz\n;\n');
        });

        it('writes a line-level inline source map', () => {
            const map = decodeMap(concatenate(files).code);
            expect(map.version).to.equal(3);
            expect(map.sources).to.deep.equal(files.map((f) => f.url));
            expect(map.sourcesContent).to.deep.equal(['x\ny', 'z']);
            expect(map.mappings).to.equal(';AAAA;AACA;;;ACDA;');
        });

        it('resolves concatenated lines back to the original file line', () => {
            const { resolve } = concatenate(files);
            expect(resolve(2)).to.deep.equal({ url: files[0].url, line: 1 });
            expect(resolve(3)).to.deep.equal({ url: files[0].url, line: 2 });
            expect(resolve(6)).to.deep.equal({ url: files[1].url, line: 1 });
            expect(resolve(1)).to.equal(null);
            expect(resolve(4)).to.equal(null);
            expect(resolve(99)).to.equal(null);
        });

        it('keeps files apart when one lacks a semicolon or ends in a line comment', () => {
            const { code } = concatenate([
                { id: 1, url: 'u1', name: 'a.js', text: 'var r = []; r.push(1)' },
                { id: 2, url: 'u2', name: 'b.js', text: '(function () { r.push(2) })() // done' },
                { id: 3, url: 'u3', name: 'c.js', text: 'r.push(3)' }
            ]);
            const ctx: { r?: number[] } = {};
            vm.runInNewContext(code, ctx);
            expect(ctx.r).to.deep.equal([1, 2, 3]);
        });

        it('encodes non latin-1 source text in the map', () => {
            const text = "const s = 'é 😀 漢字';";
            const map = decodeMap(concatenate([{ id: 1, url: 'u', name: 'a.js', text }]).code);
            expect(map.sourcesContent[0]).to.equal(text);
        });

        it('handles an empty file', () => {
            const { code, resolve } = concatenate([{ id: 1, url: 'u', name: 'a.js', text: '' }]);
            expect(code.startsWith('// a.js\n\n;\n')).to.equal(true);
            expect(resolve(2)).to.deep.equal({ url: 'u', line: 1 });
        });
    });

    describe('fetchScripts', () => {
        const res = (ok: boolean, text = '') => ({ ok, text: async () => text }) as Response;
        const scripts = [
            { id: 1, url: 'https://l.test/api/assets/files/a.js?id=1&branchId=b', name: 'a.js' },
            { id: 2, url: 'https://l.test/api/assets/files/Folder/b.js?id=2&branchId=b', name: 'b.js' }
        ];

        it('downloads each script from its own url, in order', async () => {
            const seen: string[] = [];
            const get = (async (u: string) => {
                seen.push(u);
                return res(true, u.includes('a.js') ? 'A' : 'B');
            }) as typeof fetch;
            const files = await fetchScripts(scripts, get);
            expect(seen).to.have.members(scripts.map((s) => s.url));
            expect(files).to.deep.equal([
                { ...scripts[0], text: 'A' },
                { ...scripts[1], text: 'B' }
            ]);
        });

        it('resolves null when any script responds with an error status', async () => {
            const get = (async (u: string) => res(!u.includes('b.js'), 'x')) as typeof fetch;
            expect(await fetchScripts(scripts, get)).to.equal(null);
        });

        it('resolves null when a download rejects', async () => {
            const get = (() => Promise.reject(new Error('offline'))) as typeof fetch;
            expect(await fetchScripts(scripts, get)).to.equal(null);
        });

        it('resolves null when reading a body rejects', async () => {
            const body = Object.assign(res(true), { text: () => Promise.reject(new Error('reset')) });
            const get = (async () => body) as typeof fetch;
            expect(await fetchScripts(scripts, get)).to.equal(null);
        });
    });
});
