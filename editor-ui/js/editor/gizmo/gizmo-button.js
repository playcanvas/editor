editor.once('load', function () {
    'use strict';

    let hitCorners = [];
    const renderLineCorners = [];
    const cornerColor = new pc.Color(0, 1, 0, 0.9);
    let visible = true;

    for (let i = 0; i < 8; i++) {
        renderLineCorners.push(new pc.Vec3());
    }

    for (let i = 0; i < 4; i++) {
        hitCorners.push(new pc.Vec3());
    }

    editor.once('viewport:load', function (app) {
        const immediateRenderOptions = {
            layer: editor.call('gizmo:layers', 'Axis Gizmo Immediate'),
            mask: GIZMO_MASK
        };

        editor.method('gizmo:button:visible', function (state) {
            if (visible !== state) {
                visible = state;

                editor.call('viewport:render');
            }
        });

        editor.on('viewport:gizmoUpdate', function (dt) {
            // Fri 18 Nov 2022: Check if the function exists as it's a new function in Engine 1.59.0
            if (!visible || !pc.ElementInput.buildHitCorners) {
                return;
            }

            const selected = editor.selection.items;
            for (let i = 0, len = selected.length; i < len; i++) {
                const item = selected[i];

                const entity = item.viewportEntity;
                if (!entity || !entity.element || !entity.button)
                    continue;

                const worldCorners = entity.element.worldCorners;
                for (let i = 0; i < worldCorners.length; ++i) {
                    hitCorners[i].copy(worldCorners[i]);
                }

                // Add the padding to the existing world corners
                // We are always in world space in the Editor
                const elementScale = pc.ElementInput.calculateScaleToWorld(entity.element);
                hitCorners = pc.ElementInput.buildHitCorners(entity.element, hitCorners, elementScale);

                renderLineCorners[0].copy(hitCorners[0]);
                renderLineCorners[1].copy(hitCorners[1]);
                renderLineCorners[2].copy(hitCorners[1]);
                renderLineCorners[3].copy(hitCorners[2]);
                renderLineCorners[4].copy(hitCorners[2]);
                renderLineCorners[5].copy(hitCorners[3]);
                renderLineCorners[6].copy(hitCorners[3]);
                renderLineCorners[7].copy(hitCorners[0]);

                app.renderLines(renderLineCorners, cornerColor, immediateRenderOptions);
            }
        });

    });
});
