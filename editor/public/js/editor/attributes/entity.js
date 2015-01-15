editor.once('load', function() {
    'use strict';

    var panelComponents;

    editor.hook('attributes:entity.panelComponents', function() {
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
            type: 'vec3',
            link: entity,
            path: 'position'
        });
        fieldPosition[0].placeholder = 'X';
        fieldPosition[1].placeholder = 'Y';
        fieldPosition[2].placeholder = 'Z';

        // rotation
        var fieldRotation = editor.call('attributes:addField', {
            name: 'Rotation',
            type: 'vec3',
            link: entity,
            path: 'rotation'
        });
        fieldRotation[0].placeholder = 'X';
        fieldRotation[1].placeholder = 'Y';
        fieldRotation[2].placeholder = 'Z';

        // scale
        var fieldScale = editor.call('attributes:addField', {
            name: 'Scale',
            type: 'vec3',
            link: entity,
            path: 'scale'
        });
        fieldScale[0].placeholder = 'X';
        fieldScale[1].placeholder = 'Y';
        fieldScale[2].placeholder = 'Z';


        // components
        panelComponents = editor.call('attributes:addPanel');


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
        var evt = entity.on('*:set', function() {
            fieldJson.text = JSON.stringify(entity.json(), null, 4);
        });

        fieldJson.on('destroy', function() {
            evt.unbind();
        });
    });
});
