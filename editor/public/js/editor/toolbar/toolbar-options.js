editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.root');
    var viewport = editor.call('layout.viewport');
    var controls = editor.call('layout.toolbar.launch');

    var panel = new ui.Panel();
    panel.class.add('modes');
    panel.hidden = true;
    controls.append(panel);


    // show collision
    var panelCollision = new ui.Panel();
    panelCollision.class.add('field');
    panel.append(panelCollision);
    // field
    var fieldCollisionVisible = new ui.Checkbox();
    fieldCollisionVisible.class.add('tick');
    panelCollision.append(fieldCollisionVisible);
    fieldCollisionVisible.value = editor.call('gizmo:collision:visible');
    fieldCollisionVisible.on('change', function(value) {
        editor.call('gizmo:collision:visible', value);
    });
    editor.on('gizmo:collision:visible', function(visible) {
        fieldCollisionVisible.value = visible;
    });
    // label
    var label = new ui.Label({
        text: 'Physics Edit Mode'
    });
    label.on('click', function() {
        fieldCollisionVisible.element.click();
    });
    panelCollision.append(label);


    // show zones
    var panelZones = new ui.Panel();
    panelZones.class.add('field');
    panel.append(panelZones);
    // field
    var fieldZonesVisible = new ui.Checkbox();
    fieldZonesVisible.class.add('tick');
    panelZones.append(fieldZonesVisible);
    fieldZonesVisible.value = editor.call('gizmo:zone:visible');
    fieldZonesVisible.on('change', function(value) {
        editor.call('gizmo:zone:visible', value);
    });
    editor.on('gizmo:zone:visible', function(visible) {
        fieldZonesVisible.value = visible;
    });
    // label
    var label = new ui.Label({
        text: 'Zones Edit Mode'
    });
    label.on('click', function() {
        fieldZonesVisible.element.click();
    });
    panelZones.append(label);



    // fullscreen
    var buttonOptions = new ui.Button({
        text: '&#57652;'
    });
    buttonOptions.class.add('icon', 'options');
    controls.append(buttonOptions);


    var timeout;

    var onHover = function() {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }

        panel.hidden = false;
    };

    var onBlur = function() {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }

        timeout = setTimeout(function() {
            panel.hidden = true;
            timeout = null;
        }, 50);
    };

    buttonOptions.element.addEventListener('mouseenter', function() {
        if (! editor.call('permissions:read') || buttonOptions.disabled)
            return;

        onHover();
    }, false);

    buttonOptions.element.addEventListener('mouseleave', function() {
        if (! editor.call('permissions:read'))
            return;

        onBlur();
    }, false);

    panel.element.addEventListener('mouseenter', function() {
        if (! panel.hidden)
            onHover();
    }, false);

    panel.element.addEventListener('mouseleave', function() {
        onBlur();
    }, false);
});
