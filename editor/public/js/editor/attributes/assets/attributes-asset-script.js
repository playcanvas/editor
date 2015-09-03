editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || assets[0].get('type') !== 'script' || assets[0].get('source'))
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
            window.open('/editor/code/' + config.project.id + '/' + asset.get('filename'));
        }, false);
        panel.append(btnEdit);
    });
});
