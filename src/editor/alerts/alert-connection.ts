import { Overlay } from '@playcanvas/pcui';

import { createLog } from '@/common/sentry';
import { formatter as f } from '@/common/utils';
import { config } from '@/editor/config';
import {
    assetRejection,
    isSchemaRejection,
    schemaRejectionMessage,
    sceneRejection
} from '@/editor/realtime/realtime-error';
import type { OpComponent } from '@/editor/realtime/realtime-error';

const log = createLog('<PATH>');

editor.once('load', () => {
    let timeout;
    let viewportError = false;

    const overlay = new Overlay({
        class: 'connection-overlay',
        clickable: false,
        transparent: false,
        hidden: true
    });

    const root = editor.call('layout.root');
    root.append(overlay);

    // icon
    const icon = document.createElement('div');
    icon.classList.add('connection-icon');
    icon.classList.add('error');
    overlay.domContent.appendChild(icon);

    // content
    const content = document.createElement('div');
    content.classList.add('connection-content');
    overlay.domContent.appendChild(content);

    editor.on('realtime:connected', () => {
        clearErrorGrace();

        if (viewportError) {
            return;
        }

        overlay.hidden = true;
    });

    editor.on('realtime:disconnected', () => {
        content.innerHTML = 'You have been disconnected from the server.';
        overlay.hidden = false;
    });

    editor.on('realtime:nextAttempt', (time) => {
        function setText(remaining: number) {
            content.innerHTML = `Disconnected. Reconnecting in ${remaining} seconds...`;
        }

        let before = new Date();

        function renderTime() {
            const now = new Date();
            const elapsed = now.getTime() - before.getTime();
            before = now;
            time -= Math.round(elapsed / 1000);
            if (time < 0) {
                time = 0;
            } else {
                timeout = setTimeout(renderTime, 1000);
            }

            setText(time);
        }

        setText(time);

        timeout = setTimeout(renderTime, 1000);
    });

    editor.on('realtime:connecting', (attempt) => {
        clearErrorGrace();

        if (viewportError) {
            return;
        }

        overlay.hidden = true;
        clearTimeout(timeout);
    });

    editor.on('realtime:cannotConnect', () => {
        overlay.hidden = false;
        clearTimeout(timeout);
        content.innerHTML = 'Cannot connect to the server. Please try again later.';
    });

    const ERROR_GRACE_MS = 3000;
    let errorGraceTimeout: ReturnType<typeof setTimeout> | null = null;

    const clearErrorGrace = () => {
        if (errorGraceTimeout) {
            clearTimeout(errorGraceTimeout);
            errorGraceTimeout = null;
        }
    };

    const onError = function (err: unknown) {
        console.warn('realtime error:', err);

        // debounce — only one grace period at a time
        if (errorGraceTimeout) {
            return;
        }

        errorGraceTimeout = setTimeout(() => {
            errorGraceTimeout = null;

            // if connection recovered during grace period, skip the fatal overlay
            const conn = editor.call('realtime:connection');
            if (conn?.state === 'connected') {
                console.warn('realtime error suppressed — connection recovered during grace period');
                return;
            }

            content.innerHTML = 'Error while saving changes. Please refresh the editor.';
            overlay.hidden = false;
        }, ERROR_GRACE_MS);
    };

    editor.on('viewport:error', (err) => {
        viewportError = true;
        console.error(err);
        console.trace();
        content.innerHTML =
            'Failed creating WebGL Context.<br />Please check <a href="http://webglreport.com/" target="_blank">WebGL Report</a> and report to <a href="http://forum.playcanvas.com/" target="_blank">Forum</a>.';
        overlay.hidden = false;
    });

    // a schema-validation rejection reverts the op but leaves the connection healthy, so the
    // connection-loss handler would suppress it during its grace period — surface it instead
    const onRealtimeError = (err: unknown) => {
        if (isSchemaRejection(err)) {
            console.error('realtime change rejected and reverted:', err);
            editor.call('status:error', schemaRejectionMessage(err));
            return;
        }
        onError(err);
    };

    // the op pinpoints the refused change, so log it to the editor console rather than the status bar
    const warnRejection = (err: unknown, op: OpComponent[], msg: string, select: () => void) => {
        const [uiMsg, verboseMsg] = f.parse(msg);
        console.warn('realtime change rejected and reverted:', err, op);
        editor.call('console:warn', uiMsg, verboseMsg, select);
    };

    editor.on('realtime:error', onRealtimeError);
    editor.on('realtime:scene:error', (err, op?: OpComponent[]) => {
        // this should be ok...
        if (/Exceeded max submit retries/.test(err)) {
            console.info(err);
            return;
        }

        if (op?.length && isSchemaRejection(err)) {
            const { entity, msg } = sceneRejection(err, op, (id) => editor.call('entities:get', id)?.get('name'));
            warnRejection(err, op, msg, () => {
                const target = entity && editor.call('entities:get', entity);
                if (target) {
                    editor.call('selector:set', 'entity', [target]);
                }
            });
            return;
        }
        onRealtimeError(err);
    });
    editor.on('realtime:userdata:error', (err) => {
        log.error(err);
    });
    editor.on('realtime:assets:error', (err, op?: OpComponent[], uniqueId?: number) => {
        if (op?.length && uniqueId !== undefined && isSchemaRejection(err)) {
            const name = editor.call('assets:getUnique', uniqueId)?.get('name');
            warnRejection(err, op, assetRejection(err, op, uniqueId, name), () => {
                const target = editor.call('assets:getUnique', uniqueId);
                if (target) {
                    editor.call('selector:set', 'asset', [target]);
                }
            });
            return;
        }
        onRealtimeError(err);
    });

    editor.on('messenger:scene.delete', (data) => {
        if (data.scene.branchId !== config.self.branch.id) {
            return;
        }

        if (config.scene.id && data.scene.id === parseInt(config.scene.id, 10)) {
            content.innerHTML = 'This scene has been deleted.';
            overlay.hidden = false;
        }
    });

    editor.on('scene:unload', () => {
        clearErrorGrace();

        if (viewportError) {
            return;
        }

        overlay.hidden = true;
    });
});
