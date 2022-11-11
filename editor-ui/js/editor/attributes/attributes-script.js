editor.once('load', function () {
    'use strict';

    if (!editor.call('settings:project').get('useLegacyScripts'))
        return;

    editor.on('attributes:inspect[script]', function (scripts) {
        if (scripts.length !== 1)
            return;

        var script = scripts[0];

        // panel
        var panel = editor.call('attributes:addPanel');
        panel.class.add('component');

        // filename
        var fieldFilename = editor.call('attributes:addField', {
            parent: panel,
            name: 'Filename',
            // type: 'string',
            link: script,
            path: 'filename'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:script:filename', fieldFilename.parent.innerElement.firstChild.ui);

        // edit
        var btnEdit = new ui.Button();
        btnEdit.text = 'Edit Script';
        btnEdit.class.add('edit-script', 'large-with-icon');
        btnEdit.on('click', function (evt) {
            window.open('/editor/code/' + config.project.id + '/' + script.get('filename'));
        });
        panel.append(btnEdit);
    });
});
