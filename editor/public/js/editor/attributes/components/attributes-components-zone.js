editor.once('load', function() {
    'use strict';

    if (editor.call('users:hasFlag', 'hasPcuiComponentInspectors')) return;

    editor.on('attributes:inspect[entity]', function(entities) {
        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;

        var events = [ ];

        var panel = editor.call('attributes:entity:addComponentPanel', {
            title: 'Zone',
            name: 'zone',
            entities: entities
        });


        // size
        var fieldSize = editor.call('attributes:addField', {
            parent: panel,
            name: 'Size',
            placeholder: [ 'W', 'H', 'D' ],
            precision: 2,
            step: 0.1,
            min: 0,
            type: 'vec3',
            link: entities,
            path: 'components.zone.size',
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'zone:size', fieldSize[0].parent.innerElement.firstChild.ui);
    });
});
