editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[entity]', function(entities) {
        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;

        var projectSettings = editor.call('settings:project');

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
            path: 'components.camera.clearColorBuffer',
            canOverrideTemplate: true
        });
        editor.call('attributes:registerOverridePath', 'components.camera.clearColorBuffer', fieldClearColorBuffer.element);

        // label
        var label = new ui.Label({ text: 'Color' });
        label.class.add('label-infield');
        label.style.paddingRight = '12px';
        fieldClearColorBuffer.parent.append(label);
        // reference
        editor.call('attributes:reference:attach', 'camera:clearColorBuffer', label);


        // clearDepthBuffer
        var fieldClearDepthBuffer = editor.call('attributes:addField', {
            panel: fieldClearColorBuffer.parent,
            type: 'checkbox',
            link: entities,
            path: 'components.camera.clearDepthBuffer'
        });
        editor.call('attributes:registerOverridePath', 'components.camera.clearDepthBuffer', fieldClearDepthBuffer.element);

        // label
        var label = new ui.Label({ text: 'Depth' });
        label.class.add('label-infield');
        fieldClearColorBuffer.parent.append(label);
        // reference
        editor.call('attributes:reference:attach', 'camera:clearDepthBuffer', label);


        // camera.clearColor
        var fieldClearColor = editor.call('attributes:addField', {
            parent: panel,
            name: 'Clear Color',
            type: 'rgb',
            link: entities,
            path: 'components.camera.clearColor',
            canOverrideTemplate: true
        });

        fieldClearColor.parent.hidden = ! (fieldClearColorBuffer.value || fieldClearColorBuffer.class.contains('null'));
        fieldClearColorBuffer.on('change', function(value) {
            fieldClearColor.parent.hidden = ! (value || this.class.contains('null'));
        });
        // reference
        editor.call('attributes:reference:attach', 'camera:clearColor', fieldClearColor.parent.innerElement.firstChild.ui);


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
            path: 'components.camera.projection',
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'camera:projection', fieldProjection.parent.innerElement.firstChild.ui);

        // frustumCulling
        var fieldFrustumCulling = editor.call('attributes:addField', {
            parent: panel,
            type: 'checkbox',
            name: 'Frustum Culling',
            link: entities,
            path: 'components.camera.frustumCulling',
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'camera:frustumCulling', fieldFrustumCulling.parent.innerElement.firstChild.ui);

        // camera.fov
        var fieldFov = editor.call('attributes:addField', {
            parent: panel,
            name: 'Field of View',
            placeholder: '\u00B0',
            type: 'number',
            precision: 2,
            step: 1,
            min: 0,
            link: entities,
            path: 'components.camera.fov',
            canOverrideTemplate: true
        });
        fieldFov.style.width = '32px';
        fieldFov.parent.hidden = fieldProjection.value !== 0 && fieldProjection.value !== '';
        fieldProjection.on('change', function(value) {
            fieldFov.parent.hidden = value !== 0 && value !== '';
        });
        // reference
        editor.call('attributes:reference:attach', 'camera:fov', fieldFov.parent.innerElement.firstChild.ui);

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
            path: 'components.camera.orthoHeight',
            canOverrideTemplate: true
        });
        fieldOrthoHeight.parent.hidden = fieldProjection.value !== 1 && fieldProjection.value !== '';
        fieldProjection.on('change', function(value) {
            fieldOrthoHeight.parent.hidden = value !== 1 && value !== '';
        });
        // reference
        editor.call('attributes:reference:attach', 'camera:orthoHeight', fieldOrthoHeight.parent.innerElement.firstChild.ui);


        // nearClip
        var fieldNearClip = editor.call('attributes:addField', {
            parent: panel,
            name: 'Clip',
            placeholder: 'Near',
            type: 'number',
            precision: 4,
            step: .1,
            min: 0,
            link: entities,
            path: 'components.camera.nearClip'
        });
        editor.call('attributes:registerOverridePath', 'components.camera.nearClip', fieldNearClip.element);

        fieldNearClip.style.width = '32px';
        // reference
        editor.call('attributes:reference:attach', 'camera:clip', fieldNearClip.parent.innerElement.firstChild.ui);


        // farClip
        var fieldFarClip = editor.call('attributes:addField', {
            panel: fieldNearClip.parent,
            placeholder: 'Far',
            type: 'number',
            precision: 4,
            step: .1,
            min: 0,
            link: entities,
            path: 'components.camera.farClip'
        });
        editor.call('attributes:registerOverridePath', 'components.camera.farClip', fieldFarClip.element);
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
            path: 'components.camera.priority',
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'camera:priority', fieldPriority.parent.innerElement.firstChild.ui);


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
            path: 'components.camera.rect',
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'camera:rect', fieldRect[0].parent.innerElement.firstChild.ui);

        // layers
        var layers = projectSettings.get('layers');
        var layersEnum = {
            '': ''
        };
        for (var key in layers) {
            layersEnum[key] = layers[key].name;
        }

        var fieldLayers = editor.call('attributes:addField', {
            parent: panel,
            name: 'Layers',
            type: 'tags',
            tagType: 'number',
            enum: layersEnum,
            placeholder: 'Add Layer',
            link: entities,
            path: 'components.camera.layers',
            canOverrideTemplate: true,
            tagToString: function (tag) {
                return projectSettings.get('layers.' + tag + '.name') || 'Missing';
            },
            onClickTag: function () {
                // focus layer
                var layerId = this.originalValue;
                editor.call('selector:set', 'editorSettings', [ editor.call('settings:projectUser') ]);
                setTimeout(function () {
                    editor.call('editorSettings:layers:focus', layerId);
                });
            }
        });

        // reference
        editor.call('attributes:reference:attach', 'camera:layers', fieldLayers.parent.parent.innerElement.firstChild.ui);
    });
});
