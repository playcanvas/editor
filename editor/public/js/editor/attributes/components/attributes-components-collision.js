editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[entity]', function(entities) {
        if (entities.length !== 1)
            return;

        var entity = entities[0];

        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;


        // collision
        var panel = editor.call('attributes:addPanel', {
            parent: panelComponents,
            name: 'Collision'
        });
        panel.class.add('component');
        // reference
        editor.call('attributes:reference:collision:attach', panel, panel.headerElement);

        if (! entity.get('components.collision')) {
            panel.disabled = true;
            panel.hidden = true;
        }
        var evtComponentSet = entity.on('components.collision:set', function(value) {
            panel.disabled = ! value;
            panel.hidden = ! value;
        });
        var evtComponentUnset = entity.on('components.collision:unset', function() {
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
        fieldEnabled.link(entity, 'components.collision.enabled');
        panel.headerAppend(fieldEnabled);

        // remove
        var fieldRemove = new ui.Button();
        fieldRemove.class.add('component-remove');
        fieldRemove.on('click', function(value) {
            entity.unset('components.collision');
        });
        panel.headerAppend(fieldRemove);


        // type
        var fieldType = editor.call('attributes:addField', {
            parent: panel,
            name: 'Type',
            type: 'string',
            enum: {
                'box': 'Box',
                'sphere': 'Sphere',
                'capsule': 'Capsule',
                'cylinder': 'Cylinder',
                'mesh': 'Mesh'
            },
            link: entity,
            path: 'components.collision.type'
        });
        // reference
        editor.call('attributes:reference:collision:type:attach', fieldType.parent.innerElement.firstChild.ui);


        // halfExtents
        var fieldHalfExtents = editor.call('attributes:addField', {
            parent: panel,
            name: 'Half Extents',
            placeholder: [ 'X', 'Y', 'Z' ],
            precision: 2,
            step: 0.1,
            min: 0,
            type: 'vec3',
            link: entity,
            path: 'components.collision.halfExtents'
        });
        fieldHalfExtents[0].parent.hidden = entity.get('components.collision.type') !== 'box';
        fieldType.on('change', function(value) {
            fieldHalfExtents[0].parent.hidden = value !== 'box';
        });
        // reference
        editor.call('attributes:reference:collision:halfExtents:attach', fieldHalfExtents[0].parent.innerElement.firstChild.ui);


        // radius
        var fieldRadius = editor.call('attributes:addField', {
            parent: panel,
            name: 'Radius',
            type: 'number',
            precision: 2,
            step: 0.1,
            min: 0,
            link: entity,
            path: 'components.collision.radius'
        });
        fieldRadius.parent.hidden = [ 'sphere', 'capsule', 'cylinder' ].indexOf(entity.get('components.collision.type')) === -1;
        fieldType.on('change', function(value) {
            fieldRadius.parent.hidden = [ 'sphere', 'capsule', 'cylinder' ].indexOf(value) === -1;
        });
        // reference
        editor.call('attributes:reference:collision:radius:attach', fieldRadius.parent.innerElement.firstChild.ui);


        // height
        var fieldHeight = editor.call('attributes:addField', {
            parent: panel,
            name: 'Height',
            type: 'number',
            precision: 2,
            step: 0.1,
            min: 0,
            link: entity,
            path: 'components.collision.height'
        });
        // show/hide
        fieldHeight.parent.hidden = [ 'capsule', 'cylinder' ].indexOf(entity.get('components.collision.type')) === -1;
        fieldType.on('change', function(value) {
            fieldHeight.parent.hidden = [ 'capsule', 'cylinder' ].indexOf(value) === -1;
        });
        // reference
        editor.call('attributes:reference:collision:height:attach', fieldHeight.parent.innerElement.firstChild.ui);


        // axis
        var fieldAxis = editor.call('attributes:addField', {
            parent: panel,
            name: 'Axis',
            type: 'number',
            enum: {
                0: 'X',
                1: 'Y',
                2: 'Z'
            },
            link: entity,
            path: 'components.collision.axis'
        });
        fieldAxis.parent.hidden = [ 'capsule', 'cylinder' ].indexOf(entity.get('components.collision.type')) === -1;
        fieldType.on('change', function(value) {
            fieldAxis.parent.hidden = [ 'capsule', 'cylinder' ].indexOf(value) === -1;
        });
        // reference
        editor.call('attributes:reference:collision:axis:attach', fieldAxis.parent.innerElement.firstChild.ui);


        // asset
        var fieldAsset = editor.call('attributes:addField', {
            parent: panel,
            name: 'Asset',
            type: 'asset',
            kind: 'model',
            link: entity,
            path: 'components.collision.asset'
        });
        fieldAsset.parent.hidden = entity.get('components.collision.type') !== 'mesh';
        fieldType.on('change', function(value) {
            fieldAsset.parent.hidden = value !== 'mesh';
            if (fieldAsset.parent.hidden)
                fieldAsset.value = null;
        });
        // reference
        editor.call('attributes:reference:collision:asset:attach', fieldAsset.parent.innerElement.firstChild.ui);
    });
});
