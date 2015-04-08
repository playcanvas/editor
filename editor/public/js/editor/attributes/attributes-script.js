editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[script]', function(scripts) {
        if (scripts.length !== 1)
            return;

        var script = scripts[0];

        // panel
        var panel = editor.call('attributes:addPanel');
        panel.class.add('component');

        // filename
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Filename',
            // type: 'string',
            link: script,
            path: 'filename'
        });

        // edit
        var btnEdit = new ui.Button();
        btnEdit.text = 'Edit Script';
        btnEdit.class.add('edit-script');
        btnEdit.on('click', function(evt) {
            window.open('/editor/code/' + config.project.id + '/' + script.get('filename'));
        });
        panel.append(btnEdit);
    });
});
