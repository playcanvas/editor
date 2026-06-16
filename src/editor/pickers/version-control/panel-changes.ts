import { Container, TextAreaInput } from '@playcanvas/pcui';

import { config } from '@/editor/config';

import { templateEntitiesFor, templateEntityPath } from './vc-diff-data';
import { renderPreviewPropertyDiff } from './vc-diff-preview';
import { diffTextChangeCounts, hashChip, isHiddenDiffField, lineChangeCounts, splitDiffPath, summarizeDiff, typeLabel, type DiffSummary } from './vc-helpers';
import { diffCreate } from '../../messenger/jobs';

// composer resting height and the slice of the change list kept visible above it
const COMPOSER_MIN_H = 120;
const COMPOSER_LIST_FLOOR = 80;

export const createChangesPanel = () => {
    const sidebar = new Container({ class: 'vc-changes' });
    const summary = new Container({ class: 'vc-changes-summary' });

    let current: DiffSummary = null;
    // raw diff matching `current`; drives the field diff and open-full-diff
    let raw: any = null;
    // selected conflict index into raw.conflicts
    let selIdx: number = null;
    let loading = false;
    let stale = true;
    // generation counter: incremented by invalidate() and at the start of each fetch;
    // .then/.catch discard results when the generation has moved on (stale-response guard)
    let gen = 0;
    let rawDiffLive = false;
    // the in-flight diff job, so Open Full Diff works before the summary finishes loading
    let rawPromise: Promise<any> = null;
    const fileStats = new Map<string, Promise<{ deleted: number; added: number } | null>>();

    const diffId = (diff: any) => diff?.id ?? diff?.merge_id;

    const releaseRawDiff = () => {
        const id = rawDiffLive ? diffId(raw) : null;
        if (typeof id === 'string') {
            editor.call('picker:versioncontrol:releaseDiff', id);
        }
        rawDiffLive = false;
        fileStats.clear();
    };

    const list = document.createElement('div');
    list.classList.add('vc-changes-list');
    sidebar.dom.appendChild(list);

    const form = document.createElement('div');
    form.classList.add('vc-checkpoint-form');
    sidebar.dom.appendChild(form);

    // native placeholder; pcui's [placeholder] renders an out-of-place chip
    const description = new TextAreaInput({ blurOnEnter: false, keyChange: true, renderChanges: false });
    const textarea = description.dom.querySelector('textarea') as HTMLTextAreaElement;
    textarea.placeholder = 'Describe this checkpoint…';
    form.appendChild(description.dom);

    const create = document.createElement('button');
    create.type = 'button';
    create.classList.add('vc-create-checkpoint');
    create.textContent = 'Create Checkpoint';
    create.disabled = true;
    form.appendChild(create);

    const gateCreate = () => {
        create.disabled = create.classList.contains('busy') || !description.value.trim() || !editor.call('permissions:write');
    };

    description.on('change', gateCreate);
    // re-evaluate gating when write permission flips mid-session
    editor.on('permissions:writeState', gateCreate);
    description.on('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !create.disabled) {
            sidebar.emit('create', description.value.trim());
        }
    });
    create.addEventListener('click', () => {
        sidebar.emit('create', description.value.trim());
    });

    const tip = document.createElement('div');
    tip.classList.add('vc-form-tip');
    tip.textContent = 'Tip: Cmd/Ctrl+Enter creates the checkpoint.';
    form.appendChild(tip);

    // bottom-pinned composer: a taller textarea grows the form upward into the change
    // list, so cap it to the rail to keep the list and Create button on screen (#2098)
    const autoGrow = () => {
        textarea.style.height = 'auto';
        const chrome = form.offsetHeight - textarea.offsetHeight;
        const cap = Math.max(COMPOSER_MIN_H, sidebar.dom.clientHeight - chrome - COMPOSER_LIST_FLOOR);
        textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, COMPOSER_MIN_H), cap)}px`;
    };
    textarea.addEventListener('input', autoGrow);

    const select = (index: number) => {
        selIdx = index;
        render();
    };

    const renderList = () => {
        list.innerHTML = '';
        if (loading) {
            list.insertAdjacentHTML('beforeend', `<div class="vc-skeleton">${'<div class="skeleton-row"><span class="bone line"></span></div>'.repeat(3)}</div>`);
            return;
        }
        if (!current || !current.total) {
            const status = document.createElement('div');
            status.classList.add('vc-list-status');
            status.textContent = current ? 'No changes since your last checkpoint' : 'Changes not computed yet';
            list.appendChild(status);
            return;
        }
        for (const g of current.groups) {
            const head = document.createElement('div');
            head.classList.add('vc-group');
            head.textContent = `${typeLabel(g.type)} · ${g.items.length}`;
            list.appendChild(head);
            for (const item of g.items) {
                const row = document.createElement('div');
                row.classList.add('vc-item');
                if (item.index === selIdx) {
                    row.classList.add('selected');
                }
                const name = document.createElement('span');
                name.classList.add('name');
                name.textContent = item.name;
                name.title = item.name;
                row.appendChild(name);
                const badge = document.createElement('span');
                badge.classList.add('status', item.status);
                badge.textContent = item.status;
                row.appendChild(badge);
                row.addEventListener('click', () => select(item.index));
                list.appendChild(row);
            }
        }
    };

    const fmtVal = (v: any) => {
        if (v === undefined || v === null) {
            return '—';
        }
        const s = typeof v === 'string' ? `"${v}"` : JSON.stringify(v);
        return s.length > 64 ? `${s.substring(0, 61)}…` : s;
    };

    const appendLineCounts = (vals: HTMLElement, counts: { deleted: number; added: number }) => {
        const add = document.createElement('span');
        add.classList.add('new', 'count');
        add.textContent = `+${counts.added}`;
        vals.appendChild(add);
        vals.appendChild(document.createTextNode(' '));
        const del = document.createElement('span');
        del.classList.add('old', 'count');
        del.textContent = `-${counts.deleted}`;
        vals.appendChild(del);
    };

    const fileName = (conflict: any, entry: any, side: 'src' | 'dst') => {
        return side === 'src' ? entry.srcFilename ?? conflict.srcFilename : entry.dstFilename ?? conflict.dstFilename;
    };

    const loadLineCounts = (conflict: any, entry: any) => {
        const id = rawDiffLive ? diffId(raw) : null;
        if (id && entry.id && entry.mergedFilePath) {
            const key = JSON.stringify([id, entry.id, entry.mergedFilePath]);
            if (!fileStats.has(key)) {
                fileStats.set(key, editor.api.globals.rest.merge.mergeConflicts({
                    mergeId: id,
                    conflictId: entry.id,
                    fileName: entry.mergedFilePath,
                    resolved: false
                }).promisify()
                .then(diffTextChangeCounts)
                .catch((err: unknown) => {
                    log.error(err);
                    return null;
                }));
            }
            return fileStats.get(key)!;
        }
        const inline = lineChangeCounts(entry.srcValue ?? (entry.missingInSrc ? '' : undefined), entry.dstValue ?? (entry.missingInDst ? '' : undefined));
        if (inline) {
            return Promise.resolve(inline);
        }
        return Promise.resolve(null);
    };

    // combined template entity maps, memoised per conflict (built once per render)
    const tplEntities = new Map<any, any>();

    const entityName = (conflict: any, value: string) => {
        const id = splitDiffPath(value)[1];
        // template entities live in the asset's own data.entities, plus any the
        // diff reports as added/removed on the side that isn't loaded
        if (conflict.assetType === 'template') {
            let entities = tplEntities.get(conflict);
            if (!entities) {
                entities = templateEntitiesFor(conflict, (assetId: any) => editor.call('assets:get', assetId));
                tplEntities.set(conflict, entities);
            }
            return templateEntityPath(entities, id);
        }
        const src = raw?.srcCheckpoint?.scenes?.[conflict.itemId]?.entities?.[id];
        const dst = raw?.dstCheckpoint?.scenes?.[conflict.itemId]?.entities?.[id];
        const name = src ?? dst;
        return typeof name === 'string' ? name : undefined;
    };

    const fileText = (entry: any) => {
        if (entry.missingInDst) {
            return 'added';
        }
        if (entry.missingInSrc) {
            return 'deleted';
        }
        return 'changed';
    };

    // textual asset merges (e.g. scripts) — line counts; the preview can't host the full diff's iframe
    const renderFileRows = (conflict: any, entries: any[]) => {
        const wrap = document.createElement('div');
        wrap.classList.add('vc-field-diff');
        for (const entry of entries) {
            const row = document.createElement('div');
            row.classList.add('vc-field-row');
            const path = document.createElement('span');
            path.classList.add('path');
            path.textContent = fileName(conflict, entry, 'src') ?? fileName(conflict, entry, 'dst');
            path.title = path.textContent;
            const vals = document.createElement('span');
            vals.classList.add('vals');
            vals.textContent = 'Loading…';
            loadLineCounts(conflict, entry).then((counts) => {
                if (!row.isConnected) {
                    return;
                }
                vals.innerHTML = '';
                if (counts) {
                    appendLineCounts(vals, counts);
                } else {
                    vals.textContent = `${fileText(entry)} — use Open Full Diff to view`;
                    vals.title = vals.textContent;
                }
            });
            row.appendChild(path);
            row.appendChild(vals);
            wrap.appendChild(row);
        }
        return wrap;
    };

    // property diffs reuse the full diff's structured look (compact); textual merges stay as line-count rows
    const renderFieldDiff = (conflict: any) => {
        const wrap = document.createElement('div');
        wrap.classList.add('vc-field-preview');
        const data = (conflict.data ?? []).filter((e: any) => !isHiddenDiffField(e.path));
        const files = data.filter((e: any) => fileName(conflict, e, 'src') || fileName(conflict, e, 'dst'));
        const props = data.filter((e: any) => !(fileName(conflict, e, 'src') || fileName(conflict, e, 'dst')));

        if (props.length) {
            wrap.appendChild(renderPreviewPropertyDiff(conflict, props, { entityName, fmtVal }));
        }
        if (files.length) {
            wrap.appendChild(renderFileRows(conflict, files));
        }
        return wrap;
    };

    const renderSummary = () => {
        summary.dom.innerHTML = '';
        const card = document.createElement('div');
        card.classList.add('vc-card');
        const branch = config.self.branch;

        const head = document.createElement('div');
        head.classList.add('vc-card-head');
        card.appendChild(head);

        const h = document.createElement('h3');
        h.textContent = loading ? 'Computing changes…' :
            current ? `${current.total} change${current.total === 1 ? '' : 's'} since your last checkpoint` : 'Changes';
        head.appendChild(h);

        const side = document.createElement('div');
        side.classList.add('side');
        head.appendChild(side);

        if (branch.latestCheckpointId) {
            const meta = document.createElement('div');
            meta.classList.add('vc-meta');
            meta.textContent = 'vs ';
            meta.appendChild(hashChip(branch.latestCheckpointId));
            side.appendChild(meta);
        }

        // show while loading, when not yet computed (so Open Full Diff works directly), and when there are changes (#2098)
        if (branch.latestCheckpointId && (loading || !current || current.total)) {
            const openBtn = document.createElement('button');
            openBtn.type = 'button';
            openBtn.classList.add('vc-button');
            openBtn.textContent = 'Open Full Diff';
            openBtn.addEventListener('click', () => summary.emit('openDiff', !loading && rawDiffLive ? raw : null, rawPromise));
            side.appendChild(openBtn);
        }

        // field-level diff of the selected change
        if (loading) {
            card.insertAdjacentHTML('beforeend', `<div class="vc-field-diff"><div class="vc-skeleton">${'<div class="skeleton-row"><span class="bone line"></span></div>'.repeat(3)}</div></div>`);
        } else if (current && current.total) {
            const sel = selIdx;
            const selItem = current.groups.flatMap(g => g.items).find(it => it.index === sel) ?? null;
            const conflict = raw?.conflicts?.[selIdx];
            if (selItem && conflict) {
                const itemHead = document.createElement('div');
                itemHead.classList.add('vc-item-head');
                const name = document.createElement('span');
                name.classList.add('name');
                name.textContent = selItem.name;
                name.title = selItem.name;
                itemHead.appendChild(name);
                const badge = document.createElement('span');
                badge.classList.add('status', selItem.status);
                badge.textContent = selItem.status;
                itemHead.appendChild(badge);
                card.appendChild(itemHead);
                card.appendChild(renderFieldDiff(conflict));
            } else {
                const none = document.createElement('div');
                none.classList.add('vc-meta');
                none.textContent = 'Select a change to see its details';
                card.appendChild(none);
            }
        } else {
            const none = document.createElement('div');
            none.classList.add('vc-meta');
            none.textContent = current ? 'No changes since your last checkpoint' : 'Changes not computed yet';
            card.appendChild(none);
            // not computed (gated or errored): let the user pull the diff on demand (#2098)
            if (!current) {
                const compute = document.createElement('button');
                compute.type = 'button';
                compute.classList.add('vc-button', 'vc-compute');
                compute.textContent = 'Compute';
                compute.addEventListener('click', () => refresh(true, true));
                card.appendChild(compute);
            }
        }

        summary.dom.appendChild(card);
    };

    const render = () => {
        renderList();
        renderSummary();
    };

    function refresh(force?: boolean, viaUser?: boolean) {
        const branch = config.self.branch;
        if (loading || (!stale && !force)) {
            render();
            return;
        }
        // no checkpoint to diff against yet
        if (!branch.latestCheckpointId) {
            releaseRawDiff();
            current = { total: 0, groups: [] };
            raw = null;
            selIdx = null;
            stale = false;
            render();
            sidebar.emit('count', 0);
            return;
        }
        // gated by the user setting: only the explicit Compute action fires the diff (#2098)
        if (editor.call('settings:projectUser').get('editor.vcAutoLoadDiffs') === false && !viaUser) {
            releaseRawDiff();
            current = null;
            raw = null;
            selIdx = null;
            render();
            sidebar.emit('count', null);
            return;
        }
        loading = true;
        const snap = ++gen;
        render();
        const pending = diffCreate({
            srcBranchId: branch.id,
            srcCheckpointId: null,
            dstBranchId: branch.id,
            dstCheckpointId: branch.latestCheckpointId
        });
        rawPromise = pending;
        pending.then((diff: any) => {
            // single-flight: clear loading even for superseded responses or refresh deadlocks
            loading = false;
            if (snap !== gen) {
                return;
            }
            rawPromise = null;
            stale = false;
            const oldId = rawDiffLive ? diffId(raw) : null;
            const next = diff ?? {};
            const nextId = diffId(next);
            if (typeof oldId === 'string' && oldId !== nextId) {
                editor.call('picker:versioncontrol:releaseDiff', oldId);
            }
            raw = next;
            rawDiffLive = typeof nextId === 'string';
            current = summarizeDiff(raw);
            fileStats.clear();
            // indices shift on every recompute; default to the first change
            selIdx = current.total ? current.groups[0].items[0].index : null;
            render();
            sidebar.emit('count', current.total);
        }).catch((err) => {
            loading = false;
            if (snap !== gen) {
                return;
            }
            rawPromise = null;
            log.error(err);
            current = null;
            releaseRawDiff();
            raw = null;
            selIdx = null;
            render();
            // keep the tab label honest; the count getter now reports null
            sidebar.emit('count', 0);
        });
    }

    Object.assign(sidebar, {
        refresh,
        invalidate: () => {
            releaseRawDiff();
            stale = true;
            current = null;
            raw = null;
            selIdx = null;
            gen++;
        },
        resetForm: () => {
            description.value = '';
            textarea.style.height = '';
            create.disabled = true;
            create.classList.remove('busy');
            create.textContent = 'Create Checkpoint';
        },
        setBusy: (on: boolean) => {
            create.classList.toggle('busy', on);
            create.textContent = on ? 'Creating…' : 'Create Checkpoint';
            // busy blocks re-entrant submits; off restores text/permission gating
            gateCreate();
        },
        focusForm: () => {
            setTimeout(() => description.focus());
        }
    });
    // Object.assign snapshots getter values; live getters must be defined directly
    Object.defineProperty(sidebar, 'count', { get: () => (current ? current.total : null) });

    editor.on('picker:diffManager:closed', (id: string) => {
        if (rawDiffLive && diffId(raw) === id) {
            rawDiffLive = false;
            fileStats.clear();
        }
    });

    return {
        sidebar: sidebar as Container & {
            refresh: (force?: boolean, viaUser?: boolean) => void;
            invalidate: () => void;
            resetForm: () => void;
            setBusy: (on: boolean) => void;
            focusForm: () => void;
            count: number | null;
        },
        summary
    };
};
