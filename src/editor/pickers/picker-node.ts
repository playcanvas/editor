import { LegacyOverlay } from '../../common/ui/overlay.ts';
import { ModelAssetInspectorMeshInstances } from '../inspector/assets/model-mesh-instances.ts';

editor.once('load', () => {
    const overlay = new LegacyOverlay();
    overlay.class.add('picker-node');
    overlay.center = false;
    overlay.hidden = true;

    const root = editor.call('layout.root');
    root.append(overlay);

    let currentEntities = null;
    let currentAsset = null;

    // esc to close
    editor.call('hotkey:register', 'picker:node:close', {
        key: 'Escape',
        callback: function () {
            if (overlay.hidden) {
                return;
            }

            overlay.hidden = true;
        }
    });

    // on close asset picker
    overlay.on('hide', () => {
        // reset root header
        const root = editor.call('attributes.rootPanel');
        root.style.zIndex = '';

        // select entities again
        editor.call('selector:history', false);
        editor.call('selector:set', 'entity', currentEntities);
        editor.once('selector:change', () => {
            editor.call('selector:history', true);
        });

        // emit event
        editor.emit('picker:node:close');

        currentEntities = null;
        currentAsset = null;
    });

    const addMapping = function (index, assetId) {
        const resourceIds = [];
        const actions = [];

        for (let i = 0, len = currentEntities.length; i < len; i++) {

            const history = currentEntities[i].history.enabled;
            currentEntities[i].history.enabled = false;

            if (!currentEntities[i].get('components.model.mapping')) {
                const mapping = {};
                mapping[index] = parseInt(assetId, 10);

                actions.push({
                    path: 'components.model.mapping',
                    undo: undefined,
                    redo: mapping
                });

                currentEntities[i].set('components.model.mapping', mapping);

                resourceIds.push(currentEntities[i].get('resource_id'));
            } else {
                if (currentEntities[i].has(`components.model.mapping.${index}`)) {
                    continue;
                }

                const id = parseInt(assetId, 10);

                actions.push({
                    path: `components.model.mapping.${index}`,
                    undo: undefined,
                    redo: id
                });

                currentEntities[i].set(`components.model.mapping.${index}`, id);

                resourceIds.push(currentEntities[i].get('resource_id'));
            }

            currentEntities[i].history.enabled = history;
        }

        editor.api.globals.history.add({
            name: `entities.${resourceIds.length > 1 ? '*' : resourceIds[0]}.components.model.mapping`,
            combine: false,
            undo: function () {
                for (let i = 0; i < resourceIds.length; i++) {
                    const item = editor.call('entities:get', resourceIds[i]);
                    if (!item) {
                        continue;
                    }

                    const history = item.history.enabled;
                    item.history.enabled = false;

                    if (actions[i].undo === undefined) {
                        item.unset(actions[i].path);
                    } else {
                        item.set(actions[i].path, actions[i].undo);
                    }

                    item.history.enabled = history;
                }
            },
            redo: function () {
                for (let i = 0; i < resourceIds.length; i++) {
                    const item = editor.call('entities:get', resourceIds[i]);
                    if (!item) {
                        continue;
                    }

                    const history = item.history.enabled;
                    item.history.enabled = false;
                    item.set(actions[i].path, actions[i].redo);
                    item.history.enabled = history;
                }
            }
        });
    };

    const isAlreadyOverridden = function (index) {
        const len = currentEntities.length;
        let overrideCount = 0;
        for (let i = 0; i < len; i++) {
            if (currentEntities[i].has(`components.model.mapping.${index}`)) {
                overrideCount++;
            }
        }

        return overrideCount && overrideCount === len;
    };


    // open asset picker
    editor.method('picker:node', (entities) => {
        // show overlay
        overlay.hidden = false;

        currentEntities = entities;

        // select model asset
        currentAsset = editor.call('assets:get', entities[0].get('components.model.asset'));
        editor.call('selector:history', false);
        editor.call('selector:set', 'asset', [currentAsset]);

        editor.once('attributes:inspect[asset]', () => {
            editor.call('selector:history', true);

            // change header name
            editor.call('attributes:header', 'Entity Materials');

            // hide asset info
            editor.emit('attributes:assets:toggleInfo', false);

            const root = editor.call('attributes.rootPanel');
            root.style.zIndex = 102;

            const modelEntityMaterials = new ModelAssetInspectorMeshInstances({
                entities: currentEntities,
                assets: editor.call('assets:raw'),
                history: editor.api.globals.history,
                mode: 'picker',
                isMeshInstanceDisabled: isAlreadyOverridden
            });

            modelEntityMaterials.on('select', (ind) => {
                addMapping(ind, currentAsset.get(`data.mapping.${ind}.material`));
                overlay.hidden = true;
            });

            modelEntityMaterials.link([currentAsset]);
            root.append(modelEntityMaterials);

            const evtModelEntityPermissions = editor.on('permissions:writeState', (state) => {
                modelEntityMaterials.readOnly = !state;
                modelEntityMaterials.enabled = state;
            });
            modelEntityMaterials.once('destroy', () => {
                evtModelEntityPermissions.unbind();
            });
        });

    });


    // close asset picker
    editor.method('picker:node:close', () => {
        // hide overlay
        overlay.hidden = true;
    });
});
