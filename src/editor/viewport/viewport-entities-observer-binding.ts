import { Entity } from 'playcanvas';

editor.once('load', () => {
    const app = editor.call('viewport:app');
    if (!app) {
        return;
    } // webgl not available

    editor.on('entities:add', (obj) => {
        // subscribe to changes
        obj.on('*:set', (path, value) => {
            const entity = obj.entity;
            if (!entity) {
                return;
            }

            if (path === 'name') {
                entity.name = obj.get('name');

            } else if (path.startsWith('position')) {
                entity.setLocalPosition(obj.get('position.0'), obj.get('position.1'), obj.get('position.2'));

            } else if (path.startsWith('rotation')) {
                entity.setLocalEulerAngles(obj.get('rotation.0'), obj.get('rotation.1'), obj.get('rotation.2'));

            } else if (path.startsWith('scale')) {
                entity.setLocalScale(obj.get('scale.0'), obj.get('scale.1'), obj.get('scale.2'));

            } else if (path.startsWith('enabled')) {
                entity.enabled = obj.get('enabled');

            } else if (path.startsWith('parent')) {
                const parent = editor.call('entities:get', obj.get('parent'));
                if (parent && parent.entity && entity.parent !== parent.entity) {
                    entity.reparent(parent.entity);
                }
            } else if (path === 'components.model.type' && value === 'asset') {
                // WORKAROUND
                // entity deletes asset when switching to primitive, restore it
                // do this in a timeout to allow the model type to change first
                setTimeout(() => {
                    const assetId = obj.get('components.model.asset');
                    if (assetId) {
                        entity.model.asset = assetId;
                    }
                });
            }

            // render
            editor.call('viewport:render');
        });

        const reparent = function (child, index) {
            const childEntity = editor.call('entities:get', child);
            if (childEntity && childEntity.entity && obj.entity) {
                const oldParent = childEntity.entity.parent;

                if (oldParent) {
                    oldParent.removeChild(childEntity.entity);
                }

                // skip any graph nodes
                if (index > 0) {
                    const children = obj.entity.children;
                    let i = 0;
                    for (let len = children.length; i < len && index > 0; i++) {
                        if (children[i] instanceof Entity) {
                            index--;
                        }
                    }

                    index = i;
                }

                // re-insert
                obj.entity.insertChild(childEntity.entity, index);

                // persist the positions and sizes of elements if they were previously
                // under control of a layout group but have now been reparented
                if (oldParent && oldParent.layoutgroup) {
                    editor.call('entities:layout:storeLayout', [childEntity.entity.getGuid()]);
                }
            }
        };

        obj.on('children:insert', reparent);
        obj.on('children:move', reparent);

        obj.on('destroy', () => {
            if (obj.entity) {
                obj.entity.destroy();
                editor.call('viewport:render');
            }
        });
    });

    editor.on('entities:remove', (obj) => {
        const entity = obj.entity;
        if (!entity) {
            return;
        }

        entity.destroy();
        editor.call('viewport:render');
    });
});
