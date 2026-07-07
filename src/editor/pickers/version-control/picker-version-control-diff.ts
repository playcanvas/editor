import { handleCallback } from '@/common/utils';
import { config } from '@/editor/config';

import { createVcDiffView } from './vc-diff-view';
import { summarizeDiff, hashChip, DIFF_SLOW_HINT_MS, DIFF_SLOW_HINT_TEXT } from './vc-helpers';

editor.once('load', () => {
    if (config.project.settings.useLegacyScripts) {
        return;
    }

    const view = createVcDiffView({
        title: 'Diff',
        fullscreenKey: 'editor:picker:vcdiff:fullscreen',
        sidebarKey: 'editor:vcdiff:sidebar:width',
        renderMeta: (meta, data) => {
            const summary = summarizeDiff(data ?? {});
            const base = data?.destinationCheckpointId || data?.dstCheckpointId;
            meta.textContent = `${summary.total} change${summary.total === 1 ? '' : 's'}`;
            if (typeof base === 'string') {
                meta.appendChild(document.createTextNode(' · vs '));
                meta.appendChild(hashChip(base));
            }
        }
    });

    const diffId = (diff: any) => diff?.id ?? diff?.merge_id;
    const isRetainedDiff = (id: string) => !!id && !!editor.call('picker:versioncontrol:hasRetainedDiff', id);

    let loadToken = 0;
    let current: any = null;

    let closingViaBack = false;
    const onPopState = () => {
        if (!view.overlay.hidden) {
            closingViaBack = true;
            view.overlay.hidden = true;
        }
    };
    const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !view.overlay.hidden) {
            e.stopPropagation();
            view.overlay.hidden = true;
        }
    };

    view.overlay.on('show', () => {
        editor.emit('picker:open', 'version-control-diff');
        window.addEventListener('popstate', onPopState);
        window.addEventListener('keydown', onKey, true);
        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    view.overlay.on('hide', () => {
        window.removeEventListener('popstate', onPopState);
        window.removeEventListener('keydown', onKey, true);
        const id = diffId(current);
        if (typeof id === 'string' && !isRetainedDiff(id)) {
            editor.emit('picker:diffManager:closed', id);
            handleCallback(editor.api.globals.rest.merge.mergeDelete({ mergeId: id }), () => {
                // intentionally empty
            });
        }
        if (!closingViaBack && !editor.call('picker:isOpen', 'project')) {
            editor.call('picker:versioncontrol');
        }
        if (!editor.call('vcgraph:isHidden')) {
            editor.call('vcgraph:moveToForeground');
        }
        closingViaBack = false;
        current = null;
        view.cleanup();
        editor.emit('picker:close', 'version-control-diff');
        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', true);
        }
    });

    editor.on('viewport:hover', (state: boolean) => {
        if (state && !view.overlay.hidden) {
            setTimeout(() => editor.emit('viewport:hover', false), 0);
        }
    });

    const setDiff = (diff: any) => {
        current = diff;
        view.setData(diff);
    };

    editor.method('picker:versioncontrol:diffPicker', (input: any) => {
        const token = ++loadToken;
        current = null;
        view.overlay.hidden = false;
        if (input && typeof input.then === 'function') {
            view.renderLoading();
            const slowHint = setTimeout(() => {
                if (token === loadToken) {
                    const hint = document.createElement('div');
                    hint.classList.add('vc-diff-slow-hint');
                    hint.textContent = DIFF_SLOW_HINT_TEXT;
                    view.main.insertBefore(hint, view.main.firstChild);
                }
            }, DIFF_SLOW_HINT_MS);
            input
                .then((diff: any) => {
                    clearTimeout(slowHint);
                    if (token === loadToken) {
                        setDiff(diff);
                    }
                })
                .catch((err: any) => {
                    clearTimeout(slowHint);
                    if (token === loadToken) {
                        view.clearSidebar();
                        view.renderNotice(`Could not load diff: ${err instanceof Error ? err.message : err}`);
                    }
                });
        } else {
            setDiff(input);
        }
    });
});
