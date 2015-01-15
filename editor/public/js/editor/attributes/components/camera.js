editor.once('load', function() {
    'use strict';

    var projections = {
        0: 'Perspective',
        1: 'Orthographic'
    };

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

        // camera.clear
        var panelClear = new ui.Panel();
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Clear Buffers',
            type: 'element',
            element: panelClear
        });

        // camera.clearColorBuffer
        var fieldClearColorBuffer = new ui.Checkbox();
        fieldClearColorBuffer.link(entity, 'components.camera.clearColorBuffer');
        panelClear.append(fieldClearColorBuffer);
        // label
        var label = new ui.Label('Color');
        label.style.verticalAlign = 'top';
        label.style.paddingRight = '12px';
        label.style.fontSize = '12px';
        label.style.lineHeight = '26px';
        panelClear.append(label);

        // camera.clearDepthBuffer
        var fieldClearDepthBuffer = new ui.Checkbox();
        fieldClearDepthBuffer.link(entity, 'components.camera.clearDepthBuffer');
        panelClear.append(fieldClearDepthBuffer);
        // label
        var label = new ui.Label('Depth');
        label.style.verticalAlign = 'top';
        label.style.fontSize = '12px';
        label.style.lineHeight = '26px';
        panelClear.append(label);

        // camera.clearColor
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Clear Color',
            type: 'rgb', // TODO rgba
            link: entity,
            path: 'components.camera.clearColor'
        });

        // camera.projection
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Projection',
            type: 'number',
            enum: projections,
            link: entity,
            path: 'components.camera.projection'
        });

        // camera.fov
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Field of View',
            type: 'number',
            link: entity,
            path: 'components.camera.fov'
        });

        // camera.orthoHeight
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Ortho Height',
            type: 'number',
            link: entity,
            path: 'components.camera.orthoHeight'
        });

        // camera near/far clip
        var panelClip = editor.call('attributes:addField', {
            parent: panel,
            name: 'Near/Far Clip'
        });

        var label = panelClip;
        panelClip = panelClip.parent;
        label.destroy();

        var fieldNearClip = new ui.NumberField();
        fieldNearClip.style.width = '32px';
        fieldNearClip.flexGrow = 1;
        fieldNearClip.link(entity, 'components.camera.nearClip');
        panelClip.append(fieldNearClip);

        var fieldFarClip = new ui.NumberField();
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
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Viewport',
            type: 'vec4',
            link: entity,
            path: 'components.camera.rect'
        });
    });
});
