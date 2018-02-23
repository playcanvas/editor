editor.once('load', function() {
    'use strict';

    var index = 0;
    editor.method('assets:reimport', function (assetId, type, callback) {
        var form = new FormData();

        // conversion pipeline specific parameters
        var settings = editor.call('settings:projectUser');
        switch(type) {
            case 'texture':
            case 'textureatlas':
                form.append('pow2', settings.get('editor.pipeline.texturePot'));
                form.append('searchRelatedAssets', settings.get('editor.pipeline.searchRelatedAssets'));
                break;
            case 'scene':
                form.append('searchRelatedAssets', settings.get('editor.pipeline.searchRelatedAssets'));
                form.append('overwriteModel', settings.get('editor.pipeline.overwriteModel'));
                form.append('overwriteAnimation', settings.get('editor.pipeline.overwriteAnimation'));
                form.append('overwriteMaterial', settings.get('editor.pipeline.overwriteMaterial'));
                form.append('overwriteTexture', settings.get('editor.pipeline.overwriteTexture'));
                form.append('pow2', settings.get('editor.pipeline.texturePot'));
                form.append('preserveMapping', settings.get('editor.pipeline.preserveMapping'));
                break
            case 'font':
                break;
            default:
                break;
        }

        var jobId = ++index;
        var jobName = 'asset-reimport:' + jobId;
        editor.call('status:job', jobName, 0);

        Ajax({
            url: '/api/assets/import/' + assetId,
            method: 'PUT',
            auth: true,
            data: form,
            ignoreContentType: true,
            headers: {
                Accept: 'application/json'
            }
        })
        .on('load', function(status, res) {
            editor.call('status:job', jobName);
            if (callback) {
                callback(null, res);
            }
        })
        .on('progress', function(progress) {
            editor.call('status:job', jobName, progress);
        })
        .on('error', function(status, res) {
            editor.call('status:error', res);
            editor.call('status:job', jobName);
            if (callback) {
                callback(res);
            }
        });
    });
});