import { formatter as f } from '../../common/utils.ts';
import { ENGINE_VERSION } from '../../core/constants.ts';
import { WorkerClient } from '../../core/worker/worker-client.ts';

editor.on('load', () => {
    // create worker
    const workerClient = new WorkerClient(`${config.url.frontend}js/console.worker.js`);
    let workerReady = false;
    let pendingHistory = false;

    workerClient.once('init', () => {
        workerClient.on('prune', (progress) => {
            if (pendingHistory) {
                return;
            }
            if (progress === 1) {
                editor.call('status:text', '');
            } else {
                editor.call('status:text', `Freeing up history space ${Math.floor(progress * 100)}%`);
            }
        });

        workerReady = true;
    });

    workerClient.once('ready', () => {
        // collect legacy logs
        const legacyLogs = [];
        for (const key in localStorage) {
            const match = key.match(/^editor:logs:([^:]+):([^:]+)$/);
            if (match) {
                const projectId = parseInt(match[1], 10);
                const branchId = match[2];
                legacyLogs.push([projectId, branchId, localStorage[key]]);
                localStorage.removeItem(key);
            }
        }

        workerClient.send('init', {
            projectId: config.project.id,
            branchId: config.self.branch.id,
            legacyLogs
        });
    });
    workerClient.start();

    window.onbeforeunload = () => {
        workerClient.stop();
    };

    /**
     * @param {'info' | 'warn' | 'error'} type - Log type
     * @param {string} msg - Log message
     * @param {string | (() => void)} [verboseMsg] - Verbose log message
     * @param {() => void} [onclick] - Click handler
     * @returns {Promise<void>}
     */
    const addLog = (type, msg, verboseMsg, onclick) => {
        if (typeof verboseMsg === 'function') {
            onclick = verboseMsg;
            verboseMsg = undefined;
        }

        const data = {
            ts: Date.now(),
            projectId: config.project.id,
            branchId: config.self.branch.id,
            type,
            msg: verboseMsg || msg
        };

        // if msg specified then add to console UI
        if (msg) {
            editor.call('layout:console:add', data.ts, type, msg, onclick);
        }

        const submit = (resolve) => {
            workerClient.once('log', resolve);
            workerClient.send('log', data);
        };

        // wait for worker to be ready before submitting log
        if (!workerReady) {
            return new Promise((resolve) => {
                workerClient.once('init', () => {
                    submit(resolve);
                });
            });
        }

        return new Promise((resolve) => {
            submit(resolve);
        });
    };
    editor.method('console:log', async (msg, verboseMsg, onclick) => {
        if (!editor.call('permissions:write')) {
            return;
        }
        await addLog('info', msg, verboseMsg, onclick);
    });
    editor.method('console:warn', async (msg, verboseMsg, onclick) => {
        if (!editor.call('permissions:write')) {
            return;
        }
        await addLog('warn', msg, verboseMsg, onclick);
    });
    editor.method('console:error', async (msg, verboseMsg, onclick) => {
        if (!editor.call('permissions:write')) {
            return;
        }
        await addLog('error', msg, verboseMsg, onclick);
        editor.call('status:error', msg);
    });
    editor.method('console:history', () => {
        pendingHistory = true;
        editor.call('status:text', 'Opening console history');
        const submit = (resolve) => {
            workerClient.once('history', (url) => {
                pendingHistory = false;
                editor.call('status:text', '');
                window.open(url, '_blank');
                resolve(url);
            });
            workerClient.send('history', config.project.name, config.self.branch.name);
        };

        // wait for worker to be ready before submitting history request
        if (!workerReady) {
            return new Promise((resolve) => {
                workerClient.once('init', () => {
                    submit(resolve);
                });
            });
        }
        return new Promise((resolve) => {
            submit(resolve);
        });
    });

    // helper methods
    editor.method('console:log:asset', (asset, msg, silent = false) => {
        const [uiMsg, verboseMsg] = f.parse(msg);
        editor.call('console:log', silent ? undefined : uiMsg, verboseMsg, () => {
            editor.call('selector:set', 'asset', [asset]);
        });
    });
    editor.method('console:log:entity', (entity, msg, silent = false) => {
        const [uiMsg, verboseMsg] = f.parse(msg);
        editor.call('console:log', silent ? undefined : uiMsg, verboseMsg, () => {
            editor.call('selector:set', 'entity', [entity]);
        });
    });
    editor.method('console:log:settings', (settings, msg, silent = false) => {
        const [uiMsg, verboseMsg] = f.parse(msg);
        editor.call('console:log', silent ? undefined : uiMsg, verboseMsg, () => {
            editor.call('selector:set', 'editorSettings', [settings]);
        });
    });

    const engineMsg = `Powered by PlayCanvas Engine v${ENGINE_VERSION}`;
    const engineLink = () => {
        window.open(`https://github.com/playcanvas/engine/releases/tag/v${ENGINE_VERSION}`, '_blank');
    };
    if (editor.call('permissions:write')) {
        // log editor start
        editor.call('console:log', undefined, '===== EDITOR START =====');

        // log engine version
        editor.call('console:log', engineMsg, engineLink);
    } else {
        // log engine version
        editor.call('layout:console:add', Date.now(), 'info', engineMsg, engineLink);

        // log read-only mode
        editor.call('layout:console:add', Date.now(), 'info', 'Viewing project in read-only mode');
    }

});
