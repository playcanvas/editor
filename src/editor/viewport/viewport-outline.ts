editor.once('load', () => {
    const app = editor.call('viewport:app');
    if (!app) {
        return;
    } // webgl not available

    /** @type {Map<Number, any[]>} */
    const userSelections = new Map();

    /** @type {Map<Number, any>} */
    const userColors = new Map();

    // create outline renderer
    // internally an existing Viewport Outline layer is used to render outlines
    const outlineLayer = editor.call('gizmo:layers', 'Viewport Outline');
    const outlineRenderer = new pc.OutlineRenderer(app, outlineLayer);

    const isSelectableEntity = function (item) {

        if (item && item.entity) {

            // model component
            const modelType = item.get('components.model.type');
            if ((modelType === 'asset' && item.get('components.model.asset')) || modelType !== 'asset') {
                return true;
            }

            // render component
            const renderType = item.get('components.render.type');
            if ((renderType === 'asset' && item.get('components.render.asset')) || renderType !== 'asset') {
                return true;
            }
        }

        return false;
    };

    const getUserSelectionColor = (user) => {

        let color = userColors.get(user);
        if (!color) {
            const id = parseInt(user, 10);
            const data = (config.self.id === user) ?
                [1, 1, 1] :                                 // local user
                editor.call('users:color', id, 'data');     // remote user

            color = new pc.Color(data[0], data[1], data[2]);
        }

        return color;
    };

    // request rendering of entities for a user
    const setUserSelection = (id, entities) => {

        // remove existing entities
        const existingEntities = userSelections.get(id);
        if (existingEntities) {
            for (let i = 0; i < existingEntities.length; i++) {
                outlineRenderer.removeEntity(existingEntities[i], false);
            }
        }

        // add new entities
        const color = getUserSelectionColor(id);
        userSelections.set(id, entities);
        for (let i = 0; i < entities.length; i++) {
            outlineRenderer.addEntity(entities[i], color, false);
        }

        editor.call('viewport:render');
    };

    // local user selection changed
    editor.on('selector:change', (type, items) => {

        const entities = [];

        if (type === 'entity') {
            for (let i = 0; i < items.length; i++) {
                if (isSelectableEntity(items[i])) {
                    entities.push(items[i].entity);
                }
            }
        }

        setUserSelection(config.self.id, entities);
    });

    // remote user selection changed
    editor.on('selector:sync', (user, data) => {

        const entities = [];

        if (data.type === 'entity') {
            for (let i = 0; i < data.ids.length; i++) {
                const entity = editor.call('entities:get', data.ids[i]);
                if (isSelectableEntity(entity)) {
                    entities.push(entity.entity);
                }
            }
        }

        setUserSelection(user, entities);
    });

    // entity was removed from selection (for example deleted)
    editor.on('selector:remove', (item, type) => {
        if (type === 'entity') {
            outlineRenderer.removeEntity(item.entity, false);
        }
    });

    // remote user leave
    editor.on('whoisonline:remove', (user) => {
        setUserSelection(user, []);
    });

    // ### RENDER EVENT ###
    editor.on('viewport:gizmoUpdate', () => {
        // remove all mesh instances and re-add them every frame. This handles cases:
        // - entity with render/model component is selected, and the render/model asset is changed => it will add new mesh instances
        // without this, the outline renderer would render the old mesh instance which was already destroyed, and crash
        // TODO: this could be made event based instead of per frame, and one of the selection events should be trigged instead
        // when a new render/model asset is assigned.
        outlineRenderer.removeAllEntities();
        const entities = userSelections.get(config.self.id);
        if (entities) {
            setUserSelection(config.self.id, entities);
        }

        // request outline rendering, which is then added to the scene at the start of the Immediate layer
        const immediateLayer = app.scene.layers.getLayerByName('Immediate');
        const cameraEntity = editor.call('camera:current');
        outlineRenderer.frameUpdate(cameraEntity, immediateLayer, false);
    });
});
