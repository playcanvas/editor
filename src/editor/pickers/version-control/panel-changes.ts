import { Container, TextAreaInput } from '@playcanvas/pcui';

import { config } from '@/editor/config';

import { hashChip, summarizeDiff, typeLabel, type DiffSummary } from './vc-helpers';
import { diffCreate } from '../../messenger/jobs';

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

    const list = document.createElement('div');
    list.classList.add('vc-changes-list');
    sidebar.dom.appendChild(list);

    const form = document.createElement('div');
    form.classList.add('vc-checkpoint-form');
    sidebar.dom.appendChild(form);

    // native placeholder; pcui's [placeholder] renders an out-of-place chip
    const description = new TextAreaInput({ blurOnEnter: false, keyChange: true, renderChanges: false });
    (description.dom.querySelector('textarea') as HTMLTextAreaElement).placeholder = 'Describe this checkpoint…';
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

    // field-level rows for one conflict, straight from the loaded diff
    const renderFieldDiff = (conflict: any) => {
        const wrap = document.createElement('div');
        wrap.classList.add('vc-field-diff');
        for (const entry of conflict.data ?? []) {
            const row = document.createElement('div');
            row.classList.add('vc-field-row');
            const path = document.createElement('span');
            path.classList.add('path');
            const vals = document.createElement('span');
            vals.classList.add('vals');

            if (entry.srcFilename || entry.dstFilename) {
                // text asset contents; too heavy to inline — point at the full diff
                path.textContent = 'file contents';
                vals.textContent = 'changed — use Open Full Diff to view';
            } else if (!entry.path) {
                // whole-item add/delete
                path.textContent = conflict.itemName;
                vals.textContent = entry.missingInDst ? 'added since the checkpoint' :
                    entry.missingInSrc ? 'deleted since the checkpoint' : 'changed';
            } else {
                path.textContent = entry.path;
                path.title = entry.path;
                // src is the working state (new), dst is the checkpoint (old)
                if (entry.missingInDst) {
                    const nv = document.createElement('span');
                    nv.classList.add('new');
                    nv.textContent = `+ ${fmtVal(entry.srcValue)}`;
                    vals.appendChild(nv);
                } else if (entry.missingInSrc) {
                    const ov = document.createElement('span');
                    ov.classList.add('old');
                    ov.textContent = fmtVal(entry.dstValue);
                    vals.appendChild(ov);
                } else {
                    const ov = document.createElement('span');
                    ov.classList.add('old');
                    ov.textContent = fmtVal(entry.dstValue);
                    vals.appendChild(ov);
                    vals.appendChild(document.createTextNode(' → '));
                    const nv = document.createElement('span');
                    nv.classList.add('new');
                    nv.textContent = fmtVal(entry.srcValue);
                    vals.appendChild(nv);
                }
            }
            row.appendChild(path);
            row.appendChild(vals);
            wrap.appendChild(row);
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

        const refreshBtn = document.createElement('button');
        refreshBtn.type = 'button';
        refreshBtn.classList.add('vc-button');
        refreshBtn.textContent = '↻ Refresh';
        refreshBtn.disabled = loading;
        refreshBtn.addEventListener('click', () => refresh(true));
        side.appendChild(refreshBtn);

        if (current && current.total) {
            const openBtn = document.createElement('button');
            openBtn.type = 'button';
            openBtn.classList.add('vc-button');
            openBtn.textContent = 'Open Full Diff';
            openBtn.addEventListener('click', () => summary.emit('openDiff', raw));
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
        }

        summary.dom.appendChild(card);
    };

    const render = () => {
        renderList();
        renderSummary();
    };

    function refresh(force?: boolean) {
        const branch = config.self.branch;
        if (loading || (!stale && !force)) {
            render();
            return;
        }
        // no checkpoint to diff against yet
        if (!branch.latestCheckpointId) {
            current = { total: 0, groups: [] };
            raw = null;
            selIdx = null;
            stale = false;
            render();
            sidebar.emit('count', 0);
            return;
        }
        loading = true;
        const snap = ++gen;
        render();
        diffCreate({
            srcBranchId: branch.id,
            srcCheckpointId: null,
            dstBranchId: branch.id,
            dstCheckpointId: branch.latestCheckpointId
        }).then((diff: any) => {
            // single-flight: clear loading even for superseded responses or refresh deadlocks
            loading = false;
            if (snap !== gen) {
                return;
            }
            stale = false;
            raw = diff ?? {};
            current = summarizeDiff(raw);
            // indices shift on every recompute; default to the first change
            selIdx = current.total ? current.groups[0].items[0].index : null;
            render();
            sidebar.emit('count', current.total);
        }).catch((err) => {
            loading = false;
            if (snap !== gen) {
                return;
            }
            log.error(err);
            current = null;
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
            stale = true;
            current = null;
            raw = null;
            selIdx = null;
            gen++;
        },
        resetForm: () => {
            description.value = '';
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

    return {
        sidebar: sidebar as Container & {
            refresh: (force?: boolean) => void;
            invalidate: () => void;
            resetForm: () => void;
            setBusy: (on: boolean) => void;
            focusForm: () => void;
            count: number | null;
        },
        summary
    };
};
