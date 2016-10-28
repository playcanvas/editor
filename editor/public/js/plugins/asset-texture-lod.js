editor.once('plugins:load:asset-texture-lod', function() {
    'use strict';

    var app = editor.call('viewport:app');
    var slots = [ 'aoMap', 'diffuseMap', 'emissiveMap', 'glossMap', 'lightMap', 'metalnessMap', 'opacityMap', 'specularMap', 'normalMap' ];


    var menuItem = editor.call('assets:contextmenu:add', {
        text: 'Texture LoD',
        icon: '&#57857;',
        value: 'texture-lod',
    });

    var convertFilter = function(current) {
        if (! current)
            return false;

        var items = [ current ];

        if (editor.call('selector:type') === 'asset' && editor.call('selector:items').indexOf(current) !== -1)
            items = editor.call('selector:items');

        for(var i = 0; i < items.length; i++) {
            if (items[i].get('type') !== 'texture' || items[i].get('source') === true)
                return false;

            if (items[i].get('tags').indexOf('lod-low') !== -1 || items[i].get('tags').indexOf('lod-mid') !== -1)
                return false;
        }

        return true;
    };

    editor.call('assets:contextmenu:add', {
        text: 'Convert (x2, x4)',
        icon: '&#57857;',
        value: 'texture-lod-convert',
        parent: menuItem,
        select: function(current) {
            var items = [ current ];

            if (editor.call('selector:type') === 'asset' && editor.call('selector:items').indexOf(current) !== -1)
                items = editor.call('selector:items');

            editor.call('plugin:texture-lod:convert', items, [{
                size: 2,
                name: 'mid'
            }, {
                size: 4,
                name: 'low'
            }]);
        },
        filter: convertFilter
    });

    editor.call('assets:contextmenu:add', {
        text: 'Convert (x4, x8)',
        icon: '&#57857;',
        value: 'texture-lod-convert-low',
        parent: menuItem,
        select: function(current) {
            var items = [ current ];

            if (editor.call('selector:type') === 'asset' && editor.call('selector:items').indexOf(current) !== -1)
                items = editor.call('selector:items');

            editor.call('plugin:texture-lod:convert', items, [{
                size: 4,
                name: 'mid'
            }, {
                size: 8,
                name: 'low'
            }]);
        },
        filter: convertFilter
    });

    var menuItemSwap = editor.call('assets:contextmenu:add', {
        text: 'Swap Textures',
        value: 'texture-lod-swap',
        parent: menuItem
    });

    editor.call('assets:contextmenu:add', {
        text: 'Original',
        value: 'texture-lod-original',
        parent: menuItemSwap,
        select: function() {
            editor.call('plugin:texture-lod:switch', 'original');
        }
    });

    editor.call('assets:contextmenu:add', {
        text: 'Medium',
        value: 'texture-lod-medium',
        parent: menuItemSwap,
        select: function() {
            editor.call('plugin:texture-lod:switch', 'medium');
        }
    });

    editor.call('assets:contextmenu:add', {
        text: 'Low',
        value: 'texture-lod-low',
        parent: menuItemSwap,
        select: function() {
            editor.call('plugin:texture-lod:switch', 'low');
        }
    });

    editor.method('plugin:texture-lod:switch', function(quality) {
        if (quality !== 'original' && quality !== 'medium' && quality !== 'low')
            return;

        var assets = editor.call('assets:list');
        var index = { };
        var indexLinks = { };

        var assetsLow = [ ];
        var assetsMid = [ ];
        var assetsHi = [ ];
        var assetsLod;

        for(var i = 0; i < assets.length; i++) {
            if (assets[i].get('type') !== 'texture' || assets[i].get('source'))
                continue;

            var tags = assets[i].get('tags');
            var list = null;

            if (tags.indexOf('lod') !== -1) {
                list = assetsHi;
            } else if (tags.indexOf('lod-mid') !== -1) {
                list = assetsMid;
            } else if (tags.indexOf('lod-low') !== -1) {
                list = assetsLow;
            }

            if (! list)
                continue;

            list.push(assets[i]);
            index[assets[i].get('id')] = assets[i];
        }

        assetsLod = assetsMid.concat(assetsLow);

        for(var i = 0; i < assetsLod.length; i++) {
            var tags = assetsLod[i].get('tags');
            var level = '';

            if (tags.indexOf('lod-mid') !== -1) {
                level = 'medium';
            } else if (tags.indexOf('lod-low') !== -1) {
                level = 'low';
            }

            if (! level)
                continue;

            for(var t = 0; t < tags.length; t++) {
                if (! tags[t].startsWith('source-'))
                    continue;

                var sourceId = parseInt(tags[t].slice(7), 10);

                if (! sourceId || ! index[sourceId])
                    continue;

                indexLinks[assetsLod[i].get('id')] = index[sourceId];
                indexLinks[sourceId + level] = assetsLod[i];
            }
        }

        var usedIndex = editor.call('assets:used:index');

        if (quality === 'original') {
            for(var i = 0; i < assetsLod.length; i++) {
                var asset = assetsLod[i];
                var used = usedIndex[asset.get('id')];
                if (! used || ! used.parent)
                    continue;

                for(var id in used.ref) {
                    if (used.ref[id].type !== 'asset')
                        continue;

                    var assetRef = editor.call('assets:get', id);
                    if (! assetRef || assetRef.get('type') !== 'material')
                        continue;

                    for(var s = 0; s < slots.length; s++) {
                        if (parseInt(assetRef.get('data.' + slots[s]), 10) !== parseInt(asset.get('id'), 10))
                            continue;

                        var assetOriginal = indexLinks[asset.get('id')];
                        if (! assetOriginal)
                            continue;

                        assetRef.set('data.' + slots[s], parseInt(assetOriginal.get('id'), 10));
                    }
                }
            }
        } else {
            var list;

            if (quality === 'medium') {
                list = assetsHi.concat(assetsLow);
            } else {
                list = assetsHi.concat(assetsMid);
            }

            for(var i = 0; i < list.length; i++) {
                var asset = list[i];
                var used = usedIndex[asset.get('id')];
                if (! used || ! used.parent)
                    continue;

                for(var id in used.ref) {
                    if (used.ref[id].type !== 'asset')
                        continue;

                    var assetRef = editor.call('assets:get', id);
                    if (! assetRef || assetRef.get('type') !== 'material')
                        continue;

                    for(var s = 0; s < slots.length; s++) {
                        if (parseInt(assetRef.get('data.' + slots[s]), 10) !== parseInt(asset.get('id'), 10))
                            continue;

                        var assetOther;

                        if (indexLinks[asset.get('id')]) {
                            var original = indexLinks[asset.get('id')];
                            if (original)
                                assetOther = indexLinks[original.get('id') + quality];
                        } else {
                            assetOther = indexLinks[asset.get('id') + quality];
                        }

                        if (! assetOther)
                            continue;

                        assetRef.set('data.' + slots[s], parseInt(assetOther.get('id'), 10));
                    }
                }
            }
        }
    });

    editor.method('plugin:texture-lod:convert', function(items, sizes) {
        if (! items) {
            if (editor.call('selector:type') !== 'asset')
                return;

            items = editor.call('selector:items');
        }

        items.forEach(function(source) {
            // should be ready texture
            if (source.get('status') === 'running' || source.get('type') !== 'texture')
                return;

            // cannot be one of lod's
            if (source.get('tags').indexOf('lod-low') !== -1 || source.get('tags').indexOf('lod-mid') !== -1)
                return;

            // should be at least 128x128
            if (! source.get('meta.width') || source.get('meta.width') < 128 || ! source.get('meta.height') || source.get('meta.height') < 128)
                return;

            // add 'lod' tag
            if (source.get('tags').indexOf('lod') === -1)
                source.insert('tags', 'lod');

            // unset preload
            source.set('preload', false);

            var tasksDone = 0;
            var path = source.get('path');
            var name = source.get('name');
            var ext = '';
            var match = name.match(/\.[a-z]{1,4}$/);
            if (match) {
                ext = name.slice(match.index + 1);
                name = name.slice(0, match.index);
            }

            if (! editor._awaitingFolderCreation)
                editor._awaitingFolderCreation = { };

            if (! sizes) {
                sizes = [{
                    size: 2,
                    name: 'mid'
                }, {
                    size: 4,
                    name: 'low'
                }];
            }

            var uiItem = editor.call('assets:panel:get', source.get('id'));
            if (uiItem) uiItem.class.add('task', 'running');

            sizes.forEach(function(options) {
                var folder = editor.call('assets:findOne', function(asset) {
                    return asset.get('type') === 'folder' && asset.get('name') === options.name && asset.get('path').equals(path);
                });

                var onFolderAvailable = function(folderId) {
                    var target = editor.call('assets:findOne', function(asset) {
                        var path = asset.get('path');

                        if (! path.length)
                            return false;

                        return asset.get('name') === (name + '-' + options.name + '.' + ext) && parseInt(asset.get('source_asset_id'), 10) === parseInt(source.get('id'), 10) && path[path.length - 1] === folderId;
                    });
                    if (target) target = target[1];

                    var evtTargetAvailable;

                    var onTargetAvailable = function(target) {
                        if (evtTargetAvailable) {
                            evtTargetAvailable.unbind();
                            evtTargetAvailable = null;
                        }

                        var task = {
                            source: parseInt(source.get('id'), 10),
                            target: parseInt(target.get('id'), 10),
                            filename: target.get('name'),
                            options: editor.call('assets:jobs:texture-convert-options', source.get('meta'))
                        };

                        task.options.size = {
                            width: Math.max(8, source.get('meta.width') / options.size),
                            height: Math.max(8, source.get('meta.height') / options.size)
                        };

                        editor.call('realtime:send', 'pipeline', {
                            name: 'convert',
                            data: task
                        });

                        editor.call('status:text', 'texture-lod: converting \'' + name + '-' + options.name + '.' + ext + '\' asset');

                        target.once('file:set', function() {
                            setTimeout(function() {
                                editor.call('assets:jobs:thumbnails', null, target);

                                if (++tasksDone === 2) {
                                    editor.call('status:text', 'texture-lod: finished \'' + name + '.' + ext + '\'');

                                    if (uiItem && source.get('task') === null)
                                        uiItem.class.remove('task', 'running');
                                }
                            }, 0);
                        });
                    };

                    if (target) {
                        // update compression
                        target.set('meta.compress', source.get('meta.compress'));

                        // available target
                        setTimeout(function() {
                            onTargetAvailable(target);
                        }, 500);
                    } else {
                        // new asset required
                        var assetNew = {
                            name: name + '-' + options.name + '.' + ext,
                            type: 'texture',
                            source: false,
                            source_asset_id: parseInt(source.get('id'), 10),
                            preload: false,
                            data: null,
                            tags: [ 'source-' + source.get('id').toString(), 'lod-' + options.name ],
                            region: source.get('region'),
                            parent: folderId,
                            scope: source.get('scope'),
                            meta: source.get('meta')
                        };

                        editor.call('assets:create', assetNew, function(err, id) {
                            if (err) {
                                editor.call('status:error', 'texture-lod: error creating asset (' + err.message + ')');
                                console.log(err.stack);
                                return;
                            }

                            target = editor.call('assets:get', id);

                            editor.call('status:text', 'texture-lod: created \'' + name + '-' + options.name + '.' + ext + '\' asset');

                            if (target) {
                                onTargetAvailable(target);
                            } else {
                                evtTargetAvailable = editor.once('assets:add[' + id + ']', onTargetAvailable);
                            }
                        }, true);
                    }
                };

                if (folder) {
                    onFolderAvailable(parseInt(folder[1].get('id'), 10));
                } else {
                    var parentFolder = path.length ? path[path.length - 1] : null;
                    var evtName = parentFolder + '-' + options.name;

                    if (editor._awaitingFolderCreation[evtName]) {
                        editor.once('plugin:texture-lod:folder:create:' + evtName, function(id) {
                            onFolderAvailable(parseInt(id, 10));
                        });
                    } else {
                        editor._awaitingFolderCreation[evtName] = true;

                        var folderNew = {
                            name: options.name,
                            type: 'folder',
                            source: true,
                            preload: false,
                            data: null,
                            parent: parentFolder,
                            scope: source.get('scope')
                        };

                        editor.call('assets:create', folderNew, function(err, id) {
                            if (err) {
                                editor.call('status:error', 'texture-lod: error creating folder (' + err.message + ')');
                                console.log(err.stack);
                                return;
                            }

                            onFolderAvailable(parseInt(id, 10));

                            editor.emit('plugin:texture-lod:folder:create:' + evtName, id);
                            delete editor._awaitingFolderCreation[evtName];
                        }, true);
                    }
                }
            });
        });
    });
});
