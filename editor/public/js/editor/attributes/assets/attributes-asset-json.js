editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || assets[0].get('type') !== 'json')
            return;

        var asset = assets[0];

        // panel
        var panel = editor.call('attributes:addPanel');
        panel.class.add('component');

        // loading
        var loading = editor.call('attributes:addField', {
            parent: panel,
            type: 'progress'
        });
        loading.on('progress:100', function() {
            this.destroy();
        });

        var panelRaw = editor.call('attributes:addPanel', {
            parent: panel,
            name: 'Raw Data'
        });

        // code
        var fieldCode = editor.call('attributes:addField', {
            parent: panelRaw,
            type: 'code'
        });

        // load data
        Ajax
        .get('{{url.home}}/' + asset.get('file.url'))
        .on('load', function(status, data) {
            fieldCode.text = JSON.stringify(data, null, 4);
            loading.progress = 1;
        })
        .on('progress', function(progress) {
            loading.progress = .1 + progress * .8;
        })
        .on('error', function() {
            loading.failed = true;
            panelRaw.destroy();

            var error = new ui.Label({ text: 'failed loading data' });
            error.textContent = 'failed loading data';
            error.style.display = 'block';
            error.style.textAlign = 'center';
            error.style.fontWeight = '100';
            error.style.fontSize = '12px';
            error.style.color = '#f66';
            editor.call('attributes.rootPanel').append(error);

            loading.progress = 1;
        });

        loading.progress = .1;
    });
});
