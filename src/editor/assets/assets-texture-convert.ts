import { WorkerClient } from '../../core/worker/worker-client';

editor.once('load', () => {

    const SUPPORTED_FORMATS = ['avif', 'jpeg', 'png', 'webp'];

    editor.method('assets:texture:convert', async (id, targetFormat, callback) => {
        if (!editor.call('permissions:write')) {
            return;
        }

        if (SUPPORTED_FORMATS.indexOf(targetFormat) === -1) {
            return;
        }

        let workerClient;
        try {
            const asset = editor.call('assets:get', id);
            const sourceFormat = asset.get('meta').format;
            const sourceFilename = asset.get('name');
            const targetFilename = sourceFilename.replace(/\.[^/.]+$/, `.${targetFormat}`);

            // FIXME: No way to use arrayBuffer with AJAX
            const response = await fetch(`/api/assets/${id}/download?branchId=${config.self.branch.id}`);
            const buffer = await response.arrayBuffer();

            // N.B. Update to use frontend URL
            workerClient = new WorkerClient(`${config.url.frontend}js/texture-convert.worker.js`);
            workerClient.once('ready', () => {
                workerClient.on('convert', (data) => {
                    const file = new Blob([data], { type: `image/${targetFormat}` });

                    editor.call('assets:uploadFile', {
                        name: targetFilename,
                        type: 'texture',
                        filename: targetFilename,
                        file
                    }, () => {
                        callback();
                        workerClient.stop();
                    });
                });

                workerClient.with([buffer]).send('convert', config.url.frontend, buffer, sourceFormat, targetFormat);
            });

            workerClient.start();
        } catch (e) {
            callback(e);
            workerClient?.stop();
        }
    });
});
