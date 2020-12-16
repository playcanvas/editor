editor.once('load', function () {
    'use strict';

    var app = null;
    var entities = [ ];
    var visible = true;

    var color = new pc.Color(1, 1, 1);
    var colorBehind = new pc.Color(1, 1, 1, .5);

    var immediateRenderOptions;
    var immediateMaskRenderOptions;

    var renderBones = function (entities) {
        var renderBone = function (parent, child) {
            app.renderLine(parent.getPosition(), child.getPosition(), colorBehind, immediateRenderOptions);
            app.renderLine(parent.getPosition(), child.getPosition(), color, immediateMaskRenderOptions);
        };

        var renderBoneHierarchy = function (node) {
            // render node join
            if (!node.enabled) {
                return;
            }

            // render child links
            for (var i=0; i<node.children.length; ++i) {
                var child = node.children[i];
                renderBone(node, child);
                renderBoneHierarchy(child);
            }
        };

        for (var i=0; i<entities.length; ++i) {
            var entity = entities[i];
            if (entity) {
                var model = entity.model;
                if (model) {
                    if (model.model) {
                        renderBoneHierarchy(model.model.graph);
                    }
                }

                // render skeleton if entity with render component that has rootBone set is selected
                var render = entity.render;
                if (render && render._rootBone && render._rootBone.entity) {
                    renderBoneHierarchy(render._rootBone.entity);
                }
            }
        }
    };

    editor.method('viewport:show:bones', function () {
        return visible;
    });

    editor.on('selector:change', function(type, items) {
        if (type === 'entity') {
            entities = items.map(function(item) {
                return item.entity;
            });
        } else {
            entities = [ ];
        }
    });

    editor.once('viewport:load', function() {
        // get the app
        app = editor.call('viewport:app');

        immediateRenderOptions = {
            layer: editor.call('gizmo:layers', 'Axis Gizmo Immediate'),
            mask: GIZMO_MASK
        };

        immediateMaskRenderOptions = {
            layer: editor.call('gizmo:layers', 'Bright Gizmo'),
            mask: GIZMO_MASK
        };

        // hook up changes to editor.showSkeleton
        var settings = editor.call('settings:user');
        settings.on('editor.showSkeleton:set', function(enabled) {
            visible = enabled;
        });
        visible = settings.get('editor.showSkeleton');

        editor.on('viewport:postUpdate', function() {
            if (app && visible && entities.length) {
                renderBones(entities);
            }
        });
    });
});
