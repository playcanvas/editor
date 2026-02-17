import { Dexie } from 'dexie';

import { WorkerServer } from '@/core/worker/worker-server';

const RECORD_LIMIT = 5e4; // Performance degradation starts at 50k records
const RECORD_LIMIT_TOLERANCE = 1e3; // Prune logs when we exceed 50k + 1k records
const RECORD_CHUNK_SIZE = 1e3; // Add logs in chunks of 1k
const RECORD_MAX_QUEUE_LENGTH = 1e4; // Maximum number of logs to queue before dropping logs

type Log = {
    /** Auto increment */
    id?: number;
    /** Project id */
    projectId: number;
    /** Branch id */
    branchId: string;
    /** Timestamp */
    ts: number;
    /** Log type */
    type: 'info' | 'warn' | 'error';
    /** Message */
    msg: string;
};

const workerServer = new WorkerServer(self);
workerServer.on('init', async ({ projectId, branchId, legacyLogs }) => {

    const db = new Dexie('editor-console') as Dexie & { logs: Dexie.Table<Log, number> };
    db.version(1).stores({ logs: '++id' });

    // get log count
    let count = await db.logs.count();

    // migrate old log format
    const bulk = [];
    for (const [projectId, branchId, str] of legacyLogs) {
        const logs = JSON.parse(str);
        for (const log of logs) {
            const [val, t, ts] = log;
            const msg = typeof val === 'string' ? val : '===== EDITOR START =====';
            const type = t === 'i' ? 'info' : t === 'w' ? 'warn' : 'error';
            const data = {
                ts,
                projectId,
                branchId,
                type,
                msg
            };
            bulk.push(data);
        }
    }
    await db.logs.bulkAdd(bulk);
    count += bulk.length;

    // delete logs to reduce size
    const pruneLogSize = async () => {
        // check if we need to prune
        if (count <= RECORD_LIMIT) {
            return;
        }

        // get all logs
        const all = await db.logs.toArray();
        const skip = all.length - RECORD_LIMIT;


        // collect all ids to delete
        const ids = all.reduce((acc, r, i) => {
            if (i < skip) {
                acc.push(r.id);
            }
            return acc;
        }, []);

        // delete in chunks
        const totalSize = ids.length;
        let promise = Promise.resolve();
        while (ids.length > 0) {
            const chunk = ids.splice(0, RECORD_CHUNK_SIZE);
            const leftSize = ids.length;
            promise = promise.then(async () => {
                await db.logs.bulkDelete(chunk);
                const progress = 1 - leftSize / totalSize;
                workerServer.send('prune', progress);
            });
        }
        await promise;

        // update count
        count -= totalSize;
    };

    // queue log addition
    const queue: Log[] = [];
    workerServer.on('log', (data: Log) => {
        queue.push(data);
    });
    let addPromise = Promise.resolve();
    let pruning = false;
    setInterval(() => {
        // check if already pruning
        if (pruning) {
            return;
        }

        // check if we need to prune
        if (count > RECORD_LIMIT + RECORD_LIMIT_TOLERANCE) {
            pruning = true;
            pruneLogSize().then(() => {
                pruning = false;
            });
            return;
        }

        // check queue is empty
        if (!queue.length) {
            return;
        }

        // drop older records
        if (queue.length > RECORD_MAX_QUEUE_LENGTH) {
            console.warn('Log queue limit exceeded, dropping logs');
            queue.splice(0, queue.length - RECORD_MAX_QUEUE_LENGTH);
        }

        // check chunk size
        const chunk = queue.splice(0, RECORD_CHUNK_SIZE);

        // queue adding chunk
        addPromise = addPromise.then(async () => {
            await db.logs.bulkAdd(chunk);
            count += chunk.length;
            workerServer.send('log');
        });
    });

    // history blob generation
    let historyUrl = null;
    workerServer.on('history', async (projectName: string, branchName: string) => {
        // N.B. Faster to load all logs and filter in memory
        const all = await db.logs.toArray();

        const lines = [
            'PlayCanvas Editor Console History',
            `Project: ${projectName} (${projectId})`,
            `Branch: ${branchName} (${branchId})`,
            `User Agent: ${navigator.userAgent}`,
            '-----'
        ];
        for (const row of all) {
            if (row.projectId !== projectId || row.branchId !== branchId) {
                continue;
            }
            const time = new Date(row.ts).toLocaleString().replace(', ', '|');
            lines.push(`[${time}] [${row.type[0]}] ${row.msg}`);
        }

        // construct blob url
        const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
        if (historyUrl) {
            URL.revokeObjectURL(historyUrl);
        }
        historyUrl = URL.createObjectURL(blob);

        workerServer.send('history', historyUrl);
    });

    // send init complete
    workerServer.send('init');
});
