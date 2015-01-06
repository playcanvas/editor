(function() {
    'use strict';

    var designerSettings = msg.call('designer-settings');

    // inspecting
    msg.on('attributes:inspect[designerSettings]', function() {
        // grid settings
        var gridPanel = msg.call('attributes:addPanel', {
            name: 'Grid Settings'
        });

        // divisions
        msg.call('attributes:addField', {
            parent: gridPanel,
            name: 'Divisions',
            type: 'number',
            link: designerSettings,
            path: 'grid_divisions'
        });

        // division size
        msg.call('attributes:addField', {
            parent: gridPanel,
            name: 'Division Size',
            type: 'number',
            link: designerSettings,
            path: 'grid_division_size'
        });

        // snap settings
        var snapPanel = msg.call('attributes:addPanel', {
            name: 'Snap Settings'
        });

        // snap increment
        msg.call('attributes:addField', {
            parent: snapPanel,
            name: 'Snap Increment',
            type: 'number',
            link: designerSettings,
            path: 'snap_increment'
        });

        // camera settings
        var cameraPanel = msg.call('attributes:addPanel', {
            name: 'Camera Settings'
        });

        // near clip
        msg.call('attributes:addField', {
            parent: cameraPanel,
            name: 'Near Clip',
            type: 'number',
            link: designerSettings,
            path: 'camera_near_clip'
        });

        // far clip
        msg.call('attributes:addField', {
            parent: cameraPanel,
            name: 'Far Clip',
            type: 'number',
            link: designerSettings,
            path: 'camera_far_clip'
        });

        // clear color
        msg.call('attributes:addField', {
            parent: cameraPanel,
            name: 'Clear Color',
            type: 'vec4',
            link: designerSettings,
            path: 'camera_clear_color'
        });
    });
})();
