editor.once('load', function() {
    'use strict';

    var designerSettings = editor.call('designerSettings');

    var sceneName = 'Untitled';
    editor.on('scene:raw', function(data) {
        editor.emit('scene:name', data.name);
    });
    editor.on('realtime:scene:op:name', function(op) {
        editor.emit('scene:name', op.oi);
    });
    editor.on('scene:name', function(name) {
        sceneName = name;
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
                od: sceneName || '',
                oi: value || ''
            });
            editor.emit('scene:name', value);
        });
        var evtNameChange = editor.on('realtime:scene:op:name', function(op) {
            changingName = true;
            fieldName.value = op.oi;
            changingName = false;
        });
        fieldName.on('destroy', function() {
            evtNameChange.unbind();
        });
        // reference
        editor.call('attributes:reference:settings:name:attach', fieldName.parent.innerElement.firstChild.ui);

        var panel = editor.call('attributes:addPanel', {
            name: 'Editor Settings'
        });
        panel.class.add('component');
        // reference
        editor.call('attributes:reference:settings:designer:attach', panel, panel.headerElement);

        // grid divisions
        var fieldGrid = editor.call('attributes:addField', {
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
        fieldGrid.style.width = '32px';
        // reference
        editor.call('attributes:reference:settings:grid:attach', fieldGrid.parent.innerElement.firstChild.ui);


        // grid divisions size
        var fieldFarClip = new ui.NumberField({
            precision: 1,
            step: 1,
            min: 0
        });
        fieldFarClip.placeholder = 'Size';
        fieldFarClip.style.width = '32px';
        fieldFarClip.flexGrow = 1;
        fieldFarClip.link(designerSettings, 'grid_division_size');
        fieldGrid.parent.append(fieldFarClip);


        // snap increment
        var fieldSnap = editor.call('attributes:addField', {
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
        // reference
        editor.call('attributes:reference:settings:snap:attach', fieldSnap.parent.innerElement.firstChild.ui);


        // camera near clip
        var fieldClip = editor.call('attributes:addField', {
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
        fieldClip.style.width = '32px';
        // reference
        editor.call('attributes:reference:settings:cameraClip:attach', fieldClip.parent.innerElement.firstChild.ui);


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
        fieldClip.parent.append(fieldFarClip);


        // clear color
        var fieldClearColor = editor.call('attributes:addField', {
            parent: panel,
            name: 'Clear Color',
            type: 'rgb',
            link: designerSettings,
            path: 'camera_clear_color'
        });
        // reference
        editor.call('attributes:reference:settings:clearColor:attach', fieldClearColor.parent.innerElement.firstChild.ui);


        // icons size
        var fieldIconsSize = editor.call('attributes:addField', {
            parent: panel,
            name: 'Icons Size',
            type: 'number',
            precision: 2,
            step: .1,
            min: 0,
            link: designerSettings,
            path: 'icons_size'
        });
        // reference
        editor.call('attributes:reference:settings:iconsSize:attach', fieldIconsSize.parent.innerElement.firstChild.ui);


        // local server
        var fieldLocalServer = editor.call('attributes:addField', {
            parent: panel,
            name: 'Local Server',
            type: 'string',
            link: designerSettings,
            path: 'local_server'
        });

        var changingLocalServer = false;
        var oldLocalServer = fieldLocalServer.value;
        fieldLocalServer.on('change', function (value) {
            if (changingLocalServer) return;

            changingLocalServer = true;
            if (! /^http(s)?:\/\/\S+/.test(value)) {
                fieldLocalServer.value = oldLocalServer;
            } else {
                oldLocalServer = value;
            }

            changingLocalServer = false;
        });

        // reference
        editor.call('attributes:reference:settings:localServer:attach', fieldLocalServer.parent.innerElement.firstChild.ui);

    });
});
