editor.once('load', () => {
    const left = new pc.Vec3();
    const right = new pc.Vec3();
    const top = new pc.Vec3();
    const bottom = new pc.Vec3();

    const positions = [];
    const colors = [];
    let visible = true;

    const vecA = new pc.Vec2();

    const projectSettings = editor.call('settings:project');

    for (let i = 0; i < 8; i++) {
        positions.push(new pc.Vec3());
        colors.push(pc.Color.WHITE);
    }

    editor.once('viewport:load', (app) => {
        const entities = {};

        // remember selected entities
        const selectedEntities = {};

        editor.on('selector:add', (item, type) => {
            if (type === 'entity') {
                selectedEntities[item.get('resource_id')] = true;
            }
        });

        editor.on('selector:remove', (item, type) => {
            if (type === 'entity') {
                delete selectedEntities[item.get('resource_id')];
            }
        });

        // Returns true if a child of the entity is selected
        const isChildSelected = function (entity) {
            const children = entity.get('children');
            for (let i = 0, len = children.length; i < len; i++) {
                if (selectedEntities[children[i]]) {
                    return true;
                }
            }

            for (let i = 0, len = children.length; i < len; i++) {
                const child = editor.call('entities:get', children[i]);
                if (child && isChildSelected(child)) {
                    return true;
                }
            }

            return false;
        };

        editor.method('gizmo:screen:visible', (state) => {
            if (visible !== state) {
                visible = state;

                editor.call('viewport:render');
            }
        });

        editor.on('entities:add', (entity) => {
            const key = entity.get('resource_id');

            const addGizmo = function () {
                if (entities[key]) {
                    return;
                }

                entities[key] = {
                    entity: entity
                };

                editor.call('viewport:render');
            };

            const removeGizmo = function () {
                if (!entities[key]) {
                    return;
                }

                const e = app.root.findByGuid(key);
                if (e) {
                    // reset scale
                    const scale = entity.get('scale');
                    e.setLocalScale(scale[0], scale[1], scale[2]);

                    // reset rotation
                    const rotation = entity.get('rotation');
                    e.setLocalEulerAngles(rotation[0], rotation[1], rotation[2]);
                }

                delete entities[key];

                editor.call('viewport:render');
            };

            if (entity.has('components.screen')) {
                addGizmo();
            }

            entity.on('components.screen:set', addGizmo);
            entity.on('components.screen:unset', removeGizmo);

            entity.once('destroy', () => {
                removeGizmo();
            });
        });

        editor.on('viewport:gizmoUpdate', (dt) => {
            if (!visible) {
                return;
            }

            for (const key in entities) {
                const entity = app.root.findByGuid(key);
                if (!entity) {
                    continue;
                }

                const isScreenSpace = entities[key].entity.get('components.screen.screenSpace');

                // never cull screen content in editor
                entity.screen.cull = false;

                // always render screens as 3d screens in the viewport
                if (isScreenSpace) {
                    entity.setLocalScale(0.01, 0.01, 0.01);
                    entity.setLocalEulerAngles(0, 0, 0);

                    if (entity.screen.screenSpace) {
                        entity.screen.screenSpace = false;
                    }

                    const res = entity.screen.resolution;
                    const w = projectSettings.get('width');
                    const h = projectSettings.get('height');
                    vecA.set(w, h);

                    // reset resolution
                    if (res.x !== w || res.y !== h) {
                        entity.screen.resolution = vecA;
                    }

                    // reset scale mode
                    const scaleMode = entities[key].entity.get('components.screen.scaleMode');
                    if (entity.screen.scaleMode !== scaleMode) {
                        entity.screen._scaleMode = scaleMode;
                        entity.screen.resolution = vecA; // force update
                    }
                } else {
                    // reset scale that might have been
                    // changed if the screen used to be screen space
                    const scale = entities[key].entity.get('scale');
                    entity.setLocalScale(scale[0], scale[1], scale[2]);

                    const rotation = entities[key].entity.get('rotation');
                    entity.setLocalEulerAngles(rotation[0], rotation[1], rotation[2]);

                    // reset resolution
                    const res = entities[key].entity.get('components.screen.resolution');
                    const currentRes = entity.screen.resolution;
                    vecA.set(res[0], res[1]);
                    if (currentRes.x !== res[0] || currentRes.y !== res[1]) {
                        entity.screen.resolution = vecA;
                    }

                    // reset scale mode
                    if (entity.screen.scaleMode !== 'none') {
                        entity.screen.scaleMode = 'none';
                    }
                }

                // only render screen gizmo if it's selected
                // or a child is selected
                if (!selectedEntities[key] && !isChildSelected(entities[key].entity)) {
                    continue;
                }

                // calculate corners
                const position = entity.getPosition();
                const r = entity.right;
                const u = entity.up;
                const scale = entity.getLocalScale();
                const refResolution = entities[key].entity.get('components.screen.referenceResolution');

                vecA.set(refResolution[0], refResolution[1]);
                const screenScale = entity.screen.scaleMode === 'blend' ? entity.screen._calcScale(entity.screen.resolution, vecA) || Number.MIN_VALUE : 1;

                left
                .copy(r)
                .scale(-0.5 * entity.screen.resolution.x * scale.x / screenScale);

                right
                .copy(r)
                .scale(0.5 * entity.screen.resolution.x * scale.x / screenScale);

                top
                .copy(u)
                .scale(0.5 * entity.screen.resolution.y * scale.y / screenScale);

                bottom
                .copy(u)
                .scale(-0.5 * entity.screen.resolution.y * scale.y / screenScale);

                positions[0].copy(position).add(left).add(top);
                positions[1].copy(position).add(left).add(bottom);
                positions[2].copy(position).add(left).add(bottom);
                positions[3].copy(position).add(right).add(bottom);
                positions[4].copy(position).add(right).add(bottom);
                positions[5].copy(position).add(right).add(top);
                positions[6].copy(position).add(right).add(top);
                positions[7].copy(position).add(left).add(top);

                const layer = editor.call('gizmo:layers', 'Axis Gizmo Immediate');

                // render rectangle for screen
                app.drawLines(positions, colors, true, layer);
            }
        });
    });
});
