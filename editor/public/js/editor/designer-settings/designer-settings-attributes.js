editor.once('load', function() {
    'use strict';

    var designerSettings = editor.call('designerSettings');

    // inspecting
    editor.on('attributes:inspect[designerSettings]', function() {

        var panel = editor.call('attributes:addPanel');


        // grid
        var panelClip = editor.call('attributes:addField', {
            parent: panel,
            name: 'Grid'
        });

        var label = panelClip;
        panelClip = panelClip.parent;
        label.destroy();

        var fieldNearClip = new ui.NumberField();
        fieldNearClip.placeholder = 'Divisions';
        fieldNearClip.style.width = '32px';
        fieldNearClip.flexGrow = 1;
        fieldNearClip.link(designerSettings, 'grid_divisions');
        panelClip.append(fieldNearClip);

        var fieldFarClip = new ui.NumberField();
        fieldFarClip.placeholder = 'Size';
        fieldFarClip.style.width = '32px';
        fieldFarClip.flexGrow = 1;
        fieldFarClip.link(designerSettings, 'grid_division_size');
        panelClip.append(fieldFarClip);


        // snap increment
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Snap',
            type: 'number',
            placeholder: 'Increment',
            link: designerSettings,
            path: 'snap_increment'
        });


        // camera clip
        var panelClip = editor.call('attributes:addField', {
            parent: panel,
            name: 'Camera Clip'
        });

        var label = panelClip;
        panelClip = panelClip.parent;
        label.destroy();

        var fieldNearClip = new ui.NumberField();
        fieldNearClip.placeholder = 'Near';
        fieldNearClip.style.width = '32px';
        fieldNearClip.flexGrow = 1;
        fieldNearClip.link(designerSettings, 'camera_near_clip');
        panelClip.append(fieldNearClip);

        var fieldFarClip = new ui.NumberField();
        fieldFarClip.placeholder = 'Far';
        fieldFarClip.style.width = '32px';
        fieldFarClip.flexGrow = 1;
        fieldFarClip.link(designerSettings, 'camera_far_clip');
        panelClip.append(fieldFarClip);


        // clear color
        var fieldClearColor = editor.call('attributes:addField', {
            parent: panel,
            name: 'Clear Color',
            placeholder: [ 'R', 'G', 'B', 'A' ],
            type: 'vec4',
            link: designerSettings,
            path: 'camera_clear_color'
        });
    });
});
