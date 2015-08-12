editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || assets[0].get('type') !== 'text')
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
            name: 'TEXT'
        });
        panelRaw.class.add('component');
        // reference
        editor.call('attributes:reference:asset:text:asset:attach', panelRaw, panelRaw.headerElement);

        // code
        var fieldText = editor.call('attributes:addField', {
            parent: panelRaw,
            type: 'code'
        });
        fieldText.style.margin = '-8px -6px';

        // load data
        new AjaxRequest({
            url: '{{url.home}}/' + asset.get('file.url'),
            notJson: true
        })
        .on('load', function(status, data) {
            fieldText.text = data;
            loading.progress = 1;
        })
        .on('progress', function(progress) {
            loading.progress = .1 + progress * .8;
        })
        .on('error', function(status, err) {
            loading.failed = true;
            fieldText.destroy();

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
