editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || assets[0].get('type') !== 'json' || assets[0].get('source'))
            return;

        var asset = assets[0];

        // panel
        var panel = editor.call('attributes:addPanel');
        panel.class.add('component');

        // edit
        var btnEdit = new ui.Button();
        btnEdit.text = editor.call('permissions:write') ? 'Edit' : 'View';
        btnEdit.class.add('edit-script');
        btnEdit.element.addEventListener('click', function(evt) {
            window.open('/editor/asset/' + asset.get('id'));
        }, false);
        panel.append(btnEdit);

        // loading
        var loading = editor.call('attributes:addField', {
            type: 'progress'
        });
        loading.on('progress:100', function() {
            this.destroy();
        });

        var panelRaw = editor.call('attributes:addPanel', {
            name: 'JSON'
        });
        panelRaw.class.add('component');
        // reference
        editor.call('attributes:reference:asset:json:asset:attach', panelRaw, panelRaw.headerElement);

        // code
        var fieldCode = editor.call('attributes:addField', {
            parent: panelRaw,
            type: 'code'
        });
        fieldCode.style.margin = '-8px -6px';

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
            fieldCode.destroy();

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
