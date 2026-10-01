import { Unwrap } from '@/common/unwrap';
import { WorkerServer } from '@/core/worker/worker-server';

const loadFile = (url: string) => {
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
        xhr.open('GET', url, true);
        xhr.send(null);
    });
};

const start = async (url: string, padding: number, progress: (val: number) => void) => {
    const data = await loadFile(url);
    const unwrap = new Unwrap();
    unwrap.progress = progress;
    unwrap.unwrapJsonModel(data, true, padding, true);
    const a = unwrap.calculateMultiAreaOfJsonModel(data);
    a.uv = unwrap.calculateUv1AreaOfJsonModel(data);

    return [data, a];
};

const area = async (url: string) => {
    const data = await loadFile(url);
    const unwrap = new Unwrap();
    const a = unwrap.calculateMultiAreaOfJsonModel(data);
    a.uv = unwrap.calculateUv1AreaOfJsonModel(data);

    return [data, a];
};

const workerServer = new WorkerServer(self);
workerServer.on('start', async (url: string, padding: number) => {
    const progress = (val: number) => {
        workerServer.send('progress', val);
    };
    const [data, a] = await start(url, padding, progress);
    workerServer.send('start', data, a);
});
workerServer.on('area', async (url: string) => {
    const [data, a] = await area(url);
    workerServer.send('area', data, a);
});
