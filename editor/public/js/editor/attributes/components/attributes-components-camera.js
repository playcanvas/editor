editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[entity]', function(entities) {
        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;

        var panel = editor.call('attributes:entity:addComponentPanel', {
            title: 'Camera',
            name: 'camera',
            entities: entities
        });


        // clearColorBuffer
        var fieldClearColorBuffer = editor.call('attributes:addField', {
            parent: panel,
            type: 'checkbox',
            name: 'Clear Buffers',
            link: entities,
            path: 'components.camera.clearColorBuffer'
        });
        // label
        var label = new ui.Label({ text: 'Color' });
        label.class.add('label-infield');
        label.style.paddingRight = '12px';
        fieldClearColorBuffer.parent.append(label);
        // reference
        editor.call('attributes:reference:camera:clearColorBuffer:attach', label);


        // clearDepthBuffer
        var fieldCastShadows = editor.call('attributes:addField', {
            panel: fieldClearColorBuffer.parent,
            type: 'checkbox',
            link: entities,
            path: 'components.camera.clearDepthBuffer'
        });
        // label
        var label = new ui.Label({ text: 'Depth' });
        label.class.add('label-infield');
        fieldClearColorBuffer.parent.append(label);
        // reference
        editor.call('attributes:reference:camera:clearDepthBuffer:attach', label);


        // camera.clearColor
        var fieldClearColor = editor.call('attributes:addField', {
            parent: panel,
            name: 'Clear Color',
            type: 'rgb',
            link: entities,
            path: 'components.camera.clearColor'
        });
        fieldClearColor.parent.hidden = ! (fieldClearColorBuffer.value || fieldClearColorBuffer.class.contains('null'));
        fieldClearColorBuffer.on('change', function(value) {
            fieldClearColor.parent.hidden = ! (value || this.class.contains('null'));
        });
        // reference
        editor.call('attributes:reference:camera:clearColor:attach', fieldClearColor.parent.innerElement.firstChild.ui);


        // camera.projection
        var fieldProjection = editor.call('attributes:addField', {
            parent: panel,
            name: 'Projection',
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: 0, t: 'Perspective' }, // pc.PROJECTION_PERSPECTIVE
                { v: 1, t: 'Orthographic' } // pc.PROJECTION_ORTHOGRAPHIC
            ],
            link: entities,
            path: 'components.camera.projection'
        });
        // reference
        editor.call('attributes:reference:camera:projection:attach', fieldProjection.parent.innerElement.firstChild.ui);


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
            link: entities,
            path: 'components.camera.fov'
        });
        fieldFov.style.width = '32px';
        fieldFov.parent.hidden = fieldProjection.value !== 0 && fieldProjection.value !== '';
        fieldProjection.on('change', function(value) {
            fieldFov.parent.hidden = value !== 0 && value !== '';
        });
        // reference
        editor.call('attributes:reference:camera:fov:attach', fieldFov.parent.innerElement.firstChild.ui);

        // fov slider
        var fieldFovSlider = editor.call('attributes:addField', {
            panel: fieldFov.parent,
            precision: 2,
            step: 1,
            min: 0,
            max: 90,
            type: 'number',
            slider: true,
            link: entities,
            path: 'components.camera.fov'
        });
        fieldFovSlider.flexGrow = 4;

        // camera.orthoHeight
        var fieldOrthoHeight = editor.call('attributes:addField', {
            parent: panel,
            name: 'Ortho Height',
            type: 'number',
            link: entities,
            path: 'components.camera.orthoHeight'
        });
        fieldOrthoHeight.parent.hidden = fieldProjection.value !== 1 && fieldProjection.value !== '';
        fieldProjection.on('change', function(value) {
            fieldOrthoHeight.parent.hidden = value !== 1 && value !== '';
        });
        // reference
        editor.call('attributes:reference:camera:orthoHeight:attach', fieldOrthoHeight.parent.innerElement.firstChild.ui);


        // nearClip
        var fieldNearClip = editor.call('attributes:addField', {
            parent: panel,
            name: 'Clip',
            placeholder: 'Near',
            type: 'number',
            precision: 2,
            step: .1,
            min: 0,
            link: entities,
            path: 'components.camera.nearClip'
        });
        fieldNearClip.style.width = '32px';
        // reference
        editor.call('attributes:reference:camera:clip:attach', fieldNearClip.parent.innerElement.firstChild.ui);


        // farClip
        var fieldFarClip = editor.call('attributes:addField', {
            panel: fieldNearClip.parent,
            placeholder: 'Far',
            type: 'number',
            precision: 2,
            step: .1,
            min: 0,
            link: entities,
            path: 'components.camera.farClip'
        });
        fieldFarClip.style.width = '32px';


        // camera.priority
        var fieldPriority = editor.call('attributes:addField', {
            parent: panel,
            name: 'Priority',
            type: 'number',
            precision: 1,
            step: 1,
            min: 0,
            link: entities,
            path: 'components.camera.priority'
        });
        // reference
        editor.call('attributes:reference:camera:priority:attach', fieldPriority.parent.innerElement.firstChild.ui);


        // camera.rect
        var fieldRect = editor.call('attributes:addField', {
            parent: panel,
            name: 'Viewport',
            placeholder: [ 'X', 'Y', 'W', 'H' ],
            type: 'vec4',
            precision: 3,
            step: 0.01,
            min: 0,
            max: 1,
            link: entities,
            path: 'components.camera.rect'
        });
        // reference
        editor.call('attributes:reference:camera:rect:attach', fieldRect[0].parent.innerElement.firstChild.ui);
    });
});
