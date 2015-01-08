(function() {
    'use strict';

    msg.on('attributes:inspect[entity]', function(entities) {
        if (entities.length !== 1)
            return;

        var entity = entities[0];

        // name
        msg.call('attributes:addField', {
            name: 'Name',
            type: 'string',
            link: entity,
            path: 'name'
        });

        // position
        msg.call('attributes:addField', {
            name: 'Position',
            type: 'vec3',
            link: entity,
            path: 'position'
        });

        // rotation
        msg.call('attributes:addField', {
            name: 'Rotation',
            type: 'vec3',
            link: entity,
            path: 'rotation'
        });

        // scale
        msg.call('attributes:addField', {
            name: 'Scale',
            type: 'vec3',
            link: entity,
            path: 'scale'
        });
    });
})();
