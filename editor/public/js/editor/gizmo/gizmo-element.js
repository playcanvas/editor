editor.once('load', function () {
    'use strict';

    var corners = [];
    var cornerColor = new pc.Color(1, 1, 1, 0.9);
    var visible = true;

    for (let i = 0; i < 8; i++) {
        corners.push(new pc.Vec3());
    }

    editor.once('viewport:load', function (app) {
        var immediateRenderOptions = {
            layer: editor.call('gizmo:layers', 'Axis Gizmo Immediate'),
            mask: GIZMO_MASK
        };

        editor.method('gizmo:element:visible', function (state) {
            if (visible !== state) {
                visible = state;

                editor.call('viewport:render');
            }
        });

        editor.on('viewport:gizmoUpdate', function (dt) {
            if (!visible) {
                return;
            }

            var selected = editor.selection.items;
            for (let i = 0, len = selected.length; i < len; i++) {
                var item = selected[i];

                var entity = item.entity;
                if (! entity || ! entity.element)
                    continue;

                var worldCorners = entity.element.worldCorners;

                corners[0].copy(worldCorners[0]);
                corners[1].copy(worldCorners[1]);
                corners[2].copy(worldCorners[1]);
                corners[3].copy(worldCorners[2]);
                corners[4].copy(worldCorners[2]);
                corners[5].copy(worldCorners[3]);
                corners[6].copy(worldCorners[3]);
                corners[7].copy(worldCorners[0]);

                app.renderLines(corners, cornerColor, immediateRenderOptions);
            }
        });

    });
});
