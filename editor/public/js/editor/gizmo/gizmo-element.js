editor.once('load', function() {
    'use strict';

    var left = new pc.Vec3();
    var right = new pc.Vec3();
    var top = new pc.Vec3();
    var bottom = new pc.Vec3();

    var corners = [];
    var cornerColors = [];

    var tempVec2 = new pc.Vec2();

    for (var i = 0; i < 8; i++) {
        corners.push(new pc.Vec3());
        cornerColors.push(new pc.Color(1, 1, 1, 0.9));
    }

    editor.once('viewport:load', function (app) {
        var entities = {};

        // remember selected entities
        var selectedEntities = {};

        editor.on('selector:add', function (item, type) {
            if (type === 'entity') {
                selectedEntities[item.get('resource_id')] = true;
            }
        });

        editor.on('selector:remove', function (item, type) {
            if (type === 'entity') {
                delete selectedEntities[item.get('resource_id')];
            }
        });

        editor.on('entities:add', function(entity) {
            var key = entity.get('resource_id');

            var addGizmo = function() {
                if (entities[key])
                    return;

                entities[key] = {
                    entity: entity
                };

                editor.call('viewport:render');
            };

            var removeGizmo = function() {
                if (! entities[key])
                    return;

                delete entities[key];

                editor.call('viewport:render');
            };

            if (entity.has('components.element'))
                addGizmo();

            entity.on('components.element:set', addGizmo);
            entity.on('components.element:unset', removeGizmo);

            entity.once('destroy', function() {
                removeGizmo();
            });
        });

        editor.on('viewport:gizmoUpdate', function (dt) {
            for (var key in entities) {
                var entity = app.root.findByGuid(key);
                if (! entity)
                    continue;

                // skip not selected
                if (!selectedEntities[key]) {
                    continue;
                }

                if (entity.element.type === 'group')
                    continue;

                var width = entity.element.width;
                var height = entity.element.height;

                var screen = entity.element.screen;
                if (screen) {
                    var scale = screen.getLocalScale();
                    width = width * scale.x;
                    height = height * scale.y;
                }

                var pivot = entity.element.pivot;

                // calculate corners
                var position = entity.getPosition();
                var r = entity.right;
                var u = entity.up;
                var scale = entity.getLocalScale();

                left
                .copy(r)
                .scale(width * scale.x * (-pivot.x));

                right
                .copy(r)
                .scale((width * scale.x) * (1 - pivot.x));

                top
                .copy(u)
                .scale((height * scale.y) * (1 - pivot.y));

                bottom
                .copy(u)
                .scale((height * scale.y) * (-pivot.y));

                corners[0].copy(position).add(left).add(top);
                corners[1].copy(position).add(left).add(bottom);
                corners[2].copy(position).add(left).add(bottom);
                corners[3].copy(position).add(right).add(bottom);
                corners[4].copy(position).add(right).add(bottom);
                corners[5].copy(position).add(right).add(top);
                corners[6].copy(position).add(right).add(top);
                corners[7].copy(position).add(left).add(top);

                // render rectangle for screen
                app.renderLines(corners, cornerColors, pc.LINEBATCH_GIZMO);
            }
        });
    });
});
