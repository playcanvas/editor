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
        panel.class.add('component');

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
        fieldEnabled.class.add('component-toggle');
        fieldEnabled.link(entity, 'components.camera.enabled');
        panel.headerAppend(fieldEnabled);

        // remove
        var fieldRemove = new ui.Button();
        fieldRemove.class.add('component-remove');
        fieldRemove.on('click', function(value) {
            entity.unset('components.camera');
        });
        panel.headerAppend(fieldRemove);


        // clearColorBuffer
        var fieldClearColorBuffer = editor.call('attributes:addField', {
            parent: panel,
            type: 'checkbox',
            name: 'Clear Buffers',
            link: entity,
            path: 'components.camera.clearColorBuffer'
        });
        // label
        var label = new ui.Label({ text: 'Color' });
        label.class.add('label-infield');
        label.style.paddingRight = '12px';
        fieldClearColorBuffer.parent.append(label);


        // clearDepthBuffer
        var fieldClearDepthBuffer = new ui.Checkbox();
        fieldClearDepthBuffer.link(entity, 'components.camera.clearDepthBuffer');
        fieldClearColorBuffer.parent.append(fieldClearDepthBuffer);
        // label
        var label = new ui.Label({ text: 'Depth' });
        label.class.add('label-infield');
        fieldClearColorBuffer.parent.append(label);


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
            precision: 2,
            step: 1,
            min: 0,
            max: 90,
            link: entity,
            path: 'components.camera.fov'
        });
        fieldFov.style.width = '32px';
        fieldFov.parent.hidden = entity.get('components.camera.projection') !== 0;
        fieldProjection.on('change', function(value) {
            fieldFov.parent.hidden = value !== 0;
        });

        // fov slider
        var fieldFovSlider = new ui.Slider({
            min: 0,
            max: 90,
            precision: 1
        });
        fieldFovSlider.flexGrow = 4;
        fieldFovSlider.link(entity, 'components.camera.fov');
        fieldFov.parent.append(fieldFovSlider);


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


        // nearClip
        var fieldNearClip = editor.call('attributes:addField', {
            parent: panel,
            name: 'Clip',
            placeholder: 'Near',
            type: 'number',
            precision: 2,
            step: .1,
            min: 0,
            link: entity,
            path: 'components.camera.nearClip'
        });
        fieldNearClip.style.width = '32px';


        // farClip
        var fieldFarClip = new ui.NumberField({
            precision: 2,
            step: 1,
            min: 0,
        });
        fieldFarClip.placeholder = 'Far';
        fieldFarClip.style.width = '32px';
        fieldFarClip.flexGrow = 1;
        fieldFarClip.link(entity, 'components.camera.farClip');
        fieldNearClip.parent.append(fieldFarClip);


        // camera.priority
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Priority',
            type: 'number',
            precision: 1,
            step: 1,
            min: 0,
            link: entity,
            path: 'components.camera.priority'
        });


        // camera.rect
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Viewport',
            placeholder: [ 'X', 'Y', 'W', 'H' ],
            type: 'vec4',
            precision: 3,
            step: 0.01,
            min: 0,
            max: 1,
            link: entity,
            path: 'components.camera.rect'
        });
    });
});
