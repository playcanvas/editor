editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || assets[0].type !== 'json')
            return;

        var asset = assets[0];

        // loading
        var fieldLoading = editor.call('attributes:addField', {
            type: 'progress'
        });
        fieldLoading.on('progress:100', function() {
            this.destroy();
        });

        var panelRaw = editor.call('attributes:addPanel', {
            name: 'Raw Data'
        });

        // code
        var fieldData = editor.call('attributes:addField', {
            parent: panelRaw,
            type: 'code'
        });

        // load data
        Ajax
        .get('{{url.api}}/' + asset.file.url)
        .on('load', function(status, data) {
            fieldData.text = JSON.stringify(data, null, 4);
            fieldLoading.progress = 1;
        })
        .on('progress', function(progress) {
            fieldLoading.progress = .1 + progress * .8;
        })

        fieldLoading.progress = .1;
    });
});
