editor.once('load', function() {
    'use strict';

    var designerSettings = editor.call('designer-settings');

    // inspecting
    editor.on('attributes:inspect[designerSettings]', function() {
        // grid settings
        var gridPanel = editor.call('attributes:addPanel', {
            name: 'Grid Settings'
        });

        // divisions
        editor.call('attributes:addField', {
            parent: gridPanel,
            name: 'Divisions',
            type: 'number',
            link: designerSettings,
            path: 'grid_divisions'
        });

        // division size
        editor.call('attributes:addField', {
            parent: gridPanel,
            name: 'Division Size',
            type: 'number',
            link: designerSettings,
            path: 'grid_division_size'
        });

        // snap settings
        var snapPanel = editor.call('attributes:addPanel', {
            name: 'Snap Settings'
        });

        // snap increment
        editor.call('attributes:addField', {
            parent: snapPanel,
            name: 'Snap Increment',
            type: 'number',
            link: designerSettings,
            path: 'snap_increment'
        });

        // camera settings
        var cameraPanel = editor.call('attributes:addPanel', {
            name: 'Camera Settings'
        });

        // near clip
        editor.call('attributes:addField', {
            parent: cameraPanel,
            name: 'Near Clip',
            type: 'number',
            link: designerSettings,
            path: 'camera_near_clip'
        });

        // far clip
        editor.call('attributes:addField', {
            parent: cameraPanel,
            name: 'Far Clip',
            type: 'number',
            link: designerSettings,
            path: 'camera_far_clip'
        });

        // clear color
        editor.call('attributes:addField', {
            parent: cameraPanel,
            name: 'Clear Color',
            type: 'vec4',
            link: designerSettings,
            path: 'camera_clear_color'
        });
    });
});
