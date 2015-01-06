(function() {
    'use strict';

    msg.on('attributes:inspect[entity]', function(entities) {
        if (entities.length !== 1)
            return;

        var entity = entities[0];

        // name
        msg.call('attributes:addField', {
            name: 'name',
            type: 'string',
            link: entity,
            path: 'name'
        });

        // position
        msg.call('attributes:addField', {
            name: 'position',
            type: 'vec3',
            link: entity,
            path: 'position'
        });

        // rotation
        msg.call('attributes:addField', {
            name: 'rotation',
            type: 'vec3',
            link: entity,
            path: 'rotation'
        });

        // scale
        msg.call('attributes:addField', {
            name: 'scale',
            type: 'vec3',
            link: entity,
            path: 'scale'
        });
    });
})();
