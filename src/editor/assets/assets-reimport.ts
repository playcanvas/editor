editor.once('load', () => {
    let index = 0;
    editor.method('assets:reimport', (assetId, type, overrides, callback) => {
        if (typeof overrides === 'function') {
            callback = overrides;
            overrides = {};
        }
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
    });
});
