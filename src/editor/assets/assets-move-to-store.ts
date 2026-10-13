editor.once('load', () => {
    editor.method('assets:move-to-store', (asset) => {
        if (!asset) {
            return;
        }

        const selectorType = editor.call('selector:type');
        const selectedItems = editor.call('selector:items');

        // if the asset that was right-clicked is in the selection
        // then include all the other selected items in the delete
        // otherwise only delete the right-clicked item
        const items =
            selectorType === 'asset' && selectedItems.find((e) => e.get('id') === asset.get('id'))
                ? selectedItems
                : [asset];

        const assetIds = items.map((e) => e.get('id'));

        // a referenced font is unusable without the json and texture assets it points at, and a clone
        // of the store item cannot invent them, so move them alongside it
        items.forEach((e) => {
            if (e.get('type') !== 'font' || !e.has('data.jsonAsset')) {
                return;
            }
            [e.get('data.jsonAsset'), ...(e.get('data.textureAssets') || [])].forEach((ref) => {
                const mirror = typeof ref === 'number' ? editor.call('assets:get', ref) : null;
                if (mirror && !assetIds.includes(mirror.get('id'))) {
                    assetIds.push(mirror.get('id'));
                }
            });
        });

        editor.call(
            'picker:text-input',
            (text) => {
                if (text.length === 0) {
                    return false;
                }
                editor.api.globals.rest.store.storeMove(text, {
                    branchId: config.self.branch.id,
                    assetIds: assetIds
                });
                return true;
            },
            {
                headerText: `Moving ${assetIds.length} asset${assetIds.length === 1 ? '' : 's'} to store`,
                labelText: 'StoreItem ID:'
            }
        );
    });
});
