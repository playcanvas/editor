editor.once('load', function () {
    'use strict';
    var app = null;
    var entities = [ ];

    var firstBB = true;
    var bbA = new pc.BoundingBox();
    var bbB = new pc.BoundingBox();
    var bbC = new pc.BoundingBox();
    var bbD = new pc.BoundingBox();
    var bbE = new pc.BoundingBox();
    var bbF = new pc.BoundingBox();

    var matA = new pc.Mat4();
    var matB = new pc.Mat4();
    var vecA = new pc.Vec3();
    var vecB = new pc.Vec3();
    var minExtends = new pc.Vec3(0.01, 0.01, 0.01);

    var color = new pc.Color(1, 1, 1);
    var colorBehind = new pc.Color(1, 1, 1, .2);

    var colorNew = new pc.Color(1, .5, 0);


    var points = [ ];
    for(var c = 0; c < 32; c++)
        points[c] = new pc.Vec3();

    editor.on('selector:change', function(type, items) {
        if (type === 'entity') {
            entities = items.map(function(item) {
                return item.entity;
            });
        } else {
            entities = [ ];
        }
    });

    editor.method('viewport:render:aabb', function(aabb) {
        if (! app) return; // webgl not available

        var ind = 0;
        for(var x = -1; x <= 1; x += 2) {
            for(var y = -1; y <= 1; y += 2) {
                for(var z = -1; z <= 1; z += 2) {
                    points[ind * 4].copy(aabb.halfExtents);
                    points[ind * 4].x *= x;
                    points[ind * 4].y *= y;
                    points[ind * 4].z *= z;
                    points[ind * 4].add(aabb.center);

                    points[ind * 4 + 1].copy(points[ind * 4]);
                    points[ind * 4 + 1].x -= aabb.halfExtents.x * .3 * x;

                    points[ind * 4 + 2].copy(points[ind * 4]);
                    points[ind * 4 + 2].y -= aabb.halfExtents.y * .3 * y;

                    points[ind * 4 + 3].copy(points[ind * 4]);
                    points[ind * 4 + 3].z -= aabb.halfExtents.z * .3 * z;

                    app.renderLine(points[ind * 4], points[ind * 4 + 1], colorBehind, pc.LINEBATCH_OVERLAY);
                    app.renderLine(points[ind * 4], points[ind * 4 + 2], colorBehind, pc.LINEBATCH_OVERLAY);
                    app.renderLine(points[ind * 4], points[ind * 4 + 3], colorBehind, pc.LINEBATCH_OVERLAY);

                    app.renderLine(points[ind * 4], points[ind * 4 + 1], color, pc.LINEBATCH_WORLD);
                    app.renderLine(points[ind * 4], points[ind * 4 + 2], color, pc.LINEBATCH_WORLD);
                    app.renderLine(points[ind * 4], points[ind * 4 + 3], color, pc.LINEBATCH_WORLD);

                    ind++;
                }
            }
        }
    });

    editor.method('entities:boundingbox', function(entity) {
        var bb = editor.call('entities:boundingbox:entity', entity);

        if (bb) {
            if (firstBB) {
                firstBB = false;
                bbA.copy(bb);
            } else {
                bbA.add(bb);
            }
        }


        var children = entity.getChildren();
        for(var i = 0; i < children.length; i++) {
            if (children[i].__editor || ! (children[i] instanceof pc.Entity))
                continue;

            editor.call('entities:boundingbox', children[i]);
        }
    });

    editor.method('entities:boundingbox:entity', function(entity) {
        var first = true;

        entity.getWorldTransform();
        bbD.center.set(0, 0, 0);

        if (entity.model && entity.model.model && entity.model.meshInstances.length) {
            var meshes = entity.model.meshInstances;

            for(var i = 0; i < meshes.length; i++) {
                if (meshes[i]._hidden)
                    continue;

                meshes[i].node.getWorldTransform();

                if (first) {
                    first = false;
                    bbC.copy(meshes[i].aabb);
                } else {
                    bbC.add(meshes[i].aabb);
                }
            }
        }

        if (first && entity.collision) {
            switch(entity.collision.type) {
                case 'box':
                    first = false;
                    bbD.halfExtents.copy(entity.collision.halfExtents);
                    bbE.setFromTransformedAabb(bbD, entity.getWorldTransform());
                    bbC.copy(bbE);
                    break;
                case 'sphere':
                    first = false;
                    bbD.center.copy(entity.getPosition());
                    bbD.halfExtents.set(entity.collision.radius, entity.collision.radius, entity.collision.radius);
                    bbC.copy(bbD);
                    break;
                case 'capsule':
                case 'cylinder':
                    first = false;
                    bbD.halfExtents.set(entity.collision.radius, entity.collision.radius, entity.collision.radius);
                    bbD.halfExtents.data[entity.collision.axis] = entity.collision.height / 2;
                    bbE.setFromTransformedAabb(bbD, entity.getWorldTransform());
                    bbC.copy(bbE);
                    break;
            }
        }

        if (first && entity.element) {
            first = false;

            if (entity.element.type === 'image') {
                if (entity.element._image._meshInstance) {
                    bbC.copy(entity.element._image._meshInstance.aabb);
                }
            } else if (entity.element.type === 'text') {
                if (entity.element._text._meshInstance) {
                    bbC.copy(entity.element._text._meshInstance.aabb);
                }
            }
        }

        if (first && entity.sprite) {
            first = false;
            if (entity.sprite._meshInstance) {
                bbC.copy(entity.sprite._meshInstance.aabb);
            }
        }

        if (first && entity.particlesystem) {
            if (entity.particlesystem.emitter) {
                first = false;
                bbD.copy(entity.particlesystem.emitter.localBounds);
                bbE.setFromTransformedAabb(bbD, entity.getWorldTransform());
                bbC.copy(bbE);
            } else if (entity.particlesystem.emitterShape === pc.EMITTERSHAPE_BOX) {
                first = false;
                bbD.halfExtents.copy(entity.particlesystem.emitterExtents).scale(0.5);
                bbE.setFromTransformedAabb(bbD, entity.getWorldTransform());
                bbC.copy(bbE);
            } else if (entity.particlesystem.emitterShape === pc.EMITTERSHAPE_SPHERE) {
                first = false;
                bbD.center.copy(entity.getPosition());
                bbD.halfExtents.set(entity.particlesystem.emitterRadius, entity.particlesystem.emitterRadius, entity.particlesystem.emitterRadius);
                bbC.copy(bbD);
            }
        }

        if (first && entity.zone) {
            first = false;
            bbD.halfExtents.copy(entity.zone.size).scale(0.5);
            var position = entity.getPosition();
            var rotation = entity.getRotation();
            matA.setTRS(position, rotation, pc.Vec3.ONE);
            bbE.setFromTransformedAabb(bbD, matA);
            bbC.copy(bbE);
        }

        if (first) {
            bbC.center.copy(entity.getPosition());
            bbC.halfExtents.copy(minExtends);
        }

        return bbC;
    });

    editor.once('viewport:load', function() {
        app = editor.call('viewport:app');

        editor.on('viewport:postUpdate', function() {
            if (! entities.length)
                return;

            firstBB = true;
            var noEntities = true;

            for(var i = 0; i < entities.length; i++) {
                if (! entities[i])
                    continue;

                noEntities = false;
                editor.call('entities:boundingbox', entities[i]);
            }

            if (! noEntities) {
                bbA.halfExtents.add(minExtends);
                editor.call('viewport:render:aabb', bbA);
            }
        });
    });
});
