import { Unwrap } from '@/common/unwrap';
import { WorkerServer } from '@/core/worker/worker-server';

const loadFile = (id: number | string, filename: string) => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.addEventListener('load', () => {
            try {
                const data = JSON.parse(xhr.responseText);
                resolve(data);
            } catch (e) {
                reject(e);
            }
        });
        xhr.addEventListener('error', reject);
        xhr.open('GET', `${location.origin}/api/assets/${id}/file/${filename}`, true);
        xhr.send(null);
    });
};

const start = async (id: number | string, filename: string, padding: number, progress: (val: number) => void) => {
    const data = await loadFile(id, filename);
    const unwrap = new Unwrap();
    unwrap.progress = progress;
    unwrap.unwrapJsonModel(data, true, padding, true);
    const a = unwrap.calculateMultiAreaOfJsonModel(data);
    a.uv = unwrap.calculateUv1AreaOfJsonModel(data);

    return [data, a];
};

const area = async (id: number | string, filename: string) => {
    const data = await loadFile(id, filename);
    const unwrap = new Unwrap();
    const a = unwrap.calculateMultiAreaOfJsonModel(data);
    a.uv = unwrap.calculateUv1AreaOfJsonModel(data);

    return [data, a];
};

const workerServer = new WorkerServer(self);
workerServer.on('start', async (id: number | string, filename: string, padding: number) => {
        const progress = (val: number) => {
        workerServer.send('progress', val);
    };
    const [data, a] = await start(id, filename, padding, progress);
    workerServer.send('start', data, a);
});
workerServer.on('area', async (id: number | string, filename: string) => {
    const [data, a] = await area(id, filename);
    workerServer.send('area', data, a);
});
