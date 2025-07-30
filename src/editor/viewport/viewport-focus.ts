editor.once('load', () => {
    const app = editor.call('viewport:app');
    if (!app) return; // webgl not available

    const defaultSizeSmall = new pc.Vec3(0.2, 0.2, 0.2);
    const aabb = new pc.BoundingBox();
    const aabbA = new pc.BoundingBox();

    const calculateChildAABB = function (entity) {
        aabbA.add(editor.call('entities:getBoundingBoxForEntity', entity));

        const children = entity.children;
        for (let i = 0; i < children.length; i++) {
            if (!(children[i] instanceof pc.Entity) || children[i].__editor) {
                continue;
            }

            calculateChildAABB(children[i]);
        }
    };

    editor.method('selection:aabb', () => {
        if (editor.call('selector:type') !== 'entity') {
            return null;
        }

        return editor.call('entities:aabb', editor.call('selector:items'));
    });

    editor.method('entities:aabb', (items) => {
        if (!items) {
            return null;
        }

        if (!(items instanceof Array)) {
            items = [items];
        }

        aabb.center.set(0, 0, 0);
        aabb.halfExtents.copy(defaultSizeSmall);

        // calculate aabb for selected entities
        for (let i = 0; i < items.length; i++) {
            const entity = items[i].entity;

            if (!entity) {
                continue;
            }

            aabbA.center.copy(entity.getPosition());
            aabbA.halfExtents.copy(defaultSizeSmall);
            calculateChildAABB(entity);

            if (i === 0) {
                aabb.copy(aabbA);
            } else {
                aabb.add(aabbA);
            }
        }

        return aabb;
    });

    editor.method('viewport:focus', () => {
        const selection = editor.call('selection:aabb');
        if (!selection) return;

        const camera = editor.call('camera:current');

        // aabb
        let distance = Math.max(aabb.halfExtents.x, Math.max(aabb.halfExtents.y, aabb.halfExtents.z));
        // fov
        distance /= Math.tan(0.5 * camera.camera.fov * Math.PI / 180.0);
        // extra space
        distance = distance * 1.1 + 1;

        editor.call('camera:focus', aabb.center, distance);
    });
});
