editor.once('load', function () {
    'use strict';

    const controls = editor.call('layout.toolbar.launch');

    const panel = new ui.Panel();
    panel.class.add('modes');
    panel.hidden = true;
    controls.append(panel);


    // show collision
    const panelCollision = new ui.Panel();
    panelCollision.class.add('field');
    panel.append(panelCollision);
    // field
    const fieldCollisionVisible = new ui.Checkbox();
    fieldCollisionVisible.class.add('tick');
    panelCollision.append(fieldCollisionVisible);
    fieldCollisionVisible.value = editor.call('gizmo:collision:visible');
    fieldCollisionVisible.on('change', function (value) {
        editor.call('gizmo:collision:visible', value);
    });
    editor.on('gizmo:collision:visible', function (visible) {
        fieldCollisionVisible.value = visible;
    });
    // label
    let label = new ui.Label({
        text: 'Physics Edit Mode'
    });
    label.on('click', function () {
        fieldCollisionVisible.element.click();
    });
    panelCollision.append(label);


    // show zones
    const panelZones = new ui.Panel();
    panelZones.class.add('field');
    panel.append(panelZones);
    // field
    const fieldZonesVisible = new ui.Checkbox();
    fieldZonesVisible.class.add('tick');
    panelZones.append(fieldZonesVisible);
    fieldZonesVisible.value = editor.call('gizmo:zone:visible');
    fieldZonesVisible.on('change', function (value) {
        editor.call('gizmo:zone:visible', value);
    });
    editor.on('gizmo:zone:visible', function (visible) {
        fieldZonesVisible.value = visible;
    });
    // label
    label = new ui.Label({
        text: 'Zones Edit Mode'
    });
    label.on('click', function () {
        fieldZonesVisible.element.click();
    });
    panelZones.append(label);


    // fullscreen
    const buttonOptions = new ui.Button({
        text: '&#57652;'
    });
    buttonOptions.class.add('icon', 'options');
    controls.append(buttonOptions);


    let timeout;

    const onHover = function () {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }

        panel.hidden = false;
    };

    const onBlur = function () {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }

        timeout = setTimeout(function () {
            panel.hidden = true;
            timeout = null;
        }, 50);
    };

    buttonOptions.element.addEventListener('mouseenter', function () {
        if (! editor.call('permissions:read') || buttonOptions.disabled)
            return;

        onHover();
    }, false);

    buttonOptions.element.addEventListener('mouseleave', function () {
        if (! editor.call('permissions:read'))
            return;

        onBlur();
    }, false);

    panel.element.addEventListener('mouseenter', function () {
        if (! panel.hidden)
            onHover();
    }, false);

    panel.element.addEventListener('mouseleave', function () {
        onBlur();
    }, false);
});
