editor.once('load', function () {
    const positions = [];
    for (let i = 0; i < 8; i++) {
        positions.push(new pc.Vec3());
    }

    const color = new pc.Color(1, 1, 1, 0.9);
    const colors = [];
    for (let i = 0; i < 8; i++) {
        colors.push(color);
    }

    let visible = true;

    editor.once('viewport:load', function (app) {
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

            for (const item of editor.selection.items) {
                const entity = item.viewportEntity;

                if (!entity || !entity.element)
                    continue;

                const worldCorners = entity.element.worldCorners;

                positions[0].copy(worldCorners[0]);
                positions[1].copy(worldCorners[1]);
                positions[2].copy(worldCorners[1]);
                positions[3].copy(worldCorners[2]);
                positions[4].copy(worldCorners[2]);
                positions[5].copy(worldCorners[3]);
                positions[6].copy(worldCorners[3]);
                positions[7].copy(worldCorners[0]);

                const layer = editor.call('gizmo:layers', 'Axis Gizmo Immediate');

                app.drawLines(positions, colors, true, layer);
            }
        });
    });
});
