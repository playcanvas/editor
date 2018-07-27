editor.once('load', function () {
    'use strict';

    var componentSchema = editor.call('components:schema');

    var ENTITY_PROPERTIES = [
        'name',
        'position',
        'rotation',
        'scale',
        'tags'
    ];

    var schema = {
        name: 'string',
        entities: {
            '*': {
                name: 'string',
                position: 'vec3',
                rotation: 'vec3',
                scale: 'vec3',
                tags: 'array:string'
            }
        }
    };

    var getType = function (path) {
        var parts = path.split('.');
        var target = schema;
        for (var p = 0; p < parts.length - 1; p++) {
            target = target[parts[p]] || target['*'];
            if (! target) {
                break;
            }
        }

        var result = target && target[parts[parts.length - 1]];
        if (! result) {
            console.warn('Unknown type for ' + path);
            result = 'string';
        }

        return result;
    };

    editor.method('picker:conflictManager:showSceneConflicts', function (parent, conflicts) {
        var resolver = new ui.ConflictResolver();

        var index = {};

        for (var i = 0, len = conflicts.data.length; i < len; i++) {
            var conflict = conflicts.data[i];
            var parts = conflict.path.split('.');
            var target = index;

            for (var p = 0; p < parts.length - 1; p++) {
                if (! target.hasOwnProperty(parts[p])) {
                    target[parts[p]] = {};
                }
                target = target[parts[p]];
            }

            target[parts[parts.length - 1]] = conflict;
        }

        if (index.name) {
            var sectionProperties = resolver.createSection('PROPERTIES');
            sectionProperties.appendField('name', getType('name'), index.name);
        }

        if (index.entities) {
            resolver.createSeparator('ENTITIES');
            for (var key in index.entities) {
                var sectionEntity = resolver.createSection(key, true);
                var entity = index.entities[key];

                var addedTitle = false;
                for (var i = 0; i < ENTITY_PROPERTIES.length; i++) {
                    var field = ENTITY_PROPERTIES[i];
                    if (entity.hasOwnProperty(field)) {
                        if (! addedTitle) {
                            addedTitle = true;
                            sectionEntity.appendTitle('ENTITY PROPERTIES');
                        }

                        sectionEntity.appendField(field, getType(entity[field].path), entity[field]);
                    }
                }
            }
        }

        // sectionEntities.appendTitle('ENTITY PROPERTIES');
        // sectionEntities.appendString('path', ['/root/entity/child/box', '/root/entity/capsule/box', '/root/entity/sphere/cone']);
        // sectionEntities.appendTitle('SCRIPT COMPONENT');
        // sectionEntities.indent();
        // sectionEntities.appendTitle('curve-script.js', true);
        // sectionEntities.appendString('curveOne', [1, 2, 3]);
        // sectionEntities.unindent();

        // var sectionPhysics = resolver.createSection("PHYSICS SETTINGS");
        // sectionPhysics.appendVec3('gravity', [[0, -9, 0], [0, -20, 0], [0, -10, 0]]);

        // var sectionRender = resolver.createSection('RENDER SETTINGS');
        // sectionPhysics.appendNumber('fog_start', );

        resolver.appendToParent(parent);

        return resolver;
    });
});
