editor.once('load', () => {
    // Resolves a picked node (which may be an icon entity) to its entity observer
    const resolveEntityFromNode = (node) => {
        // Handle icon entities
        let targetNode = node;
        if (node._icon || (node.__editor && node._getEntity)) {
            targetNode = node._getEntity();
            if (!targetNode) {
                return null;
            }
        }

        return editor.call('entities:get', targetNode.getGuid()) || null;
    };

    editor.on('viewport:pick:clear', () => {
        if (!editor.call('hotkey:ctrl')) {
            editor.call('selector:clear');
        }
    });

    // Handle rectangle selection
    editor.on('viewport:pick:rect:nodes', (nodes) => {
        // Convert pc.Entity nodes to entity observers
        const entities = [];

        for (const node of nodes) {
            const entity = resolveEntityFromNode(node);
            if (entity) {
                entities.push(entity);
            }
        }

        if (entities.length > 0) {
            // Rectangle select replaces current selection
            editor.call('selector:set', 'entity', entities);
        } else {
            // No entities selected, clear selection
            editor.call('selector:clear');
        }
    });

    editor.on('viewport:pick:node', (node, picked) => {
        const entity = resolveEntityFromNode(node);
        if (!entity) {
            return;
        }

        // Resolve the actual node for model component checks below
        if (node._icon || (node.__editor && node._getEntity)) {
            node = node._getEntity();
        }

        // get selector data
        const type = editor.call('selector:type');
        const items = editor.call('selector:items');

        if (type === 'entity' && items.length === 1 && items.indexOf(entity) !== -1 && !editor.call('hotkey:ctrl')) {
            // if entity already selected
            // try selecting model asset
            // with highlighting mesh instance
            if (node.model && node.model.type === 'asset' && node.model.model) {
                const meshInstances = node.model.model.meshInstances;

                let stop = false;
                meshInstances.forEach((instance, i) => {

                    if (stop) {
                        return;
                    }

                    if (instance !== picked && instance !== picked._staticSource) {
                        return;
                    }

                    const index = i;

                    // if the model component has a material mapping then
                    // open the model component otherwise go to the model asset
                    if (node.model.mapping && node.model.mapping[i] !== undefined) {
                        editor.call('selector:set', 'entity', [entity]);
                    } else {
                        // get model asset
                        const asset = editor.call('assets:get', node.model.asset);
                        if (!asset) {
                            stop = true;
                            return;
                        }

                        // select model asset
                        editor.call('selector:set', 'asset', [asset]);
                    }

                    // highlight selected node
                    setTimeout(() => {
                        const node = editor.call('attributes.rootPanel').dom.querySelector(`.pcui-asset-input.node-${index}`);
                        if (node) {
                            node.classList.add('active');
                        }
                    }, 200);

                    stop = true;
                });
            }
        } else {
            // select entity
            if (type === 'entity' && editor.call('hotkey:ctrl')) {
                // with ctrl
                if (items.indexOf(entity) !== -1) {
                    // deselect
                    editor.call('selector:remove', entity);
                } else {
                    // add to selection
                    editor.call('selector:add', 'entity', entity);
                }
            } else {
                // set selection
                editor.call('selector:set', 'entity', [entity]);
            }
        }
    });
});
