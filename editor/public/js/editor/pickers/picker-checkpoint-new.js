editor.once('load', function () {
    'use strict';

    var panel = new ui.Panel();
    panel.class.add('picker-checkpoint-new');

    editor.call('picker:project:registerPanel', 'checkpoint-new', 'New Checkpoint', panel);

    var newCheckpointForm = new ui.Panel();
    newCheckpointForm.class.add('new-checkpoint-form');
    panel.append(newCheckpointForm);

    var label = new ui.Label({text: 'New checkpoint description:'});
    label.class.add('field-label');
    newCheckpointForm.append(label);

    var inputDescription = document.createElement('textarea');
    newCheckpointForm.append(inputDescription);

    var btnCreate = new ui.Button({
        text: 'Create checkpoint'
    });

    btnCreate.class.add('create-btn');

    newCheckpointForm.append(btnCreate);

    btnCreate.on('click', function () {
        var data = {
            user_id: config.self.id,
            project_id: config.project.id,
            description: inputDescription.value || 'New checkpoint'
        };

        inputDescription.value = '';

        editor.call('checkpoint:create', data);
    });

    editor.method('picker:checkpoint:new', function () {
        editor.call('picker:project', 'checkpoint-new');
    });

    panel.on('show', function () {
        if (editor.call('viewport:inViewport'))
            editor.emit('viewport:hover', false);
    });

    panel.on('hide', function () {
        if (editor.call('viewport:inViewport'))
            editor.emit('viewport:hover', true);
    });

    editor.on('viewport:hover', function(state) {
        if (state && ! panel.hidden) {
            setTimeout(function() {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });

});
