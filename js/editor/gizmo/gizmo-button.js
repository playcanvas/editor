editor.once('load', function () {
    let corners = [];
    for (let i = 0; i < 4; i++) {
        corners.push(new pc.Vec3());
    }

    const positions = [];
    for (let i = 0; i < 8; i++) {
        positions.push(new pc.Vec3());
    }

    const color = new pc.Color(0, 1, 0, 0.9);
    const colors = [];
    for (let i = 0; i < 8; i++) {
        colors.push(color);
    }

    let visible = true;

    editor.once('viewport:load', function (app) {
        editor.method('gizmo:button:visible', function (state) {
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
                if (!entity || !entity.element || !entity.button)
                    continue;

                const worldCorners = entity.element.worldCorners;
                for (let i = 0; i < worldCorners.length; ++i) {
                    corners[i].copy(worldCorners[i]);
                }

                // Add the padding to the existing world corners
                // We are always in world space in the Editor
                const elementScale = pc.ElementInput.calculateScaleToWorld(entity.element);
                corners = pc.ElementInput.buildHitCorners(entity.element, corners, elementScale);

                positions[0].copy(corners[0]);
                positions[1].copy(corners[1]);
                positions[2].copy(corners[1]);
                positions[3].copy(corners[2]);
                positions[4].copy(corners[2]);
                positions[5].copy(corners[3]);
                positions[6].copy(corners[3]);
                positions[7].copy(corners[0]);

                const layer = editor.call('gizmo:layers', 'Axis Gizmo Immediate');

                app.drawLines(positions, colors, true, layer);
            }
        });
    });
});
