editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[entity]', function(entities) {
        if (entities.length !== 1)
            return;

        var entity = entities[0];

        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;

        // camera
        var panel = editor.call('attributes:addPanel', {
            parent: panelComponents,
            name: 'Camera'
        });
        if (! entity.get('components.camera')) {
            panel.disabled = true;
            panel.hidden = true;
        }
        var evtComponentSet = entity.on('components.camera:set', function(value) {
            panel.disabled = ! value;
            panel.hidden = ! value;
        });
        var evtComponentUnset = entity.on('components.camera:unset', function() {
            panel.disabled = true;
            panel.hidden = true;
        });
        panel.on('destroy', function() {
            evtComponentSet.unbind();
            evtComponentUnset.unbind();
        });


        // enabled
        var fieldEnabled = new ui.Checkbox();
        fieldEnabled.style.float = 'left';
        fieldEnabled.style.backgroundColor = '#323f42';
        fieldEnabled.style.margin = '3px 4px 3px -5px';
        fieldEnabled.link(entity, 'components.camera.enabled');
        panel.headerElement.appendChild(fieldEnabled.element);
        panel.on('destroy', function() {
            fieldEnabled.destroy();
        });

        // clear
        var panelClear = new ui.Panel();
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Clear Buffers',
            type: 'element',
            element: panelClear
        });

        // clearColorBuffer
        var fieldClearColorBuffer = new ui.Checkbox();
        fieldClearColorBuffer.link(entity, 'components.camera.clearColorBuffer');
        panelClear.append(fieldClearColorBuffer);
        // label
        var label = new ui.Label({ text: 'Color' });
        label.style.verticalAlign = 'top';
        label.style.paddingRight = '12px';
        label.style.fontSize = '12px';
        label.style.lineHeight = '26px';
        panelClear.append(label);

        // clearDepthBuffer
        var fieldClearDepthBuffer = new ui.Checkbox();
        fieldClearDepthBuffer.link(entity, 'components.camera.clearDepthBuffer');
        panelClear.append(fieldClearDepthBuffer);
        // label
        var label = new ui.Label({ text: 'Depth' });
        label.style.verticalAlign = 'top';
        label.style.fontSize = '12px';
        label.style.lineHeight = '26px';
        panelClear.append(label);

        // camera.clearColor
        var fieldClearColor = editor.call('attributes:addField', {
            parent: panel,
            name: 'Clear Color',
            type: 'rgb', // TODO rgba
            link: entity,
            path: 'components.camera.clearColor'
        });
        fieldClearColor.parent.hidden = ! entity.get('components.camera.clearColorBuffer');
        fieldClearColorBuffer.on('change', function(value) {
            fieldClearColor.parent.hidden = ! value;
        });

        // camera.projection
        var fieldProjection = editor.call('attributes:addField', {
            parent: panel,
            name: 'Projection',
            type: 'number',
            enum: {
                0: 'Perspective', // pc.PROJECTION_PERSPECTIVE
                1: 'Orthographic' // pc.PROJECTION_ORTHOGRAPHIC
            },
            link: entity,
            path: 'components.camera.projection'
        });

        // camera.fov
        var fieldFov = editor.call('attributes:addField', {
            parent: panel,
            name: 'Field of View',
            placeholder: '\u00B0',
            type: 'number',
            link: entity,
            path: 'components.camera.fov'
        });
        fieldFov.parent.hidden = entity.get('components.camera.projection') !== 0;
        fieldProjection.on('change', function(value) {
            fieldFov.parent.hidden = value !== 0;
        });

        // camera.orthoHeight
        var fieldOrthoHeight = editor.call('attributes:addField', {
            parent: panel,
            name: 'Ortho Height',
            type: 'number',
            link: entity,
            path: 'components.camera.orthoHeight'
        });
        fieldOrthoHeight.parent.hidden = entity.get('components.camera.projection') !== 1;
        fieldProjection.on('change', function(value) {
            fieldOrthoHeight.parent.hidden = value !== 1;
        });

        // camera near/far clip
        var panelClip = editor.call('attributes:addField', {
            parent: panel,
            name: 'Clip'
        });

        var label = panelClip;
        panelClip = panelClip.parent;
        label.destroy();

        var fieldNearClip = new ui.NumberField();
        fieldNearClip.placeholder = 'Near';
        fieldNearClip.style.width = '32px';
        fieldNearClip.flexGrow = 1;
        fieldNearClip.link(entity, 'components.camera.nearClip');
        panelClip.append(fieldNearClip);

        var fieldFarClip = new ui.NumberField();
        fieldFarClip.placeholder = 'Far';
        fieldFarClip.style.width = '32px';
        fieldFarClip.flexGrow = 1;
        fieldFarClip.link(entity, 'components.camera.farClip');
        panelClip.append(fieldFarClip);

        // camera.priority
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Priority',
            type: 'number',
            link: entity,
            path: 'components.camera.priority'
        });

        // camera.rect
        var fieldViewport = editor.call('attributes:addField', {
            parent: panel,
            name: 'Viewport',
            placeholder: [ 'X', 'Y', 'W', 'H' ],
            type: 'vec4',
            link: entity,
            path: 'components.camera.rect'
        });
    });
});
