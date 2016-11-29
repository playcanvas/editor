editor.once('load', function() {
    'use strict';

    var editorSettings = editor.call('editorSettings');

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

    var foldStates = {
        'editor': true
    };

    // inspecting
    editor.on('attributes:inspect[editorSettings]', function() {

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
        editor.call('attributes:reference:attach', 'settings:name', fieldName.parent.innerElement.firstChild.ui);


        // editor
        var panel = editor.call('attributes:addPanel', {
            name: 'Editor'
        });
        panel.foldable = true;
        panel.folded = foldStates['editor'];
        panel.on('fold', function() { foldStates['editor'] = true; });
        panel.on('unfold', function() { foldStates['editor'] = false; });
        panel.class.add('component');
        // reference
        editor.call('attributes:reference:attach', 'settings:editor', panel, panel.headerElement);

        // grid divisions
        var fieldGrid = editor.call('attributes:addField', {
            parent: panel,
            name: 'Grid',
            placeholder: 'Divisions',
            type: 'number',
            precision: 1,
            step: 1,
            min: 0,
            link: editorSettings,
            path: 'grid_divisions'
        });
        fieldGrid.style.width = '32px';
        // reference
        editor.call('attributes:reference:attach', 'settings:grid', fieldGrid.parent.innerElement.firstChild.ui);


        // grid divisions size
        var fieldFarClip = new ui.NumberField({
            precision: 1,
            step: 1,
            min: 0
        });
        fieldFarClip.placeholder = 'Size';
        fieldFarClip.style.width = '32px';
        fieldFarClip.flexGrow = 1;
        fieldFarClip.link(editorSettings, 'grid_division_size');
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
            link: editorSettings,
            path: 'snap_increment'
        });
        // reference
        editor.call('attributes:reference:attach', 'settings:snap', fieldSnap.parent.innerElement.firstChild.ui);


        // camera near clip
        var fieldClip = editor.call('attributes:addField', {
            parent: panel,
            name: 'Camera Clip',
            placeholder: 'Near',
            type: 'number',
            precision: 2,
            step: .1,
            min: 0,
            link: editorSettings,
            path: 'camera_near_clip'
        });
        fieldClip.style.width = '32px';
        // reference
        editor.call('attributes:reference:attach', 'settings:cameraClip', fieldClip.parent.innerElement.firstChild.ui);


        // camera far clip
        var fieldFarClip = new ui.NumberField({
            precision: 2,
            step: 1,
            min: 0
        });
        fieldFarClip.placeholder = 'Far';
        fieldFarClip.style.width = '32px';
        fieldFarClip.flexGrow = 1;
        fieldFarClip.link(editorSettings, 'camera_far_clip');
        fieldClip.parent.append(fieldFarClip);


        // clear color
        var fieldClearColor = editor.call('attributes:addField', {
            parent: panel,
            name: 'Clear Color',
            type: 'rgb',
            link: editorSettings,
            path: 'camera_clear_color'
        });
        // reference
        editor.call('attributes:reference:attach', 'settings:clearColor', fieldClearColor.parent.innerElement.firstChild.ui);


        // icons size
        var fieldIconsSize = editor.call('attributes:addField', {
            parent: panel,
            name: 'Icons Size',
            type: 'number',
            precision: 2,
            step: .1,
            min: 0,
            link: editorSettings,
            path: 'icons_size'
        });
        // reference
        editor.call('attributes:reference:attach', 'settings:iconsSize', fieldIconsSize.parent.innerElement.firstChild.ui);


        // local server
        var fieldLocalServer = editor.call('attributes:addField', {
            parent: panel,
            name: 'Local Server',
            type: 'string',
            link: editorSettings,
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
        editor.call('attributes:reference:attach', 'settings:localServer', fieldLocalServer.parent.innerElement.firstChild.ui);


        // chat notification
        var fieldChatNotification = editor.call('attributes:addField', {
            parent: panel,
            name: 'Chat Notification',
            type: 'checkbox'
        });
        var checkChatNotificationState = function() {
            var permission = editor.call('notify:state');

            fieldChatNotification.disabled = permission === 'denied';

            if (permission !== 'granted' && permission !== 'denied')
                fieldChatNotification.value = null;

            if (permission === 'granted') {
                // restore localstorage state
                var granted = editor.call('localStorage:get', 'editor:notifications:chat');
                if (granted === null) {
                    fieldChatNotification.value = true;
                } else {
                    fieldChatNotification.value = granted;
                }
            }
        };
        var evtPermission = editor.on('notify:permission', checkChatNotificationState);
        var evtChatNofityState = editor.on('chat:notify', checkChatNotificationState);
        checkChatNotificationState();
        fieldChatNotification.on('change', function(value) {
            if (editor.call('notify:state') !== 'granted') {
                editor.call('notify:permission');
            } else {
                editor.call('localStorage:set', 'editor:notifications:chat', value);
                editor.emit('chat:notify', value);
                checkChatNotificationState();
            }
        });
        fieldChatNotification.once('destroy', function() {
            evtPermission.unbind();
            evtChatNofityState.unbind();
            evtPermission = null;
            evtChatNofityState = null;
        });
    });
});
