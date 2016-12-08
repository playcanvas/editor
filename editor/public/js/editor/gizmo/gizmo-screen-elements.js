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
        cornerColors.push(new pc.Color(217/255, 42/255, 1));
    }

    // convert resource id to color
    var getColor = function (entity) {
        var hash = 0;
        var string = entity.get('resource_id');
        for(var i = 0; i < string.length; i++)
            hash += string.charCodeAt(i);

        var data = editor.call('color:hsl2rgb', (hash % 128) / 128, 0.5, 0.5);
        return new pc.Color(data[0], data[1], data[2]);
    };

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

        // Returns true if a child of the entity is selected
        var isChildSelected = function (entity) {
            var children = entity.get('children');
            for (var i = 0, len = children.length; i < len; i++) {
                if (selectedEntities[children[i]])
                    return true;
            }

            for (var i = 0, len = children.length; i < len; i++) {
                var child = editor.call('entities:get', children[i]);
                if (child && isChildSelected(child)) {
                    return true;
                }
            }

            return false;
        };

        editor.on('entities:add', function(entity) {
            var key = entity.get('resource_id');

            var addGizmo = function() {
                if (entities[key])
                    return;

                entities[key] = {
                    entity: entity,
                    color: getColor(entity)
                };

                editor.call('viewport:render');
            };

            var removeGizmo = function() {
                if (! entities[key])
                    return;

                delete entities[key];

                editor.call('viewport:render');
            };

            if (entity.has('components.screen'))
                addGizmo();

            entity.on('components.screen:set', addGizmo);
            entity.on('components.screen:unset', removeGizmo);

            entity.once('destroy', function() {
                removeGizmo();
            });
        });

        editor.on('viewport:gizmoUpdate', function (dt) {
            for (var key in entities) {
                var entity = app.root.findByGuid(key);
                if (! entity)
                    continue;

                var isScreenSpace =  entities[key].entity.get('components.screen.screenSpace');

                // only show screen space screens
                // if they are selected or one of their children are selected
                if (selectedEntities[key] || isChildSelected(entities[key].entity)) {
                    if (isScreenSpace) {
                        entity.enabled = entities[key].entity.get('enabled');
                    }
                } else {
                    if (isScreenSpace) {
                        entity.enabled = false;
                    }

                    continue;
                }

                // always render screens as 3d screens in the viewport
                if (isScreenSpace) {
                    var res = entity.screen.resolution;
                    var refRes = entities[key].entity.get('components.screen.referenceResolution');

                    entity.setLocalScale(0.01, 0.01, 0.01);

                    if (entity.screen.screenSpace)
                        entity.screen.screenSpace = false;

                    if (res.x !== refRes.x || res.y !== refRes.y) {
                        tempVec2.set(refRes[0], refRes[1]);
                        entity.screen.resolution = tempVec2;
                    }

                } else {
                    // reset scale that might have been
                    // changed if the screen used to be screen space
                    var scale = entities[key].entity.get('scale');
                    entity.setLocalScale(scale[0], scale[1], scale[2]);

                    // reset resolution
                    var res = entities[key].entity.get('components.screen.resolution');
                    tempVec2.set(res[0], res[1]);
                    entity.screen.resolution = tempVec2;
                }

                // calculate corners
                var position = entity.getPosition();
                var r = entity.right;
                var u = entity.up;
                var scale = entity.getLocalScale();
                var resolution = entity.screen.resolution;

                left
                .copy(r)
                .scale(-0.5 * resolution.x * scale.x);

                right
                .copy(r)
                .scale(0.5 * resolution.x * scale.x);

                top
                .copy(u)
                .scale(0.5 * resolution.y * scale.y);

                bottom
                .copy(u)
                .scale(-0.5 * resolution.y * scale.y);

                for (var i = 0; i < 8; i++) {
                    cornerColors[i].copy(entities[key].color);
                }

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
