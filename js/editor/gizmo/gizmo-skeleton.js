editor.once('load', function () {
    var app = null;
    var entities = [];
    var visible = true;

    var color = new pc.Color(1, 1, 1);
    var colorBehind = new pc.Color(1, 1, 1, 0.5);

    var renderBones = function (entities) {
        const immediateLayer = editor.call('gizmo:layers', 'Axis Gizmo Immediate');
        const brightLayer = editor.call('gizmo:layers', 'Bright Gizmo');

        var renderBone = function (parent, child) {
            const start = parent.getPosition();
            const end = child.getPosition();
            app.drawLine(start, end, colorBehind, true, immediateLayer);
            app.drawLine(start, end, color, true, brightLayer);
        };

        var renderBoneHierarchy = function (node) {
            // render node join
            if (!node.enabled) {
                return;
            }

            // render child links
            for (const child of node.children) {
                renderBone(node, child);
                renderBoneHierarchy(child);
            }
        };

        for (let i = 0; i < entities.length; ++i) {
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

    editor.on('selector:change', function (type, items) {
        if (type === 'entity') {
            entities = items.map(item => item.entity);
        } else {
            entities = [];
        }
    });

    editor.once('viewport:load', function () {
        // get the app
        app = editor.call('viewport:app');

        // hook up changes to editor.showSkeleton
        const settings = editor.call('settings:user');
        settings.on('editor.showSkeleton:set', function (enabled) {
            visible = enabled;
        });
        visible = settings.get('editor.showSkeleton');

        editor.on('viewport:postUpdate', function () {
            if (app && visible && entities.length) {
                renderBones(entities);
            }
        });
    });
});
