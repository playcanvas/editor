editor.once('load', function() {
    'use strict';

    var designerSettings = editor.call('designerSettings');

    var sceneName = 'Untitled';
    editor.on('scene:raw', function(data) {
        sceneName = data.name;
    });
    editor.on('realtime:scene:op:name', function(op) {
        sceneName = op.oi;
    });

    // inspecting
    editor.on('attributes:inspect[designerSettings]', function() {

        var panelScene = editor.call('attributes:addPanel');
        panelScene.class.add('component');

        // scene name
        var fieldName = editor.call('attributes:addField', {
            parent: panelScene,
            name: 'Scene Name',
            type: 'string',
            value: sceneName
        });
        var changingName = false;
        fieldName.on('change', function(value) {
            if (changingName)
                return;

            editor.call('realtime:scene:op', {
                p: [ 'name' ],
                oi: value,
                od: sceneName
            });
            sceneName = value;
        });
        var evtNameChange = editor.on('realtime:scene:op:name', function(op) {
            changingName = true;
            fieldName.value = op.oi;
            changingName = false;
        });
        fieldName.on('destroy', function() {
            evtNameChange.unbind();
        });


        var panel = editor.call('attributes:addPanel', {
            name: 'Designer Settings'
        });
        panel.class.add('component');

        // grid divisions
        var fieldNearClip = editor.call('attributes:addField', {
            parent: panel,
            name: 'Grid',
            placeholder: 'Divisions',
            type: 'number',
            precision: 1,
            step: 1,
            min: 0,
            link: designerSettings,
            path: 'grid_divisions'
        });
        fieldNearClip.style.width = '32px';


        // grid divisions size
        var fieldFarClip = new ui.NumberField({
            precision: 1,
            step: 1,
            min: 0,
        });
        fieldFarClip.placeholder = 'Size';
        fieldFarClip.style.width = '32px';
        fieldFarClip.flexGrow = 1;
        fieldFarClip.link(designerSettings, 'grid_division_size');
        fieldNearClip.parent.append(fieldFarClip);


        // snap increment
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Snap',
            type: 'number',
            precision: 2,
            step: 1,
            min: 0,
            placeholder: 'Increment',
            link: designerSettings,
            path: 'snap_increment'
        });


        // camera near clip
        var fieldNearClip = editor.call('attributes:addField', {
            parent: panel,
            name: 'Camera Clip',
            placeholder: 'Near',
            type: 'number',
            precision: 2,
            step: .1,
            min: 0,
            link: designerSettings,
            path: 'camera_near_clip'
        });
        fieldNearClip.style.width = '32px';


        // camera far clip
        var fieldFarClip = new ui.NumberField({
            precision: 2,
            step: 1,
            min: 0
        });
        fieldFarClip.placeholder = 'Far';
        fieldFarClip.style.width = '32px';
        fieldFarClip.flexGrow = 1;
        fieldFarClip.link(designerSettings, 'camera_far_clip');
        fieldNearClip.parent.append(fieldFarClip);


        // clear color
        var fieldClearColor = editor.call('attributes:addField', {
            parent: panel,
            name: 'Clear Color',
            type: 'rgb',
            link: designerSettings,
            path: 'camera_clear_color'
        });
    });
});
