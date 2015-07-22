editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || assets[0].get('type') !== 'html')
            return;

        var asset = assets[0];

        // loading
        var loading = editor.call('attributes:addField', {
            type: 'progress'
        });
        loading.on('progress:100', function() {
            this.destroy();
        });

        // panel
        var panel = editor.call('attributes:addPanel');
        panel.class.add('component');

        // edit
        var btnEdit = new ui.Button();
        btnEdit.text = 'Edit';
        btnEdit.class.add('edit-script');
        btnEdit.on('click', function(evt) {
            window.open('/editor/asset/' + asset.get('id'));
        });
        panel.append(btnEdit);

        var panelRaw = editor.call('attributes:addPanel', {
            name: 'HTML'
        });
        panelRaw.class.add('component');
        // reference
        editor.call('attributes:reference:asset:html:asset:attach', panelRaw, panelRaw.headerElement);

        // code
        var fieldCode = editor.call('attributes:addField', {
            parent: panelRaw,
            type: 'code'
        });
        fieldCode.style.margin = '-8px -6px';

        // load data
        (new AjaxRequest({
            url: '{{url.home}}/' + asset.get('file.url'),
            notJson: true
        }))
        .on('load', function(status, data) {
            fieldCode.text = data;
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
