editor.once('load', function() {
    'use strict';

    var panelComponents;

    editor.method('attributes:entity.panelComponents', function() {
        return panelComponents;
    });


    editor.on('attributes:inspect[entity]', function(entities) {
        if (entities.length !== 1)
            return;

        window.A = entities[0];

        var entity = entities[0];

        // enabled
        editor.call('attributes:addField', {
            name: 'Enabled',
            type: 'checkbox',
            link: entity,
            path: 'enabled'
        });

        // name
        editor.call('attributes:addField', {
            name: 'Name',
            type: 'string',
            link: entity,
            path: 'name'
        });

        // position
        var fieldPosition = editor.call('attributes:addField', {
            name: 'Position',
            placeholder: [ 'X', 'Y', 'Z' ],
            precision: 3,
            step: .05,
            type: 'vec3',
            link: entity,
            path: 'position'
        });

        // rotation
        var fieldRotation = editor.call('attributes:addField', {
            name: 'Rotation',
            placeholder: [ 'X', 'Y', 'Z' ],
            precision: 2,
            step: .1,
            type: 'vec3',
            link: entity,
            path: 'rotation'
        });

        // scale
        var fieldScale = editor.call('attributes:addField', {
            name: 'Scale',
            placeholder: [ 'X', 'Y', 'Z' ],
            precision: 3,
            step: .05,
            type: 'vec3',
            link: entity,
            path: 'scale'
        });


        // components
        panelComponents = editor.call('attributes:addPanel');

        // get all components and make an enum out of them
        var allComponents = editor.call('components:list');

        // return an enum for a select field showing all the
        // components that are not currently added to the entity
        var createComponentEnum = function () {
            var result = { };

            allComponents.filter(function (item) {
                return ! entity.components[item];
            })
            .forEach(function (item) {
                result[item] = item;
            });

            return result;
        };

        // show components in a select field
        var addComponent = editor.call('attributes:addField', {
            parent: panelComponents,
            name: 'Add Component',
            type: 'string',
            enum: createComponentEnum()
        });

        // refresh available components on click
        addComponent.on('click', function () {
            addComponent._updateOptions(createComponentEnum());
        });

        // add component
        addComponent.on('change', function (value) {
            if (! value) return;

            var componentData = editor.call('components:getDefault', value);
            entity.set('components.' + value, componentData);
            // reset displayed value
            addComponent.value = null;
        });

        var panelJson = editor.call('attributes:addPanel', {
            name: 'JSON'
        });

        // code
        var fieldJson = editor.call('attributes:addField', {
            parent: panelJson,
            type: 'code'
        });

        fieldJson.text = JSON.stringify(entity.json(), null, 4);

        // changes
        var evtSet = entity.on('*:set', function() {
            fieldJson.text = JSON.stringify(entity.json(), null, 4);
        });
        var evtUnset = entity.on('*:unset', function() {
            fieldJson.text = JSON.stringify(entity.json(), null, 4);
        });
        var evtInsert = entity.on('*:insert', function() {
            fieldJson.text = JSON.stringify(entity.json(), null, 4);
        });
        var evtRemove = entity.on('*:remove', function() {
            fieldJson.text = JSON.stringify(entity.json(), null, 4);
        });
        var evtMove = entity.on('*:move', function() {
            fieldJson.text = JSON.stringify(entity.json(), null, 4);
        });

        fieldJson.on('destroy', function() {
            evtSet.unbind();
            evtUnset.unbind();
            evtInsert.unbind();
            evtRemove.unbind();
            evtMove.unbind();
        });
    });
});
