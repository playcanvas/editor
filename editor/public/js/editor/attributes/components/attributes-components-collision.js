editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[entity]', function(entities) {
        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;

        var events = [ ];

        var panel = editor.call('attributes:entity:addComponentPanel', {
            title: 'Collision',
            name: 'collision',
            entities: entities
        });


        // type
        var fieldType = editor.call('attributes:addField', {
            parent: panel,
            name: 'Type',
            type: 'string',
            enum: {
                '': '...',
                'box': 'Box',
                'sphere': 'Sphere',
                'capsule': 'Capsule',
                'cylinder': 'Cylinder',
                'mesh': 'Mesh'
            },
            link: entities,
            path: 'components.collision.type'
        });
        // reference
        editor.call('attributes:reference:attach', 'collision:type', fieldType.parent.innerElement.firstChild.ui);


        // halfExtents
        var fieldHalfExtents = editor.call('attributes:addField', {
            parent: panel,
            name: 'Half Extents',
            placeholder: [ 'X', 'Y', 'Z' ],
            precision: 3,
            step: 0.1,
            min: 0,
            type: 'vec3',
            link: entities,
            path: 'components.collision.halfExtents'
        });
        fieldHalfExtents[0].parent.hidden = fieldType.value !== 'box' && fieldType.value !== '';
        fieldType.on('change', function(value) {
            fieldHalfExtents[0].parent.hidden = value !== 'box' && value !== '';
        });
        // reference
        editor.call('attributes:reference:attach', 'collision:halfExtents', fieldHalfExtents[0].parent.innerElement.firstChild.ui);


        // radius
        var fieldRadius = editor.call('attributes:addField', {
            parent: panel,
            name: 'Radius',
            type: 'number',
            precision: 2,
            step: 0.1,
            min: 0,
            link: entities,
            path: 'components.collision.radius'
        });
        fieldRadius.parent.hidden = fieldType.value !== '' && [ 'sphere', 'capsule', 'cylinder' ].indexOf(fieldType.value) === -1;
        fieldType.on('change', function(value) {
            fieldRadius.parent.hidden = value !== '' && [ 'sphere', 'capsule', 'cylinder' ].indexOf(value) === -1;
        });
        // reference
        editor.call('attributes:reference:attach', 'collision:radius', fieldRadius.parent.innerElement.firstChild.ui);


        // height
        var fieldHeight = editor.call('attributes:addField', {
            parent: panel,
            name: 'Height',
            type: 'number',
            precision: 2,
            step: 0.1,
            min: 0,
            link: entities,
            path: 'components.collision.height'
        });
        // show/hide
        fieldHeight.parent.hidden = fieldType.value !== '' && [ 'capsule', 'cylinder' ].indexOf(fieldType.value) === -1;
        fieldType.on('change', function(value) {
            fieldHeight.parent.hidden = value !== '' && [ 'capsule', 'cylinder' ].indexOf(value) === -1;
        });
        // reference
        editor.call('attributes:reference:attach', 'collision:height', fieldHeight.parent.innerElement.firstChild.ui);


        // axis
        var fieldAxis = editor.call('attributes:addField', {
            parent: panel,
            name: 'Axis',
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: 0, t: 'X' },
                { v: 1, t: 'Y' },
                { v: 2, t: 'Z' }
            ],
            link: entities,
            path: 'components.collision.axis'
        });
        fieldAxis.parent.hidden = fieldType.value !== '' && [ 'capsule', 'cylinder' ].indexOf(fieldType.value) === -1;
        fieldType.on('change', function(value) {
            fieldAxis.parent.hidden = value !== '' && [ 'capsule', 'cylinder' ].indexOf(value) === -1;
        });
        // reference
        editor.call('attributes:reference:attach', 'collision:axis', fieldAxis.parent.innerElement.firstChild.ui);


        // asset
        var fieldAsset = editor.call('attributes:addField', {
            parent: panel,
            name: 'Asset',
            type: 'asset',
            kind: 'model',
            link: entities,
            path: 'components.collision.asset'
        });
        fieldAsset.parent.hidden = fieldType.value !== '' && fieldType.value !== 'mesh';
        fieldType.on('change', function(value) {
            fieldAsset.parent.hidden = value !== '' && value !== 'mesh';
        });
        // reference
        editor.call('attributes:reference:attach', 'collision:asset', fieldAsset._label);

        if (editor.call("users:isSuperUser")) {
            if (!editor.call('project:settings:hasPhysics')) {
                // add import ammo button
                var group = editor.call('attributes:appendImportAmmo', panel);

                // restyle
                group.label.text = 'Ammo module not found';
                group.class.add('library-warning');
                group.label.class.add('library-warning-text');
            }
        }
    });
});
