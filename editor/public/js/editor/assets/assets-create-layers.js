editor.once('load', function() {
    'use strict';

    var defaultOpaqueSort = 2; // material-mesh sort order
    var defaultTransparentSort = 3; // back to front order

    editor.method('assets:create:layers', function (args) {
        if (! editor.call('permissions:write'))
            return;

        args = args || { };

        var asset = {
            name: 'Layers',
            type: 'layers',
            source: false,
            preload: true,
            data: {
                layers: {
                    0: {
                        name: 'World',
                        enabled: true,
                        opaqueSortMode: defaultOpaqueSort,
                        transparentSortMode: defaultTransparentSort
                    },
                    1: {
                        name: 'Depth',
                        enabled: false,
                        opaqueSortMode: defaultOpaqueSort,
                        transparentSortMode: defaultTransparentSort
                    },
                    2: {
                        name: 'Skybox',
                        enabled: false,
                        opaqueSortMode: 0, // none sort order
                        transparentSortMode: defaultTransparentSort
                    },
                    3: {
                        name: 'UI',
                        enabled: true,
                        opaqueSortMode: 1,
                        transparentSortMode: 1 // manual sort mode
                    },
                    4: {
                        name: 'Gizmos',
                        enabled: true,
                        opaqueSortMode: 0, // none sort mode
                        transparentSortMode: defaultTransparentSort
                    }
                },
                sublayerOrder: [{
                    layer: '0',
                    transparent: false
                }, {
                    layer: '1',
                    transparent: false
                }, {
                    layer: '2',
                    transparent: false
                }, {
                    layer: '0',
                    transparent: true
                }, {
                    layer: '3',
                    transparent: true
                }, {
                    layer: '4',
                    transparent: true
                }]
            },
            parent: (args.parent !== undefined) ? args.parent : editor.call('assets:selected:folder'),
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', asset);
    });
});
