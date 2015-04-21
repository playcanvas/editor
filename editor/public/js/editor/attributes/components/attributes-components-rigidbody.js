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
        panel.class.add('component');

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
        fieldEnabled.class.add('component-toggle');
        fieldEnabled.link(entity, 'components.rigidbody.enabled');
        panel.headerAppend(fieldEnabled);

        // remove
        var fieldRemove = new ui.Button();
        fieldRemove.class.add('component-remove');
        fieldRemove.on('click', function(value) {
            entity.unset('components.rigidbody');
        });
        panel.headerAppend(fieldRemove);


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
        panelDynamic.hidden = entity.get('components.rigidbody.type') !== 'dynamic';
        fieldType.on('change', function(value) {
            panelDynamic.hidden = value !== 'dynamic';
        });

        // mass
        var fieldMass = editor.call('attributes:addField', {
            parent: panelDynamic,
            name: 'Mass',
            type: 'number',
            precision: 2,
            step: .1,
            min: 0,
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
            precision: 2,
            step: .01,
            min: 0,
            max: 1,
            link: entity,
            path: 'components.rigidbody.linearDamping'
        });
        fieldLinearDamping.style.width = '32px';


        // angularDamping
        var fieldAngularDamping = new ui.NumberField({
            precision: 2,
            step: .01,
            min: 0,
            max: 1
        });
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
            precision: 2,
            step: .01,
            min: 0,
            max: 1,
            type: 'vec3',
            link: entity,
            path: 'components.rigidbody.linearFactor'
        });


        // angularFactor
        var fieldAngularFactor = editor.call('attributes:addField', {
            parent: panelDynamic,
            name: 'Angular Factor',
            placeholder: [ 'X', 'Y', 'Z' ],
            precision: 2,
            step: .01,
            min: 0,
            max: 1,
            type: 'vec3',
            link: entity,
            path: 'components.rigidbody.angularFactor'
        });


        // friction
        var fieldFriction = editor.call('attributes:addField', {
            parent: panel,
            name: '',
            placeholder: 'Friction',
            type: 'number',
            precision: 2,
            step: .01,
            min: 0,
            max: 1,
            link: entity,
            path: 'components.rigidbody.friction'
        });
        fieldFriction.style.width = '32px';


        // restitution
        var fieldRestitution = new ui.NumberField({
            precision: 2,
            step: .01,
            min: 0,
            max: 1
        });
        fieldRestitution.placeholder = 'Restitution';
        fieldRestitution.style.width = '32px';
        fieldRestitution.flexGrow = 1;
        fieldRestitution.link(entity, 'components.rigidbody.restitution');
        fieldFriction.parent.append(fieldRestitution);


        var panelFrictionRestitution = editor.call('attributes:addField', {
            parent: panel,
            name: ''
        });

        var label = panelFrictionRestitution;
        panelFrictionRestitution = panelFrictionRestitution.parent;
        label.destroy();

        // friction slider
        var fieldFrictionSlider = new ui.Slider({
            min: 0,
            max: 1,
            precision: 3
        });
        fieldFrictionSlider.flexGrow = 1;
        fieldFrictionSlider.link(entity, 'components.rigidbody.friction');
        panelFrictionRestitution.append(fieldFrictionSlider);

        // restitution slider
        var fieldRestitutionSlider = new ui.Slider({
            min: 0,
            max: 1,
            precision: 3
        });
        fieldRestitutionSlider.flexGrow = 1;
        fieldRestitutionSlider.link(entity, 'components.rigidbody.restitution');
        panelFrictionRestitution.append(fieldRestitutionSlider);
    });
});
