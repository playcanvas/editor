editor.once('load', function() {
    'use strict';

    var designerSettings = editor.call('designerSettings');

    // inspecting
    editor.on('attributes:inspect[designerSettings]', function() {

        var panel = editor.call('attributes:addPanel');


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
