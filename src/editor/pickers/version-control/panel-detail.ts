import { Container } from '@playcanvas/pcui';

import { diffListEl, hashChip, summarizeDiff, userThumbnail } from './vc-helpers';
import { diffCreate } from '../../messenger/jobs';

type DiffCache = {
    diff?: any;
    summary?: ReturnType<typeof summarizeDiff>;
    promise?: Promise<any>;
};

export const createDetailPanel = () => {
    const panel = new Container({ class: 'vc-detail' });

    // raw diff kept alongside the summary so open-full-diff can skip recomputing
    const diffCache: Record<string, DiffCache> = {};
    let renderToken = 0;

    const diffId = (diff: any) => diff?.id ?? diff?.merge_id;

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
        const head = document.createElement('div');
        head.classList.add('vc-card-head');
        head.innerHTML = '<h3>Changes in this checkpoint</h3>';
        card.appendChild(head);

        if (!previous) {
            const note = document.createElement('div');
            note.classList.add('vc-meta');
            note.textContent = 'This is the oldest loaded checkpoint — scroll the history to load older ones for a comparison baseline.';
            card.appendChild(note);
            return card;
        }

        const side = document.createElement('div');
        side.classList.add('side');
        head.appendChild(side);

        const meta = document.createElement('div');
        meta.classList.add('vc-meta');
        meta.textContent = 'vs ';
        meta.appendChild(hashChip(previous.id));
        side.appendChild(meta);

        const key = `${previous.id}:${checkpoint.id}`;

        const loadDiff = () => {
            if (diffCache[key]?.diff || diffCache[key]?.promise) {
                return diffCache[key];
            }

            const entry: DiffCache = { summary: diffCache[key]?.summary };
            entry.promise = diffCreate({
                srcBranchId: branchId,
                srcCheckpointId: checkpoint.id,
                dstBranchId: branchId,
                dstCheckpointId: previous.id
            }).then((diff: any) => {
                const data = diff ?? {};
                entry.diff = data;
                entry.summary = summarizeDiff(data);
                delete entry.promise;
                return data;
            }).catch((err) => {
                delete diffCache[key];
                return Promise.reject(err);
            });
            diffCache[key] = entry;
            return entry;
        };

        // available immediately — reuses the summary request when it is still in flight
        const link = document.createElement('button');
        link.type = 'button';
        link.classList.add('vc-button');
        link.textContent = 'Open Full Diff';
        link.addEventListener('click', () => {
            const cached = loadDiff();
            panel.emit('openDiff', checkpoint, previous, cached.diff, cached.promise);
        });
        side.appendChild(link);

        const body = document.createElement('div');
        card.appendChild(body);

        const fill = (summary: ReturnType<typeof summarizeDiff>) => {
            body.innerHTML = '';
            if (!summary.total) {
                const none = document.createElement('div');
                none.classList.add('vc-meta');
                none.textContent = 'No changes vs previous checkpoint ';
                none.appendChild(hashChip(previous.id));
                body.appendChild(none);
                link.hidden = true;
                return;
            }
            meta.textContent = `${summary.total} change${summary.total === 1 ? '' : 's'} · vs `;
            meta.appendChild(hashChip(previous.id));
            body.appendChild(diffListEl(summary));
        };

        const cached = diffCache[key];
        if (cached?.summary) {
            fill(cached.summary);
        } else {
            body.innerHTML = `<div class="vc-diff-list"><div class="vc-skeleton">${'<div class="skeleton-row"><span class="bone line"></span></div>'.repeat(3)}</div></div>`;
            const pending = loadDiff().promise;
            if (!pending) {
                return card;
            }
            pending.then(() => {
                if (token !== renderToken) {
                    return;
                }
                const next = diffCache[key]?.summary;
                if (next) {
                    fill(next);
                }
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
            userThumbnail(checkpoint.user.id, 40).then((src) => {
                if (src) {
                    avatar.src = src;
                }
            });
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
            meta.textContent = `${checkpoint.user.fullName || 'Unknown'} · ${created.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} · `;
            meta.appendChild(hashChip(checkpoint.id));
            // github-style icon button matching the builds publish dialog
            const copy = document.createElement('button');
            copy.type = 'button';
            copy.classList.add('copy-button');
            copy.title = 'Copy checkpoint id';
            copy.setAttribute('aria-label', 'Copy checkpoint id');
            copy.addEventListener('click', () => {
                navigator.clipboard.writeText(checkpoint.id).then(() => {
                    copy.classList.add('copied');
                    setTimeout(() => copy.classList.remove('copied'), 1500);
                }, () => {});
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
            if (ctx.isCurrentBranch && ctx.canWrite) {
                actions.appendChild(button('Hard Reset…', 'danger', () => panel.emit('hardReset', checkpoint)));
            }

            panel.dom.appendChild(hero);
            panel.dom.appendChild(renderChangesCard(checkpoint, previous, ctx.branchId, token));
        }
    });

    editor.on('picker:diffManager:closed', (id: string) => {
        for (const key in diffCache) {
            if (diffId(diffCache[key].diff) === id) {
                delete diffCache[key].diff;
                delete diffCache[key].promise;
            }
        }
    });

    clear();

    return panel as Container & {
        clear: () => void;
        render: (checkpoint: any, previous: any, ctx: { branchId: string; isCurrentBranch: boolean; canWrite: boolean }) => void;
    };
};
