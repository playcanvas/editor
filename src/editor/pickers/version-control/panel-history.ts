import { Container } from '@playcanvas/pcui';

import { handleCallback } from '@/common/utils';
import { config } from '@/editor/config';

import { formatDayGroup, formatRelativeDate, hashChip } from './vc-helpers';

const PAGE_SIZE = 50;
const MAX_COMPARE = 2;

export const createHistoryPanel = () => {
    const panel = new Container({ class: 'vc-history' });

    let branch: any = null;
    let checkpoints: any[] = null;
    let skip: string = null;
    let hasMore = false;
    let loading = false;
    let selectedId: string = null;
    let compareMode = false;
    let compareSlots: { branch: any; checkpoint: any | null }[] = [];
    // request token: set to the ajax handle for the current in-flight load; set to null on
    // branch-switch so the callback of any superseded request is discarded
    let request: any = null;
    const cache: Record<string, { result: any[]; hasMore: boolean }> = {};

    const isSlotted = (checkpoint: any | null) => {
        return compareSlots.some(s => (s.checkpoint ? s.checkpoint.id === checkpoint?.id : !checkpoint && s.branch.id === branch.id));
    };

    const toggleSlot = (checkpoint: any | null) => {
        if (isSlotted(checkpoint)) {
            compareSlots = compareSlots.filter(s => !(s.checkpoint ? s.checkpoint.id === checkpoint?.id : !checkpoint && s.branch.id === branch.id));
        } else if (compareSlots.length < MAX_COMPARE) {
            compareSlots.push({ branch, checkpoint });
        } else {
            // row is at capacity and not selected; nothing changed
            return;
        }
        render();
        panel.emit('compare:change', compareSlots.slice());
    };

    const setStatus = (text: string) => {
        const el = document.createElement('div');
        el.classList.add('vc-list-status');
        el.textContent = text;
        panel.dom.appendChild(el);
    };

    const skeleton = () => {
        const wrap = document.createElement('div');
        wrap.classList.add('vc-skeleton');
        for (let i = 0; i < 3; i++) {
            const row = document.createElement('div');
            row.classList.add('skeleton-row');
            row.innerHTML = '<span class="bone dot"></span><span class="bone line"></span>';
            wrap.appendChild(row);
        }
        panel.dom.appendChild(wrap);
    };

    const createRow = (checkpoint: any | null, label?: string) => {
        const row = document.createElement('div');
        row.classList.add('vc-row');
        if (checkpoint) {
            row.id = `checkpoint-${checkpoint.id}`;
        }

        if (compareMode) {
            const check = document.createElement('input');
            check.type = 'checkbox';
            check.classList.add('check');
            check.checked = isSlotted(checkpoint);
            if (!check.checked && compareSlots.length >= MAX_COMPARE) {
                row.classList.add('disabled');
            }
            row.appendChild(check);
        } else {
            const avatar = document.createElement('img');
            avatar.classList.add('avatar');
            avatar.alt = '';
            avatar.src = checkpoint ?
                `/api/users/${checkpoint.user.id}/thumbnail?size=28` :
                `${config.url.static}/platform/images/common/blank_project.png`;
            row.appendChild(avatar);
        }

        const body = document.createElement('div');
        body.classList.add('body');
        const desc = document.createElement('div');
        desc.classList.add('desc');
        desc.textContent = label ?? checkpoint.description.split('\n')[0];
        body.appendChild(desc);
        const sub = document.createElement('div');
        sub.classList.add('sub');
        sub.textContent = checkpoint ?
            `${checkpoint.user.fullName || 'Unknown'} · ${formatRelativeDate(checkpoint.createdAt)}` :
            'uncheckpointed changes';
        body.appendChild(sub);
        row.appendChild(body);

        if (checkpoint) {
            row.appendChild(hashChip(checkpoint.id));
        }

        if (checkpoint && checkpoint.id === selectedId && !compareMode) {
            row.classList.add('selected');
        }

        row.addEventListener('click', () => {
            if (compareMode) {
                toggleSlot(checkpoint);
            } else if (checkpoint) {
                selectedId = checkpoint.id;
                render();
                panel.emit('select', checkpoint);
            }
        });

        return row;
    };

    const render = () => {
        const scrollTop = panel.dom.scrollTop;
        panel.dom.innerHTML = '';

        if (loading && !checkpoints) {
            skeleton();
            return;
        }
        if (!checkpoints) {
            return;
        }
        if (!checkpoints.length) {
            setStatus('No checkpoints yet');
            return;
        }

        // working-state row: compare mode + current open branch only
        if (compareMode && branch && !branch.closed && branch.id === config.self.branch.id) {
            const head = document.createElement('div');
            head.classList.add('vc-day');
            head.textContent = 'Current state';
            panel.dom.appendChild(head);
            panel.dom.appendChild(createRow(null, `Working state of ${branch.name}`));
        }

        let lastDay: string = null;
        for (const c of checkpoints) {
            const day = formatDayGroup(c.createdAt);
            if (day !== lastDay) {
                lastDay = day;
                const head = document.createElement('div');
                head.classList.add('vc-day');
                head.textContent = day;
                panel.dom.appendChild(head);
            }
            panel.dom.appendChild(createRow(c));
        }

        if (loading) {
            setStatus('Loading…');
        }
        panel.dom.scrollTop = scrollTop;
    };

    const load = (more: boolean) => {
        if (loading || !branch) {
            return;
        }
        loading = true;
        render();

        // capture the current branch id so the callback can verify it against `branch`
        const branchId = branch.id;
        const req = handleCallback(editor.api.globals.rest.branches.branchCheckpoints({
            branchId,
            limit: PAGE_SIZE,
            skip: more ? skip as unknown as number : undefined
        }), (err: any, data: any) => {
            // discard stale response: either a newer branch-switch or a newer load replaced `request`
            if (req !== request) {
                return;
            }
            request = null;
            loading = false;
            if (err) {
                log.error(err);
                render();
                return;
            }
            checkpoints = more && checkpoints ? checkpoints.concat(data.result) : data.result;
            hasMore = data.pagination.hasMore;
            skip = checkpoints.length ? checkpoints[checkpoints.length - 1].id : null;
            cache[branchId] = { result: checkpoints, hasMore };
            render();
        });
        // assign after creation so the callback comparison is always consistent
        request = req;
    };

    // infinite scroll
    panel.dom.addEventListener('scroll', () => {
        if (hasMore && !loading && panel.dom.scrollTop + panel.dom.clientHeight >= panel.dom.scrollHeight - 80) {
            load(true);
        }
    });

    Object.assign(panel, {
        setBranch: (b: any) => {
            branch = b;
            // invalidate any in-flight request before starting a new load;
            // the invalidator owns resetting `loading` or load() would deadlock
            request = null;
            loading = false;
            selectedId = null;
            panel.emit('select', null);
            if (b && cache[b.id]) {
                checkpoints = cache[b.id].result;
                hasMore = cache[b.id].hasMore;
                skip = checkpoints.length ? checkpoints[checkpoints.length - 1].id : null;
                render();
                load(false); // background refresh; request token set inside load()
            } else {
                checkpoints = null;
                load(false);
            }
        },
        reload: () => load(false),
        prependCheckpoint: (c: any) => {
            if (!checkpoints) {
                return;
            }
            // cancel any in-flight refresh so its response cannot drop the new row
            request = null;
            loading = false;
            checkpoints.unshift(c);
            render();
            panel.dom.scrollTop = 0;
        },
        setCompareMode: (on: boolean) => {
            compareMode = on;
            compareSlots = [];
            render();
            panel.emit('compare:change', []);
        },
        clearCompare: () => {
            compareSlots = [];
            render();
            panel.emit('compare:change', []);
        }
    });
    // Object.assign snapshots getter values; live getters must be defined directly
    Object.defineProperties(panel, {
        checkpoints: { get: () => checkpoints },
        branch: { get: () => branch }
    });

    return panel as Container & {
        setBranch: (b: any) => void;
        reload: () => void;
        prependCheckpoint: (c: any) => void;
        setCompareMode: (on: boolean) => void;
        clearCompare: () => void;
        checkpoints: any[];
        branch: any;
    };
};
