import { CUBEMAP_PREFILTERED, download, importSettings, localSize, SCENARIOS, serverArchive, sha, type Archive, type Fixture } from './archive-scenarios';
import { expect, test } from '../../../lib/fixtures';
import { EditorShell, type ProjectState } from '../../../lib/pages/common';
import { fetchFile, parity, PARITY_TIMEOUT, type ServerSpy } from '../../../lib/parity';

// the worker project is shared by the whole run, so hand back what we were given
let baseline: ProjectState;
let settings: Record<string, unknown>;

// the two routes an archive download can touch
const ASSET_ROUTE = /\/api\/assets\/\d+\/(?:download|file\/)/;

// over MAX_ARCHIVE_BYTES (256 MiB) in the editor
const OVER_CAP = 512 * 1024 * 1024;

type Run = { archive: Archive; hits: { method: string; url: string }[] };

// the name the ui save gets. task 9 finding: the runner's chromium (no locale) suggests 'download'
// for these non-ascii names on a blob save too, exactly as it does for the server header
const saved = (fx: Fixture, zip: string) => fx.clientZip ?? (fx.browserZip === 'download' ? 'download' : zip);

// pre-filter to the two archive routes: the spy also sees unrelated editor traffic
const capture = (run: () => Promise<Archive>) => async (spy: ServerSpy) => ({
    archive: await run(),
    hits: (await spy.requests()).filter(h => ASSET_ROUTE.test(h.url))
});

test.describe('asset archives: golden zips', () => {
    test.beforeEach(async ({ editorPage }) => {
        baseline = await new EditorShell(editorPage).snapshot();
        settings = await importSettings(editorPage);
    });

    test.afterEach(async ({ editorPage }) => {
        const errors: unknown[] = [];
        await importSettings(editorPage, settings).catch(error => errors.push(error));
        await new EditorShell(editorPage).restore(baseline).catch(error => errors.push(error));
        if (errors.length) {
            throw new AggregateError(errors, 'archive baseline cleanup failed');
        }
    });

    for (const s of SCENARIOS) {
        test(s.title, async ({ editorPage }) => {
            test.setTimeout(PARITY_TIMEOUT);
            const fx = await s.build(editorPage);
            const oracle = await serverArchive(editorPage, fx.id);
            const got = await download(editorPage, fx.item);

            // the ui now saves the client zip under its own name; the golden layout is the server's
            expect(got.name).toBe(saved(fx, fx.zip));
            expect(oracle.name).toBe(fx.zip);
            expect([...oracle.entries.keys()].sort()).toEqual(fx.entries.map(e => e.path).sort());
            expect([...oracle.names].sort(), 'zip entries are unique').toEqual([...oracle.entries.keys()].sort());
            for (const e of fx.entries) {
                const data = oracle.entries.get(e.path)!;
                if (e.json !== undefined) {
                    expect(JSON.parse(data.toString()), e.path).toEqual(e.json);
                } else {
                    const want = e.bytes ?? (await fetchFile(editorPage, e.file!.id));
                    expect(sha(data), e.path).toBe(sha(want));
                }
            }
        });
    }
});

test.describe('asset archives: server oracle vs candidate client', () => {
    test.beforeEach(async ({ editorPage }) => {
        baseline = await new EditorShell(editorPage).snapshot();
        settings = await importSettings(editorPage);
    });

    test.afterEach(async ({ editorPage }) => {
        const errors: unknown[] = [];
        await importSettings(editorPage, settings).catch(error => errors.push(error));
        await new EditorShell(editorPage).restore(baseline).catch(error => errors.push(error));
        if (errors.length) {
            throw new AggregateError(errors, 'differential cleanup failed');
        }
    });

    for (const s of SCENARIOS) {
        test(`${s.title}: candidate matches the backend oracle`, async ({ editorPage }) => {
            test.setTimeout(PARITY_TIMEOUT);
            const fx = await s.build(editorPage);

            // classify each path once (json vs binary); the compared values are always the real
            // bytes or parsed json off the two real zips, never a recomputed expectation
            const json = new Set(fx.entries.filter(e => e.json !== undefined).map(e => e.path));
            const normalize = ({ archive }: Run) => ({
                names: [...archive.names].sort(),
                entries: Object.fromEntries([...archive.entries].map(([path, buf]) => [path, json.has(path) ? JSON.parse(buf.toString()) : buf]))
            });

            const { server, client } = await parity(
                {
                    server: { page: editorPage, run: capture(() => serverArchive(editorPage, fx.id)) },
                    client: { page: editorPage, run: capture(() => download(editorPage, fx.item)) }
                },
                { normalize }
            );

            // where the work ran: only the oracle leg hits the archive download route
            expect(server.hits.some(h => h.url.includes(`/api/assets/${fx.id}/download`))).toBe(true);
            expect(client.hits.some(h => h.url.includes('/download'))).toBe(false);
            expect(client.hits.length).toBeGreaterThan(0);

            // every client request reads a file this archive contains, by asset id (font entries
            // sit under uniqueId, not the item id the route uses)
            const archived = new Set(fx.entries.flatMap(e => (e.file ? [e.file.id] : [])));
            for (const h of client.hits) {
                const id = Number(/\/api\/assets\/(\d+)\/file\//.exec(h.url)?.[1]);
                expect(archived.has(id), h.url).toBe(true);
            }

            // deviation 1: only the extensionless-font scenario may name its zip differently
            expect(client.archive.name).toBe(saved(fx, server.archive.name));

            // no entry silently overwrote another (names is the raw, pre-dedup list)
            expect(new Set(server.archive.names).size).toBe(server.archive.names.length);
            expect(new Set(client.archive.names).size).toBe(client.archive.names.length);
        });
    }

    test('an archive over the size cap still goes to the server job', async ({ editorPage }) => {
        test.setTimeout(PARITY_TIMEOUT);
        const fx = await SCENARIOS.find(sc => sc.title === CUBEMAP_PREFILTERED)!.build(editorPage);
        const big = fx.entries.find(e => e.file)!.file!;
        const prev = await localSize(editorPage, big.id, OVER_CAP);
        const { server, client } = await parity(
            {
                server: { page: editorPage, run: capture(() => serverArchive(editorPage, fx.id)) },
                client: { page: editorPage, run: capture(() => download(editorPage, fx.item)) }
            },
            { normalize: ({ archive }: Run) => Object.fromEntries([...archive.entries]) }
        );
        await localSize(editorPage, big.id, prev);

        expect(client.hits.some(h => h.url.includes(`/api/assets/${fx.id}/download`))).toBe(true);
        expect(client.archive.name).toBe(server.archive.name);
        expect(sha(client.archive.entries.get(`${big.id}/${big.filename}`)!)).toBe(sha(await fetchFile(editorPage, big.id)));
    });
});
