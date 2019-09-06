editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[entity]', function(entities) {
        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;

        var events = [ ];

        var panel = editor.call('attributes:entity:addComponentPanel', {
            title: 'Rigid Body',
            name: 'rigidbody',
            entities: entities
        });

        // type
        var fieldType = editor.call('attributes:addField', {
            parent: panel,
            name: 'Type',
            type: 'string',
            enum: {
                '': '...',
                'static': 'Static',
                'dynamic': 'Dynamic',
                'kinematic': 'Kinematic'
            },
            link: entities,
            path: 'components.rigidbody.type'
        });
        // reference
        editor.call('attributes:reference:attach', 'rigidbody:type', fieldType.parent.innerElement.firstChild.ui);


        // dynamic/kinematic fields
        var panelDynamic = editor.call('attributes:addPanel', {
            parent: panel
        });
        panelDynamic.hidden = fieldType.value !== '' && fieldType.value !== 'dynamic';
        fieldType.on('change', function(value) {
            panelDynamic.hidden = value !== '' && value !== 'dynamic';
        });

        // mass
        var fieldMass = editor.call('attributes:addField', {
            parent: panelDynamic,
            name: 'Mass',
            type: 'number',
            precision: 2,
            step: .1,
            min: 0,
            link: entities,
            path: 'components.rigidbody.mass'
        });
        fieldMass.placeholder = 'Kg';
        // reference
        editor.call('attributes:reference:attach', 'rigidbody:mass', fieldMass.parent.innerElement.firstChild.ui);


        // linearDamping
        var fieldLinearDamping = editor.call('attributes:addField', {
            parent: panelDynamic,
            name: 'Damping',
            placeholder: 'Linear',
            type: 'number',
            precision: 6,
            step: .01,
            min: 0,
            max: 1,
            link: entities,
            path: 'components.rigidbody.linearDamping'
        });
        fieldLinearDamping.style.width = '32px';
        // reference
        editor.call('attributes:reference:attach', 'rigidbody:damping', fieldLinearDamping.parent.innerElement.firstChild.ui);


        // angularDamping
        var fieldAngularDamping = editor.call('attributes:addField', {
            panel: fieldLinearDamping.parent,
            placeholder: 'Angular',
            type: 'number',
            precision: 6,
            step: .01,
            min: 0,
            max: 1,
            link: entities,
            path: 'components.rigidbody.angularDamping'
        });
        fieldAngularDamping.style.width = '32px';


        // linearFactor
        var fieldLinearFactor = editor.call('attributes:addField', {
            parent: panelDynamic,
            name: 'Linear Factor',
            placeholder: [ 'X', 'Y', 'Z' ],
            precision: 4,
            step: .01,
            min: 0,
            max: 1,
            type: 'vec3',
            link: entities,
            path: 'components.rigidbody.linearFactor'
        });
        // reference
        editor.call('attributes:reference:attach', 'rigidbody:linearFactor', fieldLinearFactor[0].parent.innerElement.firstChild.ui);


        // angularFactor
        var fieldAngularFactor = editor.call('attributes:addField', {
            parent: panelDynamic,
            name: 'Angular Factor',
            placeholder: [ 'X', 'Y', 'Z' ],
            precision: 4,
            step: .01,
            min: 0,
            max: 1,
            type: 'vec3',
            link: entities,
            path: 'components.rigidbody.angularFactor'
        });
        // reference
        editor.call('attributes:reference:attach', 'rigidbody:angularFactor', fieldAngularFactor[0].parent.innerElement.firstChild.ui);


        // friction
        var fieldFriction = editor.call('attributes:addField', {
            parent: panel,
            name: 'Friction',
            type: 'number',
            precision: 4,
            step: .01,
            min: 0,
            max: 1,
            link: entities,
            path: 'components.rigidbody.friction'
        });
        fieldFriction.style.width = '32px';
        // reference
        editor.call('attributes:reference:attach', 'rigidbody:friction', fieldFriction.parent.innerElement.firstChild.ui);


        // friction slider
        var fieldFrictionSlider = editor.call('attributes:addField', {
            panel: fieldFriction.parent,
            precision: 4,
            min: 0,
            max: 1,
            type: 'number',
            slider: true,
            link: entities,
            path: 'components.rigidbody.friction'
        });
        fieldFrictionSlider.flexGrow = 4;


        // restitution
        var fieldRestitution = editor.call('attributes:addField', {
            parent: panel,
            name: 'Restitution',
            type: 'number',
            precision: 4,
            step: .01,
            min: 0,
            max: 1,
            link: entities,
            path: 'components.rigidbody.restitution'
        });
        fieldRestitution.style.width = '32px';
        // reference
        editor.call('attributes:reference:attach', 'rigidbody:restitution', fieldRestitution.parent.innerElement.firstChild.ui);


        // restitution slider
        var fieldRestitutionSlider = editor.call('attributes:addField', {
            panel: fieldRestitution.parent,
            precision: 3,
            min: 0,
            max: 1,
            type: 'number',
            slider: true,
            link: entities,
            path: 'components.rigidbody.restitution'
        });
        fieldRestitutionSlider.flexGrow = 4;

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
