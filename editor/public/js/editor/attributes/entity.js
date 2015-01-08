(function() {
    'use strict';

    editor.on('attributes:inspect[entity]', function(entities) {
        if (entities.length !== 1)
            return;

        var entity = entities[0];

        // name
        editor.call('attributes:addField', {
            name: 'Name',
            type: 'string',
            link: entity,
            path: 'name'
        });

        // position
        editor.call('attributes:addField', {
            name: 'Position',
            type: 'vec3',
            link: entity,
            path: 'position'
        });

        // rotation
        editor.call('attributes:addField', {
            name: 'Rotation',
            type: 'vec3',
            link: entity,
            path: 'rotation'
        });

        // scale
        editor.call('attributes:addField', {
            name: 'Scale',
            type: 'vec3',
            link: entity,
            path: 'scale'
        });
    });
})();
