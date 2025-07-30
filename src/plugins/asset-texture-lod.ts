editor.once('plugins:load:asset-texture-lod', () => {
    const app = editor.call('viewport:app');
    if (!app) return; // webgl not available

    const slots = ['aoMap', 'diffuseMap', 'emissiveMap', 'glossMap', 'clearCoatMap', 'clearCoatGlossMap', 'clearCoatNormalMap', 'lightMap', 'metalnessMap', 'opacityMap', 'specularMap', 'normalMap'];

    const convertFilter = function (current) {
        if (!current) {
            return false;
        }

        let items = [current];

        if (editor.call('selector:type') === 'asset' && editor.call('selector:items').indexOf(current) !== -1) {
            items = editor.call('selector:items');
        }

        for (let i = 0; i < items.length; i++) {
            if (items[i].get('type') !== 'texture' || items[i].get('source') === true) {
                return false;
            }

            if (items[i].get('tags').indexOf('lod-low') !== -1 || items[i].get('tags').indexOf('lod-mid') !== -1) {
                return false;
            }
        }

        return true;
    };

    editor.call('assets:contextmenu:add', {
        text: 'Texture LoD',
        icon: 'E201',
        items: [{
            text: 'Convert (x2, x4)',
            icon: 'E201',
            onSelect: function (current) {
                let items = [current];

                if (editor.call('selector:type') === 'asset' && editor.call('selector:items').indexOf(current) !== -1) {
                    items = editor.call('selector:items');
                }

                editor.call('plugin:texture-lod:convert', items, [{
                    size: 2,
                    name: 'mid'
                }, {
                    size: 4,
                    name: 'low'
                }]);
            },
            onIsEnabled: convertFilter
        }, {
            text: 'Convert (x4, x8)',
            icon: 'E201',
            onSelect: function (current) {
                let items = [current];

                if (editor.call('selector:type') === 'asset' && editor.call('selector:items').indexOf(current) !== -1) {
                    items = editor.call('selector:items');
                }

                editor.call('plugin:texture-lod:convert', items, [{
                    size: 4,
                    name: 'mid'
                }, {
                    size: 8,
                    name: 'low'
                }]);
            },
            onIsEnabled: convertFilter
        }, {
            text: 'Swap Textures',
            items: [{
                text: 'Original',
                value: 'texture-lod-original',
                onSelect: function () {
                    editor.call('plugin:texture-lod:switch', 'original');
                }
            }, {
                text: 'Medium',
                onSelect: function () {
                    editor.call('plugin:texture-lod:switch', 'medium');
                }
            }, {
                text: 'Low',
                onSelect: function () {
                    editor.call('plugin:texture-lod:switch', 'low');
                }
            }]
        }]
    });

    editor.method('plugin:texture-lod:switch', (quality) => {
        if (quality !== 'original' && quality !== 'medium' && quality !== 'low') {
            return;
        }

        const assets = editor.call('assets:list');
        const index = { };
        const indexLinks = { };

        const assetsLow = [];
        const assetsMid = [];
        const assetsHi = [];

        for (let i = 0; i < assets.length; i++) {
            if (assets[i].get('type') !== 'texture' || assets[i].get('source')) {
                continue;
            }

            const tags = assets[i].get('tags');
            let list = null;

            if (tags.indexOf('lod') !== -1) {
                list = assetsHi;
            } else if (tags.indexOf('lod-mid') !== -1) {
                list = assetsMid;
            } else if (tags.indexOf('lod-low') !== -1) {
                list = assetsLow;
            }

            if (!list) {
                continue;
            }

            list.push(assets[i]);
            index[assets[i].get('id')] = assets[i];
        }

        const assetsLod = assetsMid.concat(assetsLow);

        for (let i = 0; i < assetsLod.length; i++) {
            const tags = assetsLod[i].get('tags');
            let level = '';

            if (tags.indexOf('lod-mid') !== -1) {
                level = 'medium';
            } else if (tags.indexOf('lod-low') !== -1) {
                level = 'low';
            }

            if (!level) {
                continue;
            }

            for (let t = 0; t < tags.length; t++) {
                if (!tags[t].startsWith('source-')) {
                    continue;
                }

                const sourceId = parseInt(tags[t].slice(7), 10);

                if (!sourceId || !index[sourceId]) {
                    continue;
                }

                indexLinks[assetsLod[i].get('id')] = index[sourceId];
                indexLinks[sourceId + level] = assetsLod[i];
            }
        }

        const usedIndex = editor.call('assets:used:index');

        if (quality === 'original') {
            for (let i = 0; i < assetsLod.length; i++) {
                const asset = assetsLod[i];
                const used = usedIndex[asset.get('id')];
                if (!used || !used.parent) {
                    continue;
                }

                for (const id in used.ref) {
                    if (used.ref[id].type !== 'asset') {
                        continue;
                    }

                    const assetRef = editor.call('assets:get', id);
                    if (!assetRef || assetRef.get('type') !== 'material') {
                        continue;
                    }

                    for (let s = 0; s < slots.length; s++) {
                        if (parseInt(assetRef.get(`data.${slots[s]}`), 10) !== parseInt(asset.get('id'), 10)) {
                            continue;
                        }

                        const assetOriginal = indexLinks[asset.get('id')];
                        if (!assetOriginal) {
                            continue;
                        }

                        assetRef.set(`data.${slots[s]}`, parseInt(assetOriginal.get('id'), 10));
                    }
                }
            }
        } else {
            let list;

            if (quality === 'medium') {
                list = assetsHi.concat(assetsLow);
            } else {
                list = assetsHi.concat(assetsMid);
            }

            for (let i = 0; i < list.length; i++) {
                const asset = list[i];
                const used = usedIndex[asset.get('id')];
                if (!used || !used.parent) {
                    continue;
                }

                for (const id in used.ref) {
                    if (used.ref[id].type !== 'asset') {
                        continue;
                    }

                    const assetRef = editor.call('assets:get', id);
                    if (!assetRef || assetRef.get('type') !== 'material') {
                        continue;
                    }

                    for (let s = 0; s < slots.length; s++) {
                        if (parseInt(assetRef.get(`data.${slots[s]}`), 10) !== parseInt(asset.get('id'), 10)) {
                            continue;
                        }

                        let assetOther;

                        if (indexLinks[asset.get('id')]) {
                            const original = indexLinks[asset.get('id')];
                            if (original) {
                                assetOther = indexLinks[original.get('id') + quality];
                            }
                        } else {
                            assetOther = indexLinks[asset.get('id') + quality];
                        }

                        if (!assetOther) {
                            continue;
                        }

                        assetRef.set(`data.${slots[s]}`, parseInt(assetOther.get('id'), 10));
                    }
                }
            }
        }
    });

    editor.method('plugin:texture-lod:convert', (items, sizes) => {
        if (!items) {
            if (editor.call('selector:type') !== 'asset') {
                return;
            }

            items = editor.call('selector:items');
        }

        items.forEach((source) => {
            // should be ready texture
            if (source.get('status') === 'running' || source.get('type') !== 'texture') {
                return;
            }

            // cannot be one of lod's
            if (source.get('tags').indexOf('lod-low') !== -1 || source.get('tags').indexOf('lod-mid') !== -1) {
                return;
            }

            // should be at least 128x128
            if (!source.get('meta.width') || source.get('meta.width') < 128 || !source.get('meta.height') || source.get('meta.height') < 128) {
                return;
            }

            // add 'lod' tag
            if (source.get('tags').indexOf('lod') === -1) {
                source.insert('tags', 'lod');
            }

            // unset preload
            source.set('preload', false);

            let tasksDone = 0;
            const path = source.get('path');
            let name = source.get('name');
            let ext = '';
            const match = name.match(/\.[a-z]{1,4}$/);
            if (match) {
                ext = name.slice(match.index + 1);
                name = name.slice(0, match.index);
            }

            if (!editor._awaitingFolderCreation) {
                editor._awaitingFolderCreation = { };
            }

            if (!sizes) {
                sizes = [{
                    size: 2,
                    name: 'mid'
                }, {
                    size: 4,
                    name: 'low'
                }];
            }

            const uiItem = editor.call('assets:panel:get', source.get('id'));
            if (uiItem) uiItem.class.add('task', 'running');

            sizes.forEach((options) => {
                const folder = editor.call('assets:findOne', (asset) => {
                    return asset.get('type') === 'folder' && asset.get('name') === options.name && asset.get('path').equals(path);
                });

                const onFolderAvailable = function (folderId) {
                    let target = editor.call('assets:findOne', (asset) => {
                        const path = asset.get('path');

                        if (!path.length) {
                            return false;
                        }

                        return asset.get('name') === (`${name}-${options.name}.${ext}`) && parseInt(asset.get('source_asset_id'), 10) === parseInt(source.get('id'), 10) && path[path.length - 1] === folderId;
                    });
                    if (target) target = target[1];

                    let evtTargetAvailable;

                    const onTargetAvailable = function (target) {
                        if (evtTargetAvailable) {
                            evtTargetAvailable.unbind();
                            evtTargetAvailable = null;
                        }

                        const task = {
                            source: parseInt(source.get('uniqueId'), 10),
                            target: parseInt(target.get('uniqueId'), 10),
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

                        editor.call('status:text', `texture-lod: converting '${name}-${options.name}.${ext}' asset`);

                        const onFileSet = function (value) {
                            if (!value) return;
                            target.off('file:set', onFileSet);

                            setTimeout(() => {
                                editor.call('assets:jobs:thumbnails', null, target);

                                if (++tasksDone === 2) {
                                    editor.call('status:text', `texture-lod: finished '${name}.${ext}'`);

                                    if (uiItem && source.get('task') === null) {
                                        uiItem.class.remove('task', 'running');
                                    }
                                }
                            }, 0);
                        };

                        target.on('file:set', onFileSet);
                    };

                    if (target) {
                        // update compression
                        target.set('meta.compress', source.get('meta.compress'));
                        target.set('data', source.get('data'));

                        // available target
                        setTimeout(() => {
                            onTargetAvailable(target);
                        }, 500);
                    } else {
                        // new asset required
                        const assetNew = {
                            name: `${name}-${options.name}.${ext}`,
                            type: 'texture',
                            source: false,
                            source_asset_id: parseInt(source.get('id'), 10),
                            preload: false,
                            data: source.get('data'),
                            tags: [`source-${source.get('id').toString()}`, `lod-${options.name}`],
                            region: source.get('region'),
                            parent: folderId,
                            scope: source.get('scope'),
                            meta: source.get('meta')
                        };

                        editor.call('assets:create', assetNew, (err, id) => {
                            if (err) {
                                editor.call('status:error', `texture-lod: error creating asset (${err.message})`);
                                console.log(err.stack);
                                return;
                            }

                            target = editor.call('assets:get', id);

                            editor.call('status:text', `texture-lod: created '${name}-${options.name}.${ext}' asset`);

                            if (target) {
                                onTargetAvailable(target);
                            } else {
                                evtTargetAvailable = editor.once(`assets:add[${id}]`, onTargetAvailable);
                            }
                        }, true);
                    }
                };

                if (folder) {
                    onFolderAvailable(parseInt(folder[1].get('id'), 10));
                } else {
                    const parentFolder = path.length ? path[path.length - 1] : null;
                    const evtName = `${parentFolder}-${options.name}`;

                    if (editor._awaitingFolderCreation[evtName]) {
                        editor.once(`plugin:texture-lod:folder:create:${evtName}`, (id) => {
                            onFolderAvailable(parseInt(id, 10));
                        });
                    } else {
                        editor._awaitingFolderCreation[evtName] = true;

                        const folderNew = {
                            name: options.name,
                            type: 'folder',
                            source: true,
                            preload: false,
                            data: null,
                            parent: parentFolder,
                            scope: source.get('scope')
                        };

                        editor.call('assets:create', folderNew, (err, id) => {
                            if (err) {
                                editor.call('status:error', `texture-lod: error creating folder (${err.message})`);
                                console.log(err.stack);
                                return;
                            }

                            onFolderAvailable(parseInt(id, 10));

                            editor.emit(`plugin:texture-lod:folder:create:${evtName}`, id);
                            delete editor._awaitingFolderCreation[evtName];
                        }, true);
                    }
                }
            });
        });
    });
});
