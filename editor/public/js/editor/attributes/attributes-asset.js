editor.once('load', function() {
    'use strict';

    var legacyScripts = editor.call('settings:project').get('useLegacyScripts');

    var sourceRuntimeOptions = {
        '-1': 'various',
        '0': 'yes',
        '1': 'no'
    };

    var editableTypes = {
        'script': 1,
        'css': 1,
        'html': 1,
        'shader': 1,
        'text': 1,
        'json': 1
    };

    var assetsPanel = null;

    var assetInspector = new pcui.AssetInspector({
        assets: editor.call('assets:raw'),
        projectSettings: editor.call('settings:project'),
        history: editor.call('editor:history'),
        editableTypes: editableTypes
    });

    editor.on('attributes:inspect[asset]', (assets) => {
        var root = editor.call('attributes.rootPanel');

        if (!assetInspector.parent)
            root.append(assetInspector);
        assetInspector.link(assets);
    });

    editor.on('attributes:beforeClear', function() {
        assetInspector.unlink();
        if (assetInspector.parent) {
            assetInspector.parent.remove(assetInspector);
        }
    });

    editor.on('attributes:clear', function () {
        assetInspector.unlink();
    });

    editor.on('attributes:inspect[asset]#######OLD', function(assets) {
        var events = [ ];

        // unfold panel
        var panel = editor.call('attributes.rootPanel');
        if (panel.collapsed)
            panel.collapsed = false;

        var multi = assets.length > 1;
        var type = ((assets[0].get('source') && assets[0].get('type') !== 'folder') ? 'source ' : '') + assets[0].get('type');

        if (multi) {
            editor.call('attributes:header', assets.length + ' assets');

            for(var i = 0; i < assets.length; i++) {
                if (type !== ((assets[0].get('source') && assets[0].get('type') !== 'folder') ? 'source ' : '') + assets[i].get('type')) {
                    type = null;
                    break;
                }
            }
        } else {
            editor.call('attributes:header', type);
        }

        // panel
        var panel = editor.call('attributes:addPanel');
        panel.class.add('component');
        assetsPanel = panel;
        panel.once('destroy', function () {
            assetsPanel = null;

            for(var i = 0; i < events.length; i++)
                events[i].unbind();

            events = null;
        });

        var allBundles = editor.call('assets:bundles:list');
        var bundlesEnum = { "": "" };
        for (var i = 0; i < allBundles.length; i++) {
            bundlesEnum[allBundles[i].get('id')] = allBundles[i].get('name');
        }

        var fieldBundlesArgs = {
            parent: panel,
            name: 'Bundles',
            type: 'tags',
            tagType: 'number',
            enum: bundlesEnum,
            placeholder: 'Select Bundle',
            path: 'bundles',
            stopHistory: true, // do not trigger history events for these 'proxy' observers
            tagToString: function (tag) {
                var asset = editor.call('assets:get', tag);
                return asset ? asset.get('name') : 'Missing';
            },
            onClickTag: function () {
                var id = this.originalValue;
                var asset = editor.call('assets:get', id);
                if (asset) {
                    editor.call('selector:set', 'asset', [asset]);
                }
            }
        };

        var refreshBundleObservers = function () {
            // unlinkField is added by attributes-panel.js
            // call it in order to unlink the field from its previous observers
            if (fieldBundlesArgs.unlinkField) {
                fieldBundlesArgs.unlinkField();
            }

            // destroy the old observers
            if (fieldBundlesArgs.link) {
                for (var i = 0; i < fieldBundlesArgs.link.length; i++) {
                    fieldBundlesArgs.link[i].destroy();
                }
            }

            // set the link of the field to be a list of observers with a 'bundles'
            // field. The bundles field holds all of the bundle asset ids that each
            // asset belongs to. This will allow us to use the same 'tags' type field.
            fieldBundlesArgs.link = assets.map(function (asset) {
                var bundleAssets = editor.call('assets:bundles:listForAsset', asset);
                var observer = new Observer({
                    bundles: bundleAssets.map(function (bundle) {
                        return bundle.get('id');
                    })
                });

                observer.on('bundles:insert', function (bundleId) {
                    var bundleAsset = editor.call('assets:get', bundleId);
                    if (bundleAsset) {
                        editor.call('assets:bundles:addAssets', assets, bundleAsset);
                    }
                });

                observer.on('bundles:remove', function (bundleId) {
                    var bundleAsset = editor.call('assets:get', bundleId);
                    if (bundleAsset) {
                        editor.call('assets:bundles:removeAssets', assets, bundleAsset);
                    }
                });

                return observer;
            });

            // link the field to the new observers
            // The linkField method is added by attributes-panel.js
            if (fieldBundlesArgs.linkField) {
                fieldBundlesArgs.linkField();
            }
        };

        refreshBundleObservers();

        events.push(editor.on('assets:bundles:insert', refreshBundleObservers));
        events.push(editor.on('assets:bundles:remove', refreshBundleObservers));

        if (multi) {
            var fieldFilename = editor.call('attributes:addField', {
                parent: panel,
                name: 'Assets',
                value: assets.length
            });

            var canShowBundles = editor.call('users:hasFlag', 'hasBundles');
            var scriptSelected = false;
            for(var i = 0; i < assets.length; i++) {
                if (legacyScripts) {
                    // scripts are not real assets, and have no preload option
                    if (! scriptSelected && assets[i].get('type') === 'script')
                        scriptSelected = true;
                }

                if (canShowBundles && !editor.call('assets:bundles:canAssetBeAddedToBundle', assets[i])) {
                    canShowBundles = false;
                }
            }


            var source = (assets[0].get('type') === 'folder') ? 1 : assets[0].get('source') + 0;

            for(var i = 1; i < assets.length; i++) {
                if ((assets[i].get('type') === 'folder' ? 1 : assets[i].get('source') + 0) !== source) {
                    source = -1;
                    break;
                }
            }

            if (! scriptSelected && source === 0) {
                // tags
                var fieldTags = editor.call('attributes:addField', {
                    parent: panel,
                    name: 'Tags',
                    placeholder: 'Add Tag',
                    type: 'tags',
                    tagType: 'string',
                    link: assets,
                    path: 'tags'
                });
                // reference
                editor.call('attributes:reference:attach', 'asset:tags', fieldTags.parent.parent.innerElement.firstChild.ui);
            }

            if (! scriptSelected) {
                // runtime
                var fieldRuntime = editor.call('attributes:addField', {
                    parent: panel,
                    name: 'Runtime',
                    value: sourceRuntimeOptions[source]
                });
                // reference
                editor.call('attributes:reference:attach', 'asset:runtime', fieldRuntime.parent.innerElement.firstChild.ui);
            }

            // type
            var fieldType = editor.call('attributes:addField', {
                parent: panel,
                name: 'Type',
                value: type ? type : 'various'
            });
            // reference
            editor.call('attributes:reference:attach', 'asset:type', fieldType.parent.innerElement.firstChild.ui);
            if (type)
                editor.call('attributes:reference:asset:' + type + ':asset:attach', fieldType);

            // preload
            if (! scriptSelected && source === 0) {
                var fieldPreload = editor.call('attributes:addField', {
                    parent: panel,
                    name: 'Preload',
                    type: 'checkbox',
                    link: assets,
                    path: 'preload'
                });
                fieldPreload.parent.class.add('preload');
                editor.call('attributes:reference:attach', 'asset:preload', fieldPreload.parent.innerElement.firstChild.ui);
            }

            if (! scriptSelected) {
                // size
                var sizeCalculate = function() {
                    var size = 0;

                    for(var i = 0; i < assets.length; i++) {
                        if (assets[i].get('type') === 'bundle') {
                            size += editor.call('assets:bundles:calculateSize', assets[i]);
                        } else {
                            size += assets[i].get('file.size') || 0;
                        }
                    }

                    fieldSize.value = bytesToHuman(size);
                };
                var fieldSize = editor.call('attributes:addField', {
                    parent: panel,
                    name: 'Size'
                });
                sizeCalculate();

                var evtSize = [ ];
                for(var i = 0; i < assets.length; i++) {
                    evtSize.push(assets[i].on('file:set', sizeCalculate));
                    evtSize.push(assets[i].on('file:unset', sizeCalculate));
                    evtSize.push(assets[i].on('file.size:set', sizeCalculate));
                    evtSize.push(assets[i].on('file.size:unset', sizeCalculate));

                    if (assets[i].get('type') === 'bundle') {
                        evtSize.push(assets[i].on('data.assets:set', sizeCalculate));
                        evtSize.push(assets[i].on('data.assets:insert', sizeCalculate));
                        evtSize.push(assets[i].on('data.assets:remove', sizeCalculate));
                    }
                }

                panel.once('destroy', function () {
                    for(var i = 0; i < evtSize.length; i++) {
                        evtSize[i].unbind();
                    }
                    evtSize.length = 0;
                });

                // reference
                editor.call('attributes:reference:attach', 'asset:size', fieldSize.parent.innerElement.firstChild.ui);
            }


            if (! scriptSelected && source === 0) {
                // source
                var fieldSource = editor.call('attributes:addField', {
                    parent: panel,
                    name: 'Source',
                    value: 'none'
                });
                // reference
                editor.call('attributes:reference:attach', 'asset:source', fieldSource.parent.innerElement.firstChild.ui);

                var sourceId = assets[0].get('source_asset_id');
                for(var i = 1; i < assets.length; i++) {
                    if (sourceId !== assets[i].get('source_asset_id')) {
                        sourceId = 0;
                        fieldSource.value = 'various';
                        break;
                    }
                }
                fieldSource.on('click', function() {
                    if (! sourceId)
                        return;

                    var asset = editor.call('assets:get', sourceId);

                    if (! asset)
                        return;

                    editor.call('selector:set', 'asset', [ asset ]);
                });
                if (sourceId) {
                    var source = editor.call('assets:get', sourceId);
                    if (source) {
                        fieldSource.value = source.get('name');
                        fieldSource.class.add('export-model-archive');

                        var evtSourceName = source.on('name:set', function(value) {
                            fieldSource.value = value;
                        });
                        fieldSource.once('destroy', function() {
                            evtSourceName.unbind();
                        });
                    }
                }
            }

            // add bundles field
            if (canShowBundles) {
                var fieldBundles = editor.call('attributes:addField', fieldBundlesArgs);

                // reference
                editor.call('attributes:reference:attach', 'asset:bundles', fieldBundles.parent.parent.innerElement.firstChild.ui);
            }
        } else {
            if (legacyScripts && assets[0].get('type') === 'script') {
                // filename
                var fieldFilename = editor.call('attributes:addField', {
                    parent: panel,
                    name: 'Filename',
                    // type: 'string',
                    link: assets[0],
                    path: 'filename'
                });
                // reference
                editor.call('attributes:reference:attach', 'asset:script:filename', fieldFilename.parent.innerElement.firstChild.ui);

            } else {
                // id
                var fieldId = editor.call('attributes:addField', {
                    parent: panel,
                    name: 'ID',
                    link: assets[0],
                    path: 'id'
                });
                // reference
                editor.call('attributes:reference:attach', 'asset:id', fieldId.parent.innerElement.firstChild.ui);

                // name
                var fieldName = editor.call('attributes:addField', {
                    parent: panel,
                    name: 'Name',
                    type: 'string',
                    value: assets[0].get('name')
                });
                events.push(assets[0].on('name:set', function (newName) {
                    fieldName.value = newName;
                }));
                events.push(fieldName.on('change', function (newName) {
                    if (newName !== assets[0].get('name')) {
                        editor.call('assets:rename', assets[0], newName);
                    }
                }));
                fieldName.class.add('asset-name');
                // reference
                editor.call('attributes:reference:attach', 'asset:name', fieldName.parent.innerElement.firstChild.ui);

                if (! assets[0].get('source') && assets[0].get('type') !== 'folder') {
                    // tags
                    var fieldTags = editor.call('attributes:addField', {
                        parent: panel,
                        name: 'Tags',
                        placeholder: 'Add Tag',
                        type: 'tags',
                        tagType: 'string',
                        link: assets[0],
                        path: 'tags'
                    });
                    // reference
                    editor.call('attributes:reference:attach', 'asset:tags', fieldTags.parent.parent.innerElement.firstChild.ui);
                }

                // runtime
                var runtime = sourceRuntimeOptions[assets[0].get('source') + 0];
                if (assets[0].get('type') === 'folder')
                    runtime = sourceRuntimeOptions[1];

                var fieldRuntime = editor.call('attributes:addField', {
                    parent: panel,
                    name: 'Runtime',
                    value: runtime
                });
                // reference
                editor.call('attributes:reference:attach', 'asset:runtime', fieldRuntime.parent.innerElement.firstChild.ui);


                // taskInfo
                var fieldFailed = editor.call('attributes:addField', {
                    parent: panel,
                    name: 'Failed',
                    link: assets[0],
                    path: 'taskInfo'
                });
                fieldFailed.class.add('error');

                var checkFailed = function() {
                    fieldFailed.parent.hidden = assets[0].get('task') !== 'failed' || ! assets[0].get('taskInfo');
                };
                checkFailed();

                events.push(assets[0].on('task:set', checkFailed));
                events.push(assets[0].on('taskInfo:set', checkFailed));
                events.push(assets[0].on('taskInfo:unset', checkFailed));
            }


            // type
            var fieldType = editor.call('attributes:addField', {
                parent: panel,
                name: 'Type',
                value: type
            });
            // reference
            editor.call('attributes:reference:attach', 'asset:type', fieldType.parent.innerElement.firstChild.ui);
            // reference type
            if (! assets[0].get('source'))
                editor.call('attributes:reference:asset:' + assets[0].get('type') + ':asset:attach', fieldType);


            if (! (legacyScripts && assets[0].get('type') === 'script') && assets[0].get('type') !== 'folder' && ! assets[0].get('source')) {
                // preload
                var fieldPreload = editor.call('attributes:addField', {
                    parent: panel,
                    name: 'Preload',
                    type: 'checkbox',
                    link: assets[0],
                    path: 'preload'
                });
                fieldPreload.parent.class.add('preload');
                editor.call('attributes:reference:attach', 'asset:preload', fieldPreload.parent.innerElement.firstChild.ui);
            }

            // size
            if (assets[0].has('file') || assets[0].get('type') === 'bundle') {
                var size = assets[0].get('type') === 'bundle' ? editor.call('assets:bundles:calculateSize', assets[0]) : assets[0].get('file.size');
                var fieldSize = editor.call('attributes:addField', {
                    parent: panel,
                    name: 'Size',
                    value: bytesToHuman(size)
                });

                var evtSize = [];
                evtSize.push(assets[0].on('file:set', function (value) {
                    fieldSize.text = bytesToHuman(value ? value.size : 0);
                }));

                evtSize.push(assets[0].on('file.size:set', function(value) {
                    fieldSize.text = bytesToHuman(value);
                }));

                if (assets[0].get('type') === 'bundle') {
                    var recalculateSize = function () {
                        fieldSize.text = bytesToHuman(editor.call('assets:bundles:calculateSize', assets[0]));
                    };

                    evtSize.push(assets[0].on('data.assets:set', recalculateSize));
                    evtSize.push(assets[0].on('data.assets:insert', recalculateSize));
                    evtSize.push(assets[0].on('data.assets:remove', recalculateSize));
                }

                panel.once('destroy', function () {
                    for (var i = 0; i < evtSize.length; i++) {
                        evtSize[i].unbind();
                    }
                    evtSize.length = 0;
                });

                // reference
                editor.call('attributes:reference:attach', 'asset:size', fieldSize.parent.innerElement.firstChild.ui);
            }

            if (! (legacyScripts && assets[0].get('type') === 'script') && ! assets[0].get('source')) {
                // source
                var fieldSource = editor.call('attributes:addField', {
                    parent: panel,
                    name: 'Source',
                    value: 'none'
                });
                // reference
                editor.call('attributes:reference:attach', 'asset:source', fieldSource.parent.innerElement.firstChild.ui);

                var sourceId = assets[0].get('source_asset_id');
                fieldSource.on('click', function() {
                    if (! sourceId)
                        return;

                    var asset = editor.call('assets:get', sourceId);

                    if (! asset)
                        return;

                    editor.call('selector:set', 'asset', [ asset ]);
                });
                if (sourceId) {
                    var source = editor.call('assets:get', sourceId);
                    if (source) {
                        fieldSource.value = source.get('name');
                        fieldSource.class.add('export-model-archive');

                        var evtSourceName = source.on('name:set', function(value) {
                            fieldSource.value = value;
                        });
                        fieldSource.once('destroy', function() {
                            evtSourceName.unbind();
                        });
                    }
                }
            }

            if (editor.call('users:hasFlag', 'hasBundles') && editor.call('assets:bundles:canAssetBeAddedToBundle', assets[0])) {
                var fieldBundles = editor.call('attributes:addField', fieldBundlesArgs);

                // reference
                editor.call('attributes:reference:attach', 'asset:bundles', fieldBundles.parent.parent.innerElement.firstChild.ui);
            }

            var panelButtons = new ui.Panel();
            panelButtons.class.add('buttons');
            panel.append(panelButtons);

            // download
            if (assets[0].get('type') !== 'folder' && ! (legacyScripts && assets[0].get('type') === 'script') && assets[0].get('type') !== 'sprite') {
                // download
                var btnDownload = new ui.Button();

                btnDownload.hidden = ! editor.call('permissions:read');
                var evtBtnDownloadPermissions = editor.on('permissions:set:' + config.self.id, function() {
                    btnDownload.hidden = ! editor.call('permissions:read');
                });

                btnDownload.text = 'Download';
                btnDownload.class.add('download-asset', 'large-with-icon');
                btnDownload.element.addEventListener('click', function(evt) {
                    if (btnDownload.prevent)
                        return;

                    if (assets[0].get('source') || assets[0].get('type') === 'texture' || assets[0].get('type') === 'audio') {
                        window.open(assets[0].get('file.url'));
                    } else {
                        window.open('/api/assets/' + assets[0].get('id') + '/download?branchId=' + config.self.branch.id);
                    }
                });
                panelButtons.append(btnDownload);

                btnDownload.once('destroy', function() {
                    evtBtnDownloadPermissions.unbind();
                });
            }

            // script editor
            if (assets[0].get('type') === 'textureatlas' || assets[0].get('type') === 'sprite') {
                var btnSpriteEditor = new ui.Button();
                btnSpriteEditor.text = 'Sprite Editor';
                btnSpriteEditor.disabled = assets[0].get('type') === 'sprite' && (! assets[0].get('data.textureAtlasAsset') || ! editor.call('assets:get', assets[0].get('data.textureAtlasAsset')));
                btnSpriteEditor.class.add('sprite-editor', 'large-with-icon');
                btnSpriteEditor.on('click', function () {
                    editor.call('picker:sprites', assets[0]);
                });
                panelButtons.append(btnSpriteEditor);

                var evtSetAtlas = null;
                if (assets[0].get('type') === 'sprite') {
                    evtSetAtlas = assets[0].on('data.textureAtlasAsset:set', function (value) {
                        btnSpriteEditor.disabled = ! value || ! editor.call('assets:get', value);
                    });
                }

                panelButtons.once('destroy', function () {
                    if (evtSetAtlas) {
                        evtSetAtlas.unbind();
                        evtSetAtlas = null;
                    }
                });
            }

            if (editableTypes[assets[0].get('type')]) {
                // edit
                var btnEdit = new ui.Button();

                btnEdit.text = editor.call('permissions:write') ? 'Edit' : 'View';
                var evtPermissions = editor.on('permissions:writeState', function(state) {
                    btnEdit.text = state ? 'Edit' : 'View';
                });

                btnEdit.class.add('edit-script', 'large-with-icon');
                btnEdit.hidden = ! assets[0].has('file.url');
                btnEdit.element.addEventListener('click', function(evt) {
                    editor.call('assets:edit', assets[0]);
                }, false);
                panelButtons.append(btnEdit);

                var evtFileUrl = assets[0].on('file.url:set', function() {
                    btnEdit.hidden = false;
                });
                var evtFileUrlUnset = assets[0].on('file.url:unset', function() {
                    btnEdit.hidden = true;
                });

                btnEdit.once('destroy', function() {
                    evtPermissions.unbind();
                    evtFileUrl.unbind();
                    evtFileUrlUnset.unbind();
                });
            }
        }
    });

    editor.on('attributes:assets:toggleInfo', function (enabled) {
        if (assetsPanel) {
            assetsPanel.hidden = !enabled;
        }
    });

    editor.method('attributes:assets:panel', function() {
        return assetsPanel;
    });
});
