editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || assets[0].get('type') !== 'html')
            return;

        var asset = assets[0];

        // panel
        var panel = editor.call('attributes:addPanel');
        panel.class.add('component');

        // edit
        var btnEdit = new ui.Button();
        btnEdit.text = 'Edit HTML';
        btnEdit.class.add('edit-script');
        btnEdit.on('click', function(evt) {
            window.open('/editor/asset/' + asset.get('id'));
        });
        panel.append(btnEdit);
    });
});
