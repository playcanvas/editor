editor.once('load', () => {
    let index = 0;

    const serverReimport = (assetId, overrides, callback) => {
        const data = editor.call('assets:pipeline:options', overrides);

        const jobId = ++index;
        const jobName = `asset-reimport:${jobId}`;
        editor.call('status:job', jobName, 0);

        editor.api.globals.rest.assets
            .assetReimport(assetId, data)
            .on('load', (status, res) => {
                editor.call('status:job', jobName);
                if (callback) {
                    callback(null, res);
                }
            })
            .on('progress', (progress) => {
                editor.call('status:job', jobName, progress);
            })
            .on('error', (status, res) => {
                editor.call('status:error', res);
                editor.call('status:job', jobName);
                if (callback) {
                    callback(res);
                }
            });
    };

    editor.method('assets:reimport', (assetId, type, overrides, callback) => {
        if (typeof overrides === 'function') {
            callback = overrides;
            overrides = {};
        }

        // textures convert in the editor for every supported input; false means fall back to the server
        if (type === 'texture' || type === 'textureatlas') {
            editor.call('textures:reimport', assetId, overrides).then(
                (ok: boolean) =>
                    ok
                        ? callback?.(null, editor.call('assets:get', assetId)?.json())
                        : serverReimport(assetId, overrides, callback),
                (err: Error) => {
                    editor.call('status:error', err.message);
                    callback?.(err.message);
                }
            );
            return;
        }

        serverReimport(assetId, overrides, callback);
    });
});
