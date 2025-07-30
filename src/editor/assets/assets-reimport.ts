editor.once('load', () => {
    let index = 0;
    editor.method('assets:reimport', (assetId, type, callback) => {
        const data = {};

        // conversion pipeline specific parameters
        const settings = editor.call('settings:projectUser');
        if (type === 'texture' || type === 'textureatlas' || type === 'scene') {
            data.pow2 = settings.get('editor.pipeline.texturePot');
            data.searchRelatedAssets = settings.get('editor.pipeline.searchRelatedAssets');

            if (type === 'scene') {
                data.overwriteModel = settings.get('editor.pipeline.overwriteModel');
                data.overwriteAnimation = settings.get('editor.pipeline.overwriteAnimation');
                data.overwriteMaterial = settings.get('editor.pipeline.overwriteMaterial');
                data.overwriteTexture = settings.get('editor.pipeline.overwriteTexture');
                data.preserveMapping = settings.get('editor.pipeline.preserveMapping');
                data.useGlb = settings.get('editor.pipeline.useGlb');
                data.useContainers = settings.get('editor.pipeline.useContainers');
                data.meshCompression = settings.get('editor.pipeline.meshCompression');
                data.dracoDecodeSpeed = settings.get('editor.pipeline.dracoDecodeSpeed');
                data.dracoMeshSize = settings.get('editor.pipeline.dracoMeshSize');
                data.animUseFbxFilename = settings.get('editor.pipeline.animUseFbxFilename');
            }
        }

        const jobId = ++index;
        const jobName = `asset-reimport:${jobId}`;
        editor.call('status:job', jobName, 0);

        editor.api.globals.rest.assets.assetReimport(assetId, data)
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
