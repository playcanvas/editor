editor.once('viewport:load', function() {
    'use strict';

    var viewport = editor.call('layout.viewport');
    var app = editor.call('viewport:framework');

    var options = { };

    var combo = new ui.SelectField({
        options: options
    });
    combo.enabled = false;
    combo.class.add('viewport-camera');

    editor.on('permissions:writeState', function(state) {
        combo.enabled = state;
    });
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

    function refreshOptions () {
        combo._updateOptions(options);
    }

    editor.on('camera:add', function(entity) {
        options[entity.getGuid()] = entity.name;
        combo._updateOptions(options);
    });

    editor.on('camera:remove', function(entity) {
        delete options[entity.getGuid()];
        combo._updateOptions(options);
    });

    editor.on('camera:change', function(entity) {
        combo.value = entity.getGuid();
    });
});
