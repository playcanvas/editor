editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[entity]', function(entities) {
        if (entities.length !== 1)
            return;

        var entity = entities[0];

        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;


        // rigidbody
        var panel = editor.call('attributes:addPanel', {
            parent: panelComponents,
            name: 'Rigid Body'
        });
        if (! entity.get('components.rigidbody')) {
            panel.disabled = true;
            panel.hidden = true;
        }
        var evtComponentSet = entity.on('components.rigidbody:set', function(value) {
            panel.disabled = ! value;
            panel.hidden = ! value;
        });
        var evtComponentUnset = entity.on('components.rigidbody:unset', function() {
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
        fieldEnabled.link(entity, 'components.rigidbody.enabled');
        panel.headerElement.appendChild(fieldEnabled.element);
        panel.on('destroy', function() {
            fieldEnabled.destroy();
        });


        // type
        var fieldType = editor.call('attributes:addField', {
            parent: panel,
            name: 'Type',
            type: 'string',
            enum: {
                'static': 'Static',
                'dynamic': 'Dynamic',
                'kinematic': 'Kinematic'
            },
            link: entity,
            path: 'components.rigidbody.type'
        });


        // dynamic/kinematic fields
        var panelDynamic = editor.call('attributes:addPanel', {
            parent: panel
        });
        panelDynamic.hidden = entity.get('components.rigidbody.type') === 'static';
        fieldType.on('change', function(value) {
            panelDynamic.hidden = value === 'static';
        });

        // mass
        var fieldMass = editor.call('attributes:addField', {
            parent: panelDynamic,
            name: 'Mass',
            type: 'number',
            link: entity,
            path: 'components.rigidbody.mass'
        });
        fieldMass.placeholder = 'Kg';


        // linearDamping
        var fieldLinearDamping = editor.call('attributes:addField', {
            parent: panelDynamic,
            name: 'Damping',
            placeholder: 'Linear',
            type: 'number',
            link: entity,
            path: 'components.rigidbody.linearDamping'
        });
        fieldLinearDamping.style.width = '32px';


        // angularDamping
        var fieldAngularDamping = new ui.NumberField();
        fieldAngularDamping.placeholder = 'Angular';
        fieldAngularDamping.style.width = '32px';
        fieldAngularDamping.flexGrow = 1;
        fieldAngularDamping.link(entity, 'components.rigidbody.angularDamping');
        fieldLinearDamping.parent.append(fieldAngularDamping);


        // linearFactor
        var fieldLinearFactor = editor.call('attributes:addField', {
            parent: panelDynamic,
            name: 'Linear Factor',
            placeholder: [ 'X', 'Y', 'Z' ],
            type: 'vec3',
            link: entity,
            path: 'components.rigidbody.linearFactor'
        });


        // angularFactor
        var fieldAngularFactor = editor.call('attributes:addField', {
            parent: panelDynamic,
            name: 'Angular Factor',
            placeholder: [ 'X', 'Y', 'Z' ],
            type: 'vec3',
            link: entity,
            path: 'components.rigidbody.angularFactor'
        });


        // friction
        var fieldFriction = editor.call('attributes:addField', {
            parent: panel,
            name: 'Properties',
            placeholder: 'Friction',
            type: 'number',
            link: entity,
            path: 'components.rigidbody.friction'
        });
        fieldFriction.style.width = '32px';


        // restitution
        var fieldRestitution = new ui.NumberField();
        fieldRestitution.placeholder = 'Restitution';
        fieldRestitution.style.width = '32px';
        fieldRestitution.flexGrow = 1;
        fieldRestitution.link(entity, 'components.rigidbody.restitution');
        fieldFriction.parent.append(fieldRestitution);
    });
});
