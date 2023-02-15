editor.once('load', function () {
    var index = 0;
    editor.method('assets:reimport', function (assetId, type, callback) {
        var data = {};

        // conversion pipeline specific parameters
        var settings = editor.call('settings:projectUser');
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
                data.animUseFbxFilename = settings.get('editor.pipeline.animUseFbxFilename');
            }
        }

        var jobId = ++index;
        var jobName = 'asset-reimport:' + jobId;
        editor.call('status:job', jobName, 0);

        Ajax({
            url: '/api/assets/' + assetId + '/reimport?branchId=' + config.self.branch.id,
            method: 'POST',
            auth: true,
            data: data
        })
        .on('load', function (status, res) {
            editor.call('status:job', jobName);
            if (callback) {
                callback(null, res);
            }
        })
        .on('progress', function (progress) {
            editor.call('status:job', jobName, progress);
        })
        .on('error', function (status, res) {
            editor.call('status:error', res);
            editor.call('status:job', jobName);
            if (callback) {
                callback(res);
            }
        });
    });
});
