editor.once('load', function() {
    'use strict';

    var designerSettings = editor.call('designer-settings');

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
        fieldNearClip.renderChanges = true;
        fieldNearClip.placeholder = 'Divisions';
        fieldNearClip.style.width = '32px';
        fieldNearClip.flexGrow = 1;
        fieldNearClip.link(designerSettings, 'grid_divisions');
        panelClip.append(fieldNearClip);

        var fieldFarClip = new ui.NumberField();
        fieldFarClip.renderChanges = true;
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


        // camera near/far clip
        var panelClip = editor.call('attributes:addField', {
            parent: panel,
            name: 'Camera Clip'
        });

        var label = panelClip;
        panelClip = panelClip.parent;
        label.destroy();

        var fieldNearClip = new ui.NumberField();
        fieldNearClip.renderChanges = true;
        fieldNearClip.placeholder = 'Near';
        fieldNearClip.style.width = '32px';
        fieldNearClip.flexGrow = 1;
        fieldNearClip.link(designerSettings, 'camera_near_clip');
        panelClip.append(fieldNearClip);

        var fieldFarClip = new ui.NumberField();
        fieldFarClip.renderChanges = true;
        fieldFarClip.placeholder = 'Far';
        fieldFarClip.style.width = '32px';
        fieldFarClip.flexGrow = 1;
        fieldFarClip.link(designerSettings, 'camera_far_clip');
        panelClip.append(fieldFarClip);


        // clear color
        var fieldClearColor = editor.call('attributes:addField', {
            parent: panel,
            name: 'Clear Color',
            type: 'vec4',
            link: designerSettings,
            path: 'camera_clear_color'
        });
        fieldClearColor[0].placeholder = 'R';
        fieldClearColor[1].placeholder = 'G';
        fieldClearColor[2].placeholder = 'B';
        fieldClearColor[3].placeholder = 'A';
    });
});
