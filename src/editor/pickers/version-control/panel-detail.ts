import { Container } from '@playcanvas/pcui';

import { summarizeDiff } from './vc-helpers';
import { diffCreate } from '../../messenger/jobs';

export const createDetailPanel = () => {
    const panel = new Container({ class: 'vc-detail' });

    const diffCache: Record<string, ReturnType<typeof summarizeDiff>> = {};
    let renderToken = 0;

    const clear = () => {
        renderToken++;
        panel.dom.innerHTML = '';
        const empty = document.createElement('div');
        empty.classList.add('vc-empty-detail');
        empty.textContent = 'Select a checkpoint to see its details';
        panel.dom.appendChild(empty);
    };

    const button = (label: string, cls: string | null, onClick: () => void) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.classList.add('vc-button');
        if (cls) {
            b.classList.add(cls);
        }
        b.textContent = label;
        b.addEventListener('click', onClick);
        return b;
    };

    const renderChangesCard = (checkpoint: any, previous: any, branchId: string, token: number) => {
        const card = document.createElement('div');
        card.classList.add('vc-card');
        card.innerHTML = '<h3>Changes in this checkpoint</h3>';

        const meta = document.createElement('div');
        meta.classList.add('vc-meta');
        card.appendChild(meta);

        if (!previous) {
            meta.textContent = 'This is the oldest loaded checkpoint — scroll the history to load older ones for a comparison baseline.';
            return card;
        }
        meta.textContent = `vs previous checkpoint ${previous.id.substring(0, 7)}`;

        const body = document.createElement('div');
        card.appendChild(body);

        const key = `${previous.id}:${checkpoint.id}`;
        const fill = (summary: ReturnType<typeof summarizeDiff>) => {
            body.innerHTML = '';
            if (!summary.total) {
                const none = document.createElement('div');
                none.classList.add('vc-meta');
                none.textContent = 'No changes';
                body.appendChild(none);
            } else {
                for (const g of summary.groups) {
                    const pill = document.createElement('span');
                    pill.classList.add('vc-pill');
                    pill.textContent = `${g.items.length} ${g.type}${g.items.length === 1 ? '' : 's'}`;
                    body.appendChild(pill);
                }
            }
            const open = document.createElement('div');
            open.style.marginTop = '10px';
            const link = document.createElement('button');
            link.type = 'button';
            link.classList.add('vc-link');
            link.textContent = 'Open full diff →';
            link.addEventListener('click', () => panel.emit('openDiff', checkpoint, previous));
            open.appendChild(link);
            body.appendChild(open);
        };

        if (diffCache[key]) {
            fill(diffCache[key]);
        } else {
            body.innerHTML = '<div class="vc-meta">Computing changes…</div>';
            diffCreate({
                srcBranchId: branchId,
                srcCheckpointId: checkpoint.id,
                dstBranchId: branchId,
                dstCheckpointId: previous.id
            }).then((diff: any) => {
                if (token !== renderToken) {
                    return;
                }
                diffCache[key] = summarizeDiff(diff ?? {});
                fill(diffCache[key]);
            }).catch(() => {
                if (token !== renderToken) {
                    return;
                }
                body.innerHTML = '<div class="vc-meta">Failed to compute changes</div>';
            });
        }

        return card;
    };

    Object.assign(panel, {
        clear,
        render: (checkpoint: any, previous: any, ctx: { branchId: string; isCurrentBranch: boolean; canWrite: boolean }) => {
            const token = ++renderToken;
            panel.dom.innerHTML = '';

            const hero = document.createElement('div');
            hero.classList.add('vc-card');

            const heroInner = document.createElement('div');
            heroInner.classList.add('vc-detail-hero');
            hero.appendChild(heroInner);

            const avatar = document.createElement('img');
            avatar.classList.add('avatar');
            avatar.alt = '';
            avatar.src = `/api/users/${checkpoint.user.id}/thumbnail?size=40`;
            heroInner.appendChild(avatar);

            const body = document.createElement('div');
            body.classList.add('body');
            heroInner.appendChild(body);

            const title = document.createElement('div');
            title.classList.add('title');
            title.textContent = checkpoint.description;
            body.appendChild(title);

            const meta = document.createElement('div');
            meta.classList.add('vc-meta');
            const created = new Date(checkpoint.createdAt);
            meta.textContent = `${checkpoint.user.fullName || 'Unknown'} · ${created.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} · ${checkpoint.id.substring(0, 7)}`;
            const copy = document.createElement('button');
            copy.type = 'button';
            copy.classList.add('copy-id');
            copy.textContent = 'copy id';
            copy.addEventListener('click', () => {
                navigator.clipboard?.writeText(checkpoint.id);
                copy.textContent = 'copied';
                setTimeout(() => {
                    copy.textContent = 'copy id';
                }, 1200);
            });
            meta.appendChild(copy);
            body.appendChild(meta);

            const actions = document.createElement('div');
            actions.classList.add('vc-detail-actions');
            hero.appendChild(actions);

            if (ctx.isCurrentBranch && ctx.canWrite) {
                actions.appendChild(button('Restore', null, () => panel.emit('restore', checkpoint)));
            }
            if (ctx.canWrite) {
                actions.appendChild(button('New Branch', null, () => panel.emit('newBranch', checkpoint)));
            }
            if (previous) {
                actions.appendChild(button('Compare with previous', null, () => panel.emit('comparePrevious', checkpoint, previous)));
            }
            if (ctx.isCurrentBranch && ctx.canWrite) {
                actions.appendChild(button('Hard Reset…', 'danger', () => panel.emit('hardReset', checkpoint)));
            }

            panel.dom.appendChild(hero);
            panel.dom.appendChild(renderChangesCard(checkpoint, previous, ctx.branchId, token));
        }
    });

    clear();

    return panel as Container & {
        clear: () => void;
        render: (checkpoint: any, previous: any, ctx: { branchId: string; isCurrentBranch: boolean; canWrite: boolean }) => void;
    };
};
