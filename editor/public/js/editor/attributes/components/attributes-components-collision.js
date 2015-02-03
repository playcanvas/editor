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
        fieldEnabled.style.float = 'left';
        fieldEnabled.style.backgroundColor = '#323f42';
        fieldEnabled.style.margin = '3px 4px 3px -5px';
        fieldEnabled.link(entity, 'components.collision.enabled');
        panel.headerElement.appendChild(fieldEnabled.element);
        panel.on('destroy', function() {
            fieldEnabled.destroy();
        });

        // remove
        var fieldRemove = new ui.Checkbox();
        fieldRemove.style.float = 'right';
        fieldRemove.style.backgroundColor = '#323f42';
        fieldRemove.style.margin = '3px 4px 3px -5px';
        fieldRemove.on('change', function (value) {
            if (value) {
                entity.unset('components.collision');
                fieldRemove.value = false;
            }
        });
        panel.headerElement.appendChild(fieldRemove.element);
        panel.on('destroy', function() {
            fieldRemove.destroy();
        });

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


        // halfExtents
        var fieldHalfExtents = editor.call('attributes:addField', {
            parent: panel,
            name: 'Half Extents',
            placeholder: [ 'X', 'Y', 'Z' ],
            type: 'vec3',
            link: entity,
            path: 'components.collision.halfExtents'
        });

        fieldHalfExtents[0].parent.hidden = entity.get('components.collision.type') !== 'box';
        fieldType.on('change', function(value) {
            fieldHalfExtents[0].parent.hidden = value !== 'box';
        });


        // radius
        var fieldRadius = editor.call('attributes:addField', {
            parent: panel,
            name: 'Radius',
            type: 'number',
            link: entity,
            path: 'components.collision.radius'
        });
        fieldRadius.parent.hidden = [ 'sphere', 'capsule', 'cylinder' ].indexOf(entity.get('components.collision.type')) === -1;
        fieldType.on('change', function(value) {
            fieldRadius.parent.hidden = [ 'sphere', 'capsule', 'cylinder' ].indexOf(value) === -1;
        });


        // height
        var fieldHeight = editor.call('attributes:addField', {
            parent: panel,
            name: 'Height',
            type: 'number',
            link: entity,
            path: 'components.collision.height'
        });
        // show/hide
        fieldHeight.parent.hidden = [ 'capsule', 'cylinder' ].indexOf(entity.get('components.collision.type')) === -1;
        fieldType.on('change', function(value) {
            fieldHeight.parent.hidden = [ 'capsule', 'cylinder' ].indexOf(value) === -1;
        });


        // axis
        var fieldAxis = new ui.SelectField({
            number: true,
            options: {
                0: 'X',
                1: 'Y',
                2: 'Z'
            }
        });
        fieldAxis.style.width = '32px';
        fieldAxis.flexGrow = 1;
        fieldAxis.link(entity, 'components.collision.axis');
        fieldHeight.parent.append(fieldAxis);


        // asset
        var fieldAsset = editor.call('attributes:addField', {
            parent: panel,
            name: 'Asset',
            type: 'number',
            link: entity,
            path: 'components.collision.asset'
        });
        fieldAsset.parent.hidden = entity.get('components.collision.type') !== 'mesh';
        fieldType.on('change', function(value) {
            fieldAsset.parent.hidden = value !== 'mesh';
        });
    });
});
