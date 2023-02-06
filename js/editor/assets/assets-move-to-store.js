editor.once('load', function () {
    editor.method('assets:move-to-store', function (asset) {
        if (!asset) {
            return;
        }

        var selectorType = editor.call('selector:type');
        var selectedItems = editor.call('selector:items');

        // if the asset that was right-clicked is in the selection
        // then include all the other selected items in the delete
        // otherwise only delete the right-clicked item
        var items = (selectorType === 'asset' && selectedItems.find(e => e.get('id') === asset.get('id'))) ? selectedItems : [asset];
        var assetIds = items.map(e => e.get('id'));

        editor.call('picker:text-input', function (text) {
            if (text.length === 0) {
                return false;
            }
            Ajax(
                {
                    url: '{{url.api}}/store/items/' + text,
                    method: 'PUT',
                    auth: true,
                    data: {
                        branchId: config.self.branch.id,
                        assetIds: assetIds
                    }
                },
                function (t) { }
            );
            return true;
        },
        {
            headerText: 'Moving ' + assetIds.length + ' asset' + (assetIds.length === 1 ? '' : 's') + ' to store',
            labelText: 'StoreItem ID:'
        });
    });
});
