editor.once('load', function() {
    'use strict';

    var panelComponents;

    editor.method('attributes:entity.panelComponents', function() {
        return panelComponents;
    });


    editor.on('attributes:inspect[entity]', function(entities) {
        if (entities.length !== 1)
            return;

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
            type: 'vec3',
            link: entity,
            path: 'position'
        });

        // rotation
        var fieldRotation = editor.call('attributes:addField', {
            name: 'Rotation',
            placeholder: [ 'X', 'Y', 'Z' ],
            type: 'vec3',
            link: entity,
            path: 'rotation'
        });

        // scale
        var fieldScale = editor.call('attributes:addField', {
            name: 'Scale',
            placeholder: [ 'X', 'Y', 'Z' ],
            type: 'vec3',
            link: entity,
            path: 'scale'
        });


        // components
        panelComponents = editor.call('attributes:addPanel');

        var addComponent = editor.call('attributes:addField', {
            parent: panelComponents,
            name: 'Add Component',
            type: 'string',
            enum: {
                '': '',
                'animation': 'Animation',
                'light': 'Light'
            }
        });

        addComponent.on('change', function (value) {
            editor.call('entities:addComponent', entity, value);
            // addComponent._updateOptions(
            //     {
            //         '': '',
            //         'animation': 'asdfsd'
            //     }
            // );

            // addComponent.value = ''
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
