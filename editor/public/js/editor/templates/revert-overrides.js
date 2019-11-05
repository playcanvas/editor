editor.once('load', function () {
    'use strict';

    const REGEX_SCRIPT_PATH = /^components\.script\.scripts\.([^\.]*?)$/;

    function rememberEntitiesPanelState(entity) {
        return editor.call('entities:panel:getExpandedState', entity);
    }

    function restoreEntitiesPanelState(state) {
        editor.call('entities:panel:restoreExpandedState', state);
    }

    editor.method('templates:revertNewEntity', (newEntityId, entities) => {
        entities = entities || editor.call('entities:raw');

        const entity = entities.get(newEntityId);
        if (entity) {
            editor.call('entities:delete', [entity]);
        }
    });

    editor.method('templates:revertDeletedEntity', (deletedEntity, templateInstanceRoot, entities) => {
        entities = entities || editor.call('entities:raw');

        let newEntity = null;

        function undo() {
            newEntity = newEntity.latest();
            if (!newEntity) return;

            editor.call('entities:removeEntity', newEntity, null, true);

            newEntity = null;
        }

        function redo() {
            const templId = templateInstanceRoot.get('template_id');
            const asset = editor.call('assets:get', templId);
            if (!asset) return;

            const dstToSrc = templateInstanceRoot.get('template_ent_ids'); // for create asset is src
            const srcToDst = editor.call('template:utils', 'invertMap', dstToSrc);
            const parentId = srcToDst[deletedEntity.parent];
            const parentEnt = entities.get(parentId);

            const opts = {
                subtreeRootId: deletedEntity.resource_id,
                dstToSrc: dstToSrc,
                srcToDst: srcToDst
            };

            newEntity = editor.call('template:addInstance', asset, parentEnt, opts);
        }

        redo();

        editor.call('history:add', {
            name: 'revert deleted entity ' + deletedEntity.resource_id,
            undo: undo,
            redo: redo
        });
    });

    function revertNewScript(entity, override, scriptName) {
        let previousIndex;

        // handle new script
        function undo() {
            entity = entity.latest();
            if (!entity) return;

            const history = entity.history.enabled;
            entity.history.enabled = false;

            if (!entity.has(override.path)) {
                entity.set(override.path, override.src_value);
                if (entity.get('components.script.order').indexOf(scriptName) === -1) {
                    entity.insert('components.script.order', scriptName, previousIndex < 0 ? undefined : previousIndex);
                }
            }

            entity.history.enabled = history;
        }

        function redo() {
            entity = entity.latest();
            if (!entity) return;

            const history = entity.history.enabled;
            entity.history.enabled = false;

            entity.unset(override.path);
            previousIndex = entity.get('components.script.order').indexOf(scriptName);
            entity.removeValue('components.script.order', scriptName);

            entity.history.enabled = history;
        }

        redo();

        editor.call('history:add', {
            name: `entities.${override.resource_id}.${override.path}`,
            undo: undo,
            redo: redo
        });
    }

    function revertDeletedScript(entity, override, scriptName) {
        if (!override.missing_in_src) return;

        function undo() {
            entity = entity.latest();
            if (!entity) return;

            const history = entity.history.enabled;
            entity.history.enabled = false;

            entity.unset('components.script.scripts.' + scriptName);
            entity.removeValue('components.script.order', scriptName);

            entity.history.enabled = history;
        }

        function redo() {
            entity = entity.latest();
            if (!entity) return;

            const history = entity.history.enabled;
            entity.history.enabled = false;

            if (!entity.has(override.path)) {
                // remap entity script attributes
                const scriptAsset = editor.call('assets:scripts:assetByScript', scriptName);
                if (scriptAsset && override.dst_value && override.dst_value.attributes) {
                    for (const name in override.dst_value.attributes) {
                        const attr = override.dst_value.attributes[name];
                        const assetAttribute = scriptAsset.get(`data.scripts.${scriptName}.attributes.${name}`);
                        if (assetAttribute && assetAttribute.type === 'entity') {
                            if (assetAttribute.array) {
                                if (Array.isArray(attr)) {
                                    for (let i = 0; i < attr.length; i++) {
                                        for (const key in override.srcToDst) {
                                            if (override.srcToDst[key] === attr[i]) {
                                                attr[i] = key;
                                            }
                                        }
                                    }
                                }
                            } else {
                                for (const key in override.srcToDst) {
                                    if (override.srcToDst[key] === attr) {
                                        override.dst_value.attributes[name] = key;
                                    }
                                }
                            }
                        }
                    }

                    entity.set(override.path, override.dst_value);
                }

            }
            if (entity.get('components.script.order').indexOf(scriptName) === -1) {
                entity.insert('components.script.order', scriptName);
            }


            entity.history.enabled = history;
        }

        redo();

        editor.call('history:add', {
            name: `entities.${override.resource_id}.${override.path}`,
            undo: undo,
            redo: redo
        });
    }

    function revertNewTemplateId(entity, override) {
        editor.call('templates:unlink', entity);
    }

    function revertReparenting(entity, override, entities) {
        let oldParent;
        for (const key in override.srcToDst) {
            if (override.srcToDst[key] === override.dst_value) {
                oldParent = key;
                break;
            }
        }
        const parent = entities.get(oldParent);
        if (!parent) {
            // TODO: show error visually
            editor.call(
                'picker:confirm',
                "Cannot revert this override because the parent does not exist.",
                null,
                {
                    yesText: 'OK',
                    noText: ''
                }
            );
            return;
        }

        // check if new parent is currently a child of the entity
        let isChild = false;
        let test = parent;
        while (test) {
            if (test.get('parent') === entity.get('resource_id')) {
                isChild = true;
                break;
            }

            test = entities.get(test.get('parent'));
        }

        if (isChild) {
            editor.call(
                'picker:confirm',
                "Cannot revert this override because the old parent is currently a child of the entity.",
                null,
                {
                    yesText: 'OK',
                    noText: ''
                }
            );
            return;
        }

        editor.call('entities:reparent', [{
            entity: entity,
            parent: parent
        }]);
    }

    function revertChildrenReordering(entity, override) {
        let oldChildren;

        function undo() {
            entity = entity.latest();
            if (!entity) return;

            const history = entity.history.enabled;
            entity.history.enabled = false;

            // use getRaw which will get the same array reference in children
            // as the observer in order to get the accurate current index of a child
            // when we are reordering them below
            const currentChildren = entity.getRaw('children');
            for (let i = 0; i < currentChildren.length; i++) {
                if (oldChildren.indexOf(currentChildren[i]) === -1) {
                    oldChildren.splice(i, 0, currentChildren[i]);
                }
            }

            for (let i = oldChildren.length; i >= 0; i--) {
                if (!editor.call('entities:get', oldChildren[i])) {
                    oldChildren.splice(i, 1);
                }
            }

            for (let i = oldChildren.length - 1; i >= 0; i--) {
                entity.move('children', currentChildren.indexOf(oldChildren[i]), i);
            }

            entity.history.enabled = history;
        }

        function redo() {
            entity = entity.latest();
            if (!entity) return;

            const history = entity.history.enabled;
            entity.history.enabled = false;

            // handle children reordering
            // create a new children array using the dst_value
            // and then add back any added entities and remove any missing entities
            let newOrder = override.dst_value.map(id => {
                for (const key in override.srcToDst) {
                    if (override.srcToDst[key] === id) {
                        return key;
                    }
                }
            });

            // add new entities
            oldChildren = entity.get('children');

            // use getRaw which will get the same array reference in children
            // as the observer in order to get the accurate current index of a child
            // when we are reordering them below
            const currentChildren = entity.getRaw('children');
            for (let i = 0; i < currentChildren.length; i++) {
                if (newOrder.indexOf(currentChildren[i]) === -1) {
                    newOrder.splice(i, 0, currentChildren[i]);
                }
            }

            for (let i = newOrder.length; i >= 0; i--) {
                if (!editor.call('entities:get', newOrder[i])) {
                    newOrder.splice(i, 1);
                }
            }

            for (let i = newOrder.length - 1; i >= 0; i--) {
                entity.move('children', currentChildren.indexOf(newOrder[i]), i);
            }

            entity.history.enabled = history;
        }

        redo();

        editor.call('history:add', {
            name: `entities.${override.resource_id}.${override.path}`,
            undo: undo,
            redo: redo
        });
    }

    function revertScriptOrder(entity, override) {
        // handle script order
        let oldOrder;

        function undo() {
            entity = entity.latest();
            if (!entity) return;

            const history = entity.history.enabled;
            entity.history.enabled = false;


            entity.history.enabled = history;
        }

        function redo() {
            entity = entity.latest();
            if (!entity) return;

            oldOrder = override.src_value.slice();

            const history = entity.history.enabled;
            entity.history.enabled = false;

            const newOrder = override.dst_value.slice();

            // add new scripts
            for (let i = 0; i < oldOrder.length; i++) {
                if (newOrder.indexOf(oldOrder[i]) === -1) {
                    newOrder.splice(i, 0, oldOrder[i]);
                }
            }

            // remove deleted scripts
            for (let i = newOrder.length - 1; i >= 0; i--) {
                if (oldOrder.indexOf(newOrder[i]) === -1) {
                    newOrder.splice(i, 1);
                }
            }

            entity.set('components.script.order', newOrder);

            entity.history.enabled = history;
        }

        redo();

        editor.call('history:add', {
            name: `entities.${override.resource_id}.${override.path}`,
            undo: undo,
            redo: redo
        });
    }

    editor.method('templates:revertOverride', (override, entities) => {
        entities = entities || editor.call('entities:raw');

        let entity = entities.get(override.resource_id);
        if (!entity) return;

        if (override.missing_in_dst) {
            const match = override.path.match(REGEX_SCRIPT_PATH);
            if (match) {
                revertNewScript(entity, override, match[1]);
            } else if (override.path === 'template_id') {
                revertNewTemplateId(entity, override);
            } else {
                entity.unset(override.path);
            }
        } else {
            if (override.path === 'parent') {
                // handle reparenting
                revertReparenting(entity, override, entities);
            } else if (override.path === 'children') {
                revertChildrenReordering(entity, override);
            } else if (override.path === 'components.script.order') {
                revertScriptOrder(entity, override);
            } else {
                // handle deleted script
                const match = override.path.match(REGEX_SCRIPT_PATH);
                if (match) {
                    revertDeletedScript(entity, override, match[1]);
                } else {
                    entity.set(override.path, override.dst_value);
                }
            }
        }
    });

    editor.method('templates:revertAll', function (entity) {

        let templateId = entity.get('template_id');
        let templateEntIds = entity.get('template_ent_ids');
        if (!templateId || !templateEntIds) return false;

        let asset = editor.call('assets:get', templateId);
        if (!asset) return;

        let parent = editor.call('entities:get', entity.get('parent'));
        if (!parent) return;

        let removedEntityData;

        let entitiesPanelState;

        function undo() {
            parent = parent.latest();
            if (!parent) return;

            const newEntity = editor.call('entities:get', removedEntityData.resource_id);
            if (!newEntity) return;

            const childIndex = parent.get('children').indexOf(newEntity.get('resource_id'));

            editor.call('entities:removeEntity', newEntity, null, true);

            const entity = new Observer(removedEntityData);

            setTimeout(function () {
                editor.call('entities:addEntity', entity, parent, true, childIndex);

                restoreEntitiesPanelState(entitiesPanelState);
            });
        }

        function redo() {
            entity = entity.latest();
            if (!entity) return;

            templateId = entity.get('template_id');
            templateEntIds = entity.get('template_ent_ids');
            if (!templateId || !templateEntIds) return;

            asset = editor.call('assets:get', templateId);
            if (!asset) return;

            parent = editor.call('entities:get', entity.get('parent'));
            if (!parent) return;

            const ignorePaths = editor.call('template:utils', 'ignoreRootPathsForRevert');

            const ignorePathValues = ignorePaths.map(path => entity.get(path));

            removedEntityData = entity.json();

            entitiesPanelState = rememberEntitiesPanelState(entity);

            const childIndex = parent.get('children').indexOf(entity.get('resource_id'));

            // remove entity and then re-add instance from
            // the template keeping the same ids as before
            editor.call('entities:removeEntity', entity);

            setTimeout(function () {
                const opts = {
                    dstToSrc: templateEntIds,
                    childIndex: childIndex
                };

                entity = editor.call('template:addInstance', asset, parent, opts);

                entity.history.enabled = false;
                ignorePaths.forEach((path, i) => {
                    entity.set(path, ignorePathValues[i]);
                });
                entity.history.enabled = true;

                setTimeout(function () {
                    editor.call('selector:history', false);
                    editor.call('selector:set', 'entity', [entity]);
                    editor.once('selector:change', function () {
                        editor.call('selector:history', true);
                    });

                    restoreEntitiesPanelState(entitiesPanelState);
                }, 0);
            }, 0);
        }

        redo();

        editor.call('history:add', {
            name: 'template revert all',
            undo: undo,
            redo: redo
        });

        return true;
    });
});
