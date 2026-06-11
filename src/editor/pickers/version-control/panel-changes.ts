import { Container, TextAreaInput } from '@playcanvas/pcui';

import { config } from '@/editor/config';

import { hashChip, summarizeDiff, type DiffSummary } from './vc-helpers';
import { diffCreate } from '../../messenger/jobs';

export const createChangesPanel = () => {
    const sidebar = new Container({ class: 'vc-changes' });
    const summary = new Container({ class: 'vc-changes-summary' });

    let current: DiffSummary = null;
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

    const renderList = () => {
        list.innerHTML = '';
        if (loading) {
            const wrap = document.createElement('div');
            wrap.classList.add('vc-skeleton');
            for (let i = 0; i < 3; i++) {
                const row = document.createElement('div');
                row.classList.add('skeleton-row');
                row.innerHTML = '<span class="bone line"></span>';
                wrap.appendChild(row);
            }
            list.appendChild(wrap);
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
            head.textContent = `${g.type}s · ${g.items.length}`;
            list.appendChild(head);
            for (const item of g.items) {
                const row = document.createElement('div');
                row.classList.add('vc-item');
                const name = document.createElement('span');
                name.classList.add('name');
                name.textContent = item.name;
                name.title = item.name;
                row.appendChild(name);
                const badge = document.createElement('span');
                badge.classList.add('status', item.status);
                badge.textContent = item.status;
                row.appendChild(badge);
                list.appendChild(row);
            }
        }
    };

    const renderSummary = () => {
        summary.dom.innerHTML = '';
        const card = document.createElement('div');
        card.classList.add('vc-card');
        const branch = config.self.branch;

        const h = document.createElement('h3');
        h.textContent = loading ? 'Computing changes…' :
            current ? `${current.total} change${current.total === 1 ? '' : 's'} since your last checkpoint` : 'Changes';
        card.appendChild(h);

        const meta = document.createElement('div');
        meta.classList.add('vc-meta');
        meta.textContent = `Working state of ${branch.name}`;
        if (branch.latestCheckpointId) {
            meta.append(' vs checkpoint ', hashChip(branch.latestCheckpointId));
        }
        card.appendChild(meta);

        if (current) {
            for (const g of current.groups) {
                const pill = document.createElement('span');
                pill.classList.add('vc-pill');
                pill.textContent = `${g.items.length} ${g.type}${g.items.length === 1 ? '' : 's'}`;
                card.appendChild(pill);
            }
        }

        const actions = document.createElement('div');
        actions.classList.add('vc-detail-actions');
        card.appendChild(actions);

        const refreshBtn = document.createElement('button');
        refreshBtn.type = 'button';
        refreshBtn.classList.add('vc-button');
        refreshBtn.textContent = '↻ Refresh';
        refreshBtn.disabled = loading;
        refreshBtn.addEventListener('click', () => refresh(true));
        actions.appendChild(refreshBtn);

        if (current && current.total) {
            const openBtn = document.createElement('button');
            openBtn.type = 'button';
            openBtn.classList.add('vc-button');
            openBtn.textContent = 'Open Full Diff';
            openBtn.addEventListener('click', () => summary.emit('openDiff'));
            actions.appendChild(openBtn);
        }

        if (branch.latestCheckpointId) {
            const sub = document.createElement('div');
            sub.classList.add('vc-meta');
            sub.style.marginTop = '8px';
            sub.textContent = 'Tip: ⌘/Ctrl+Enter in the description field creates the checkpoint.';
            card.appendChild(sub);
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
            current = summarizeDiff(diff ?? {});
            render();
            sidebar.emit('count', current.total);
        }).catch((err) => {
            loading = false;
            if (snap !== gen) {
                return;
            }
            log.error(err);
            current = null;
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
