editor.once('viewport:load', function() {
    'use strict';

    var viewport = editor.call('layout.viewport');
    var app = editor.call('viewport:framework');

    var options = { };
    var index = { };
    var events = { };

    var combo = new ui.SelectField({
        options: options
    });
    combo.disabledClick = true;
    combo.class.add('viewport-camera');

    combo.on('open', function() {
        tooltip.disabled = true;
    });
    combo.on('close', function() {
        tooltip.disabled = false;
    });


    viewport.append(combo);

    combo.on('change', function(value) {
        var entity = app.root.findByGuid(value);
        editor.call('camera:set', entity);
    });

    var tooltip = Tooltip.attach({
        target: combo.element,
        text: 'Camera',
        align: 'top',
        root: editor.call('layout.root')
    });

    var refreshOptions = function() {
        combo._updateOptions(options);

        var writePermission = editor.call('permissions:write');
        for(var key in combo.optionElements) {
            if (index[key].__editorCamera)
                continue;

            if (writePermission) {
                combo.optionElements[key].classList.remove('hidden');
            } else {
                combo.optionElements[key].classList.add('hidden');
            }
        }
    };

    editor.on('permissions:writeState', refreshOptions);

    editor.on('camera:add', function(entity) {
        options[entity.getGuid()] = entity.name;
        index[entity.getGuid()] = entity;
        refreshOptions();

        if (events[entity.getGuid()])
            events[entity.getGuid()].unbind();

        var obj = editor.call('entities:get', entity.getGuid());
        if (obj) {
            events[entity.getGuid()] = obj.on('name:set', function (value) {
                options[entity.getGuid()] = value;
                refreshOptions();

                if (combo.value === entity.getGuid())
                    combo.elementValue.textContent = value;
            });
        }
    });

    editor.on('camera:remove', function(entity) {
        delete options[entity.getGuid()];
        refreshOptions();

        if (events[entity.getGuid()]) {
            events[entity.getGuid()].unbind();
            delete events[entity.getGuid()];
        }
    });

    editor.on('camera:change', function(entity) {
        combo.value = entity.getGuid();
    });
});



