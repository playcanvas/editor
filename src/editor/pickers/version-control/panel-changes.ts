import { Container, TextAreaInput } from '@playcanvas/pcui';

import { config } from '@/editor/config';

import { diffListEl, hashChip, summarizeDiff, type DiffSummary } from './vc-helpers';
import { diffCreate } from '../../messenger/jobs';

export const createChangesPanel = () => {
    const sidebar = new Container({ class: 'vc-changes' });
    const summary = new Container({ class: 'vc-changes-summary' });

    let current: DiffSummary = null;
    // raw diff matching `current`, reused by open-full-diff to skip recomputing
    let raw: any = null;
    let loading = false;
    let stale = true;
    // generation counter: incremented by invalidate() and at the start of each fetch;
    // .then/.catch discard results when the generation has moved on (stale-response guard)
    let gen = 0;

    // the change list lives in the summary pane; the sidebar is the composer
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

        // change preview, mirroring the checkpoint detail card
        if (loading) {
            card.insertAdjacentHTML('beforeend', `<div class="vc-diff-list"><div class="vc-skeleton">${'<div class="skeleton-row"><span class="bone line"></span></div>'.repeat(3)}</div></div>`);
        } else if (current && current.total) {
            card.appendChild(diffListEl(current));
        } else {
            const none = document.createElement('div');
            none.classList.add('vc-meta');
            none.textContent = current ? 'No changes since your last checkpoint' : 'Changes not computed yet';
            card.appendChild(none);
        }

        summary.dom.appendChild(card);
    };

    const render = () => {
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
