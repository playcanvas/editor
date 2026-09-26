import type { Page, Request } from '@playwright/test';

import { arm } from '../../../lib/arm';
import { waitForParser } from '../../../lib/common';
import { LAUNCH_HOST } from '../../../lib/config';
import { JOB_TEST_TIMEOUT, JOB_TIMEOUT, READY_TIMEOUT } from '../../../lib/constants';
import { expect, test } from '../../../lib/fixtures';
import { AssetWorkflows } from '../../../lib/pages/asset-workflows';
import { AssetsPanel } from '../../../lib/pages/assets';
import { EditorShell, type ProjectState } from '../../../lib/pages/common';
import { SettingsDialog } from '../../../lib/pages/settings';
import { fetchFile, parity, PARITY_TIMEOUT } from '../../../lib/parity';
import { waitForFrame } from '../../../lib/ready';
import { uniqueName } from '../../../lib/utils';

const LOG = '__e2eConcat';
const INIT = '__e2eInit';
const STRICT = '__e2eStrict';
const THROW_MSG = 'intentional concatenation error';

// 1-based line of the throw in thrower(); both paths must resolve the error back to it
const THROW_LINE = 8;
const AFTER_ENGINE = 2;
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// the top frame of a stack: "at x (url:line:col)" or "at url:line:col"
const FRAME = /\(?((?:blob:)?https?:\/\/[^\s()]+):(\d+):(\d+)\)?/;

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

type Spec = { strict?: boolean; probe?: boolean; speed?: boolean; preload?: boolean; afterEngine?: boolean; throws?: boolean };

type LaunchRecord = {
    order: string[];
    registered: string[];
    attributes: Record<string, Record<string, { type: string; default: unknown }>>;
    values: Record<string, unknown>;
    initialized: string[];
    strict: boolean | null;
    error: { message: string; key: string; line: number } | null;
};

type Seen = { mode: string | null; concatenated: number; files: string[]; link: string | null };

type Scenario = {
    title: string;

    // keyed by a short log tag, created in this order
    scripts: Record<string, Spec>;

    // project script order for these keys, placed first; null keeps creation order
    order: string[] | null;
    entity: { key: string; speed?: number } | null;

    // keys whose code goes into the concatenated file
    joined: string[];
    expected: LaunchRecord;
};

type Fixture = { keys: Record<string, { id: number; file: string; script: string }>; guid: string | null };

const push = (key: string) => `(window.${LOG} = window.${LOG} || []).push('${key}');`;

// every file logs its key at top level, so the log is the order the launch ran the files in
const classic = (key: string, script: string, spec: Spec) => {
    const lines = [...(spec.strict ? ['\'use strict\';'] : []), push(key)];
    if (spec.probe) {
        lines.push(`window.${STRICT} = (function () { return this === undefined; })();`);
    }

    // an after-engine script runs before the app exists, so it only logs
    if (spec.afterEngine) {
        return lines.join('\n');
    }
    lines.push(`var ${key}Type = pc.createScript('${script}');`);
    if (spec.speed) {
        lines.push(`${key}Type.attributes.add('speed', { type: 'number', default: 1 });`);
    }
    lines.push(`${key}Type.prototype.initialize = function () { (window.${INIT} = window.${INIT} || []).push('${key}'); };`);
    return lines.join('\n');
};

// throws once from update(): an initialize() throw stops AppBase.start() before the first frame
const thrower = (key: string, script: string) => [
    push(key),
    `var ${key}Type = pc.createScript('${script}');`,
    `${key}Type.prototype.update = function () {`,
    '    if (this.thrown) {',
    '        return;',
    '    }',
    '    this.thrown = true;',
    `    throw new Error('${THROW_MSG}');`,
    '};'
].join('\n');

const NONE: Pick<LaunchRecord, 'values' | 'initialized' | 'strict' | 'error'> = { values: {}, initialized: [], strict: null, error: null };

const SCENARIOS: Scenario[] = [
    {
        title: 'order, attributes, preload and loading type',
        scripts: { a: { speed: true }, b: { strict: true, probe: true }, c: {}, lazy: { preload: false }, late: { afterEngine: true } },
        order: ['c', 'a', 'lazy', 'b', 'late'],
        entity: { key: 'a', speed: 3 },
        joined: ['c', 'a', 'lazy', 'b'],
        expected: {
            order: ['late', 'c', 'a', 'lazy', 'b'],
            registered: ['c', 'a', 'lazy', 'b'],
            attributes: { c: {}, a: { speed: { type: 'number', default: 1 } }, lazy: {}, b: {} },
            values: { speed: 3 },
            initialized: ['a'],

            // b's directive sits mid-file once joined, so it is inert on both paths
            strict: false,
            error: null
        }
    },
    {
        title: 'a strict first file makes the whole file strict',
        scripts: { s: { strict: true }, t: { probe: true } },
        order: ['s', 't'],
        entity: null,
        joined: ['s', 't'],
        expected: { order: ['s', 't'], registered: ['s', 't'], attributes: { s: {}, t: {} }, ...NONE, strict: true }
    },
    {
        title: 'error location',
        scripts: { a: {}, boom: { throws: true } },
        order: ['a', 'boom'],
        entity: { key: 'boom' },
        joined: ['a', 'boom'],
        expected: {
            order: ['a', 'boom'],
            registered: ['a', 'boom'],
            attributes: { a: {}, boom: {} },
            ...NONE,
            error: { message: THROW_MSG, key: 'boom', line: THROW_LINE }
        }
    },
    {
        title: 'no concatenable scripts',
        scripts: {},
        order: null,
        entity: null,
        joined: [],
        expected: { order: [], registered: [], attributes: {}, ...NONE }
    }
];

const vlqDecode = (s: string) => {
    const out: number[] = [];
    let v = 0;
    let shift = 0;
    for (const ch of s) {
        const d = B64.indexOf(ch);
        v += (d & 31) << shift;
        if (d & 32) {
            shift += 5;
            continue;
        }
        out.push(v & 1 ? -(v >>> 1) : v >>> 1);
        v = 0;
        shift = 0;
    }
    return out;
};

// resolves a 1-based line/column through the file's own inline source map to { file, line }
const original = (code: string, line: number, col: number) => {
    const b64 = code.match(/sourceMappingURL=data:application\/json;(?:charset=utf-8;)?base64,(\S+)/)?.[1];
    if (!b64) {
        return null;
    }
    const map = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    const rows: string[] = map.mappings.split(';');
    let src = 0;
    let sl = 0;
    let hit: { src: number; line: number } | null = null;
    for (let i = 0; i < rows.length; i++) {
        let gc = 0;
        for (const seg of rows[i].split(',')) {
            if (!seg) {
                continue;
            }
            const [dgc, ds, dl] = vlqDecode(seg);
            gc += dgc;
            if (ds === undefined) {
                continue;
            }
            src += ds;
            sl += dl;
            if (i === line - 1 && gc <= col - 1) {
                hit = { src, line: sl + 1 };
            }
        }
    }
    return hit ? { file: basename(String(map.sources[hit.src])), line: hit.line } : null;
};

const basename = (url: string) => url.split('/').pop()!.split('?')[0];

const createClassic = async (page: Page, filename: string, text: string) => {
    await waitForParser(page);
    return page.evaluate(([name, body]) => {
        return window.editor.api.globals.assets
        .createScript({ filename: name, text: body })
        .then((asset: any) => asset.get('id') as number);
    }, [filename, text] as const);
};

const parsed = async (page: Page, id: number, script: string) => {
    const done = await arm(page, ({ id, script }: { id: number; script: string }) => {
        const asset = window.editor.api.globals.assets.get(id)!;
        const has = () => !!asset.get(`data.scripts.${script}`);
        if (has()) {
            return { done: Promise.resolve() };
        }
        let evt: { unbind(): void } | undefined;
        return {
            done: new Promise<void>((resolve) => {
                evt = asset.on('*:set', () => {
                    if (has()) {
                        evt!.unbind();
                        resolve();
                    }
                });
            }),
            dispose: () => evt?.unbind()
        };
    }, { id, script }, { what: `script ${script} to parse`, timeout: JOB_TIMEOUT });
    await done();
};

const setAsset = async (page: Page, id: number, path: string, value: unknown) => {
    await page.evaluate(({ id, path, value }) => {
        (window.editor.api.globals.assets.get(id) as any).set(path, value);
    }, { id, path, value });
    await new AssetsPanel(page).flush(id);
};

const scripts = (page: Page) => new SettingsDialog(page).projectSetting('scripts') as Promise<number[]>;

// the project script order is what both paths concatenate in, so it must reach the server first
const setScripts = async (page: Page, order: number[]) => {
    const s = new SettingsDialog(page);
    await s.setProjectSetting('scripts', order);
    await s.flushProjectSettings();
};

const addEntity = async (page: Page, script: string, speed?: number) => {
    const shell = new EditorShell(page);
    const guid = await page.evaluate(async ({ script, name }) => {
        const entities = window.editor.api.globals.entities;
        const entity = entities.create({ name } as any);
        await entities.addScript([entity], script);
        return entity.get('resource_id') as string;
    }, { script, name: uniqueName('cat-entity') });

    // the defaults job fills attributes in, so an explicit value has to land after it
    await shell.flushJobs();
    if (speed !== undefined) {
        await page.evaluate(({ guid, script, speed }) => {
            window.editor.api.globals.entities.get(guid)!.set(`components.script.scripts.${script}.attributes.speed`, speed);
        }, { guid, script, speed });
    }
    await shell.flushScene();
    return guid;
};

const setup = async (page: Page, sc: Scenario) => {
    const keys: Fixture['keys'] = {};
    for (const [key, spec] of Object.entries(sc.scripts)) {
        const base = uniqueName(`cat-${key}`);
        const script = base.replace(/[^a-z0-9]/gi, '');
        const file = `${base}.js`;
        const id = await createClassic(page, file, spec.throws ? thrower(key, script) : classic(key, script, spec));
        if (!spec.afterEngine) {
            await parsed(page, id, script);
        }
        keys[key] = { id, file, script };
    }

    // asset-create appends new scripts to the order, so wait for them before reordering; it
    // lands after the create resolves, so it has to settle before preload drops any again
    const has = (ids: number[], on: boolean) => page.waitForFunction(({ ids, on }) => {
        const order = (window.editor.call('settings:project') as any).get('scripts');
        return ids.every((id: number) => order.includes(id) === on);
    }, { ids, on }, { timeout: JOB_TIMEOUT });
    await has(Object.values(keys).map(k => k.id), true);

    // collab-server takes a script out of the order when preload goes false; the reorder below
    // puts it back, so this pins the job for an in-order preload=false id
    const lazy: number[] = [];
    for (const [key, spec] of Object.entries(sc.scripts)) {
        if (spec.preload === false) {
            await setAsset(page, keys[key].id, 'preload', false);
            lazy.push(keys[key].id);
        }
        if (spec.afterEngine) {
            await setAsset(page, keys[key].id, 'data.loadingType', AFTER_ENGINE);
        }
    }
    await has(lazy, false);

    if (sc.order) {
        const wanted = sc.order.map(k => keys[k].id);
        await setScripts(page, wanted.concat((await scripts(page)).filter(id => !wanted.includes(id))));
    }

    const guid = sc.entity ? await addEntity(page, keys[sc.entity.key].script, sc.entity.speed) : null;
    return { keys, guid } as Fixture;
};

// the option only exists in the launch dropdown, so toggle its row the way a click does
const setConcatenate = (page: Page, on: boolean) => page.evaluate((on) => {
    const set = () => !!(window.editor.call('launch:options') as any).concatenate === on;
    if (!set()) {
        (document.querySelector('.launch-option-concatenate') as HTMLElement).click();
    }
    if (!set()) {
        throw new Error('the Concatenate Scripts launch option did not toggle');
    }
}, on);

/** Launches from the editor's Launch button with Concatenate Scripts ticked and records what ran. */
const recordLaunch = async (page: Page, sc: Scenario, f: Fixture) => {
    const context = page.context();
    const seen: Seen = { mode: null, concatenated: 0, files: [], link: null };
    const onRequest = (req: Request) => {
        const url = new URL(req.url());
        if (url.host !== LAUNCH_HOST) {
            return;
        }
        if (url.pathname.includes('/concatenated-scripts/')) {
            seen.concatenated++;
        } else if (url.pathname.startsWith('/api/assets/files/') && url.pathname.endsWith('.js')) {
            seen.files.push(decodeURIComponent(basename(url.pathname)));
        }
    };

    // the debug engine (debug=true) catches a script method's throw and reports it through
    // console.error, so it never reaches the page as an uncaught error
    const raised = Object.values(sc.scripts).some(s => s.throws) ? context.waitForEvent('console', {
        predicate: m => m.type() === 'error' && m.text().includes(THROW_MSG) &&
            new URL(m.page()?.url() ?? 'about:blank').host === LAUNCH_HOST,
        timeout: JOB_TIMEOUT
    }) : null;

    // awaited below on success; this only stops an unconsumed wait rejecting unhandled after a failure
    raised?.catch(() => {});

    // every popup this call opens is closed and the listeners detached on a thrown assertion too,
    // not just on success (ledger preflight ruling); the option goes back to whatever this call
    // found, and only after the popups close, so a throw from that restore can't leave one open
    const was = await page.evaluate(() => !!(window.editor.call('launch:options') as any).concatenate);
    const popups: Page[] = [];
    const onPage = (p: Page) => popups.push(p);
    const errors: unknown[] = [];
    context.on('request', onRequest);
    context.on('page', onPage);
    const result = await setConcatenate(page, true).then(async () => {
        const launch = await new AssetWorkflows(page).launch();
        await waitForFrame(launch);
        const launchUrl = new URL(launch.url());
        seen.mode = launchUrl.searchParams.get('concatenateScripts');

        // the error capture below only works on the debug engine (see the `raised` comment)
        expect(launchUrl.searchParams.get('debug')).toBe('true');

        const byScript = Object.fromEntries(Object.entries(f.keys).map(([k, v]) => [v.script, k]));
        const target = sc.entity?.speed !== undefined ? f.keys[sc.entity.key].script : null;
        const state = await launch.evaluate(({ byScript, guid, target, log, init, strict }) => {
            const w = window as any;
            const app = w.pc.app;
            const types = app.scripts.list().filter((t: any) => byScript[t.__name]);
            return {
                order: w[log] ?? [],
                registered: types.map((t: any) => byScript[t.__name]),
                attributes: Object.fromEntries(types.map((t: any) => [
                    byScript[t.__name],
                    Object.fromEntries(Object.entries(t.attributes.index).map(([k, v]: [string, any]) => [k, { type: v.type, default: v.default }]))
                ])),
                values: target ? { speed: app.root.findByGuid(guid)?.script?.[target]?.speed ?? null } : {},
                initialized: w[init] ?? [],
                strict: w[strict] ?? null
            };
        }, { byScript, guid: f.guid, target, log: LOG, init: INIT, strict: STRICT });

        let error: LaunchRecord['error'] = null;
        if (raised) {
            const err = await (await raised).args()[0].evaluate((e: Error) => ({ message: e.message, stack: e.stack! }));
            const [, url, line, col] = err.stack.match(FRAME)!;

            // each path resolves through its own inline map; a file loaded on its own has none
            const code = await launch.evaluate(u => fetch(u).then(r => (r.ok ? r.text() : Promise.reject(new Error(`refetch ${u}: ${r.status}`)))), url);
            const pos = original(code, Number(line), Number(col)) ?? { file: basename(url), line: Number(line) };
            const byFile = Object.fromEntries(Object.entries(f.keys).map(([k, v]) => [v.file, k]));
            error = { message: err.message, key: byFile[pos.file] ?? pos.file, line: pos.line };

            const link = launch.locator('#application-console:not(.hidden) p.error a.code-link').first();
            await link.waitFor({ timeout: READY_TIMEOUT });
            seen.link = await link.innerText();
        }
        return { record: { ...state, error } as LaunchRecord, seen };
    }).catch((error) => {
        errors.unshift(error);
    }).finally(async () => {
        context.off('request', onRequest);
        context.off('page', onPage);
        await Promise.all(popups.filter(p => !p.isClosed()).map(p => p.close().catch(error => errors.push(error))));
        await setConcatenate(page, was).catch(error => errors.push(error));
    });
    if (errors.length) {
        throw errors.length === 1 ? errors[0] : new AggregateError(errors, 'concatenated launch or cleanup failed');
    }
    return result as { record: LaunchRecord; seen: Seen };
};

// the worker project is shared by the whole run, so hand back what we were given
let baseline: ProjectState;
let order: number[];
let concatenate: boolean;

test.beforeEach(async ({ editorPage }) => {
    baseline = await new EditorShell(editorPage).snapshot();
    order = await scripts(editorPage);
    concatenate = await editorPage.evaluate(() => !!(window.editor.call('launch:options') as any).concatenate);
    expect(await editorPage.evaluate(() => !!(window.editor.call('settings:project') as any).get('useLegacyScripts'))).toBe(false);

    // the error scenario's capture only works on the debug engine (see recordLaunch)
    expect(await editorPage.evaluate(() => !!(window.editor.call('settings:projectUser') as any).get('editor.launchDebug'))).toBe(true);
});

// each step runs even if an earlier one fails, so one bad restore can't strand the rest
test.afterEach(async ({ editorPage }) => {
    const errors: unknown[] = [];
    await new EditorShell(editorPage).restore(baseline).catch(error => errors.push(error));
    await setScripts(editorPage, order).catch(error => errors.push(error));
    await setConcatenate(editorPage, concatenate).catch(error => errors.push(error));
    if (errors.length) {
        throw errors.length === 1 ? errors[0] : new AggregateError(errors, 'concatenate scripts cleanup failed');
    }
});

test.describe('concatenate scripts: server baseline', () => {
    for (const sc of SCENARIOS) {
        test(`server: ${sc.title}`, async ({ editorPage, errors }) => {
            test.setTimeout(JOB_TEST_TIMEOUT);
            errors.allow(new RegExp(THROW_MSG));
            const f = await setup(editorPage, sc);
            const { record, seen } = await recordLaunch(editorPage, sc, f);
            const joined = sc.joined.map(k => f.keys[k].file);

            expect(seen.mode).toBe('true');
            expect(record).toEqual(sc.expected);

            // the client build ships (Task 5): every scenario here is a supported input, so it
            // always joins in this tab now, never through the job (cross-plan ruling amendment)
            expect(seen.concatenated).toBe(0);
            expect(seen.files.filter(n => joined.includes(n)).sort()).toEqual([...joined].sort());
            if (sc.expected.error) {
                const boom = f.keys[sc.expected.error.key];
                expect(seen.link).toMatch(new RegExp(`^\\[${esc(boom.file)}\\?id=${boom.id}&branchId=[^\\]]+:${THROW_LINE}\\]$`));
            }
        });
    }
});

/**
 * The server leg forces every joined script's own download to fail, so the launch falls back to
 * the real concatenated-scripts route — the backend oracle, on this same candidate build. The
 * client leg is a normal launch, optionally with one download blocked (the fallback case) or two
 * joined scripts' own files swapped (the negative control: a real, wrong join).
 */
const differential = async (page: Page, sc: Scenario, opts: { clientFail?: string; clientSwap?: [string, string] } = {}) => {
    const f = await setup(page, sc);
    const context = page.context();
    const joined = sc.joined.map(k => f.keys[k].file);
    const own = (file: string) => new RegExp(`/api/assets/files/(?:.*/)?${esc(file)}\\?`);

    // aborts each file's own request once, so the leg it belongs to falls back to scripts.js
    const block = async (files: string[]) => {
        const patterns = files.map(own);
        await Promise.all(patterns.map(p => context.route(p, r => r.abort(), { times: 1 })));
        return () => Promise.all(patterns.map(p => context.unroute(p)));
    };

    // serves each of the two keys' own file at the other's url, once — a real, wrong join
    const swap = async ([keyA, keyB]: [string, string]) => {
        const [bodyA, bodyB] = await Promise.all([keyA, keyB].map(k => fetchFile(page, f.keys[k].id)));
        const [urlA, urlB] = [keyA, keyB].map(k => own(f.keys[k].file));
        await context.route(urlA, r => r.fulfill({ body: bodyB, contentType: 'application/javascript' }), { times: 1 });
        await context.route(urlB, r => r.fulfill({ body: bodyA, contentType: 'application/javascript' }), { times: 1 });
        return () => Promise.all([context.unroute(urlA), context.unroute(urlB)]);
    };

    // the undo runs on a failed launch too, so a leftover route can't leak into the next leg
    const leg = async (arm: () => Promise<(() => Promise<unknown>) | null>) => {
        const undo = await arm();
        return recordLaunch(page, sc, f).finally(() => undo?.());
    };

    const { clientSwap, clientFail } = opts;
    const tamper = () => {
        if (clientSwap) {
            return swap(clientSwap);
        }
        return clientFail ? block([f.keys[clientFail].file]) : Promise.resolve(null);
    };
    const runs = await parity<{ record: LaunchRecord; seen: Seen }>({
        server: { page, run: () => leg(() => block(joined)) },
        client: { page, run: () => leg(tamper) }
    }, { normalize: v => v.record });
    return { f, joined, ...runs };
};

test.describe('concatenate scripts: candidate vs server oracle', () => {
    for (const sc of SCENARIOS) {
        test(`parity: ${sc.title}`, async ({ editorPage, errors }) => {
            test.setTimeout(PARITY_TIMEOUT);
            errors.allow(new RegExp(THROW_MSG));
            errors.allow(/net::ERR_FAILED/);
            const { f, joined, server, client } = await differential(editorPage, sc);

            // both legs use the same, existing user option — no new query value selects either path
            expect(server.seen.mode).toBe('true');
            expect(client.seen.mode).toBe('true');
            expect(server.record).toEqual(sc.expected);
            expect(client.record).toEqual(server.record);

            // where the work ran: the oracle leg's blocked downloads still fall through to scripts.js;
            // the client leg fetches every joined script itself and never requests scripts.js
            expect(server.seen.files.filter(n => joined.includes(n)).sort()).toEqual([...joined].sort());
            expect(server.seen.concatenated > 0).toBe(joined.length > 0);
            expect(client.seen.concatenated).toBe(0);
            expect(client.seen.files.filter(n => joined.includes(n)).sort()).toEqual([...joined].sort());

            // the one pinned deviation: the client console links the real file and line
            if (sc.expected.error) {
                const boom = f.keys[sc.expected.error.key];
                expect(server.seen.link).toMatch(/^\[scripts\.js\?branchId=[^\]]+:1\]$/);
                expect(client.seen.link).toMatch(new RegExp(`^\\[${esc(boom.file)}\\?id=${boom.id}&branchId=[^\\]]+:${THROW_LINE}\\]$`));
            }
        });
    }

    test('parity: a single failed download on the client leg falls back to the server job too', async ({ editorPage, errors }) => {
        test.setTimeout(PARITY_TIMEOUT);
        errors.allow(/net::ERR_FAILED/);
        const sc = SCENARIOS[0];
        const { f, server, client } = await differential(editorPage, sc, { clientFail: 'c' });

        expect(client.seen.mode).toBe('true');
        expect(server.record).toEqual(sc.expected);
        expect(client.record).toEqual(server.record);

        // the one blocked download made the client leg hand over to scripts.js, same as the oracle leg
        expect(client.seen.files).toContain(f.keys.c.file);
        expect(client.seen.concatenated).toBeGreaterThan(0);
    });

    test('parity: catches a candidate that disagrees with the server oracle', async ({ editorPage, errors }) => {
        test.setTimeout(PARITY_TIMEOUT);
        errors.allow(/net::ERR_FAILED/);

        // scenario 1's first joined file carries 'use strict', which makes the whole join strict;
        // swapping the two joined scripts' own bodies moves that directive out of the first
        // position, for real, changing order/registered/strict — only parity's own deep-equal
        // catches it, since nothing here asserts those fields directly
        await expect(differential(editorPage, SCENARIOS[1], { clientSwap: ['s', 't'] }))
        .rejects.toThrow(/client result differs from the server's/);
    });
});
