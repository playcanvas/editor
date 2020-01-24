Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'asset-inspector';
    const CLASS_DOWNLOAD_ASSET = CLASS_ROOT + '-download-asset';
    const CLASS_EDIT_ASSET = CLASS_ROOT + '-edit-asset';

    const ATTRIBUTES = [{
        label: 'ID',
        alias: 'id',
        path: 'id',
        type: 'label'
    }, {
        label: 'Assets',
        path: 'assets',
        type: 'label'
    }, {
        label: 'Name',
        path: 'name',
        type: 'string'
    }, {
        label: 'Tags',
        alias: 'tags',
        path: 'tags',
        type: 'tags',
        args: {
            type: 'string',
            placeholder: 'Add Tags'
        }
    }, {
        label: 'Runtime',
        alias: 'source',
        type: 'label'
    }, {
        label: 'Type',
        alias: 'type',
        type: 'label',
        args: {
            renderChanges: false
        }
    }, {
        label: 'Preload',
        path: 'preload',
        alias: 'preload',
        type: 'boolean'
    }, {
        label: 'Size',
        alias: 'size',
        type: 'label',
        args: {
            renderChanges: false
        }
    }, {
        label: 'Source',
        alias: 'source_asset_id',
        type: 'label',
        args: {
            renderChanges: false
        }
    }, {
        label: 'Bundles',
        alias: 'bundles',
        type: 'bundles',
        path: 'bundles',
        args: {
            type: 'string'
        }
    }];

    ATTRIBUTES.forEach(attr => {
        const path = attr.alias || attr.path;
        if (!path) return;
        const parts = path.split('.');
        attr.reference = `asset:${parts[parts.length - 1]}`;
    });

    class AssetInspector extends pcui.Container {
        constructor(args) {
            if (!args) args = {};
            args.flex = true;

            super(args);

            this.class.add(CLASS_ROOT);

            this._projectSettings = args.projectSettings;
            this._editableTypes = args.editableTypes;

            this._assetTypes = editor.call('schema:assets:list');

            this._attributesInspector = new pcui.AttributesInspector({
                history: args.history,
                attributes: ATTRIBUTES
            });
            this.append(this._attributesInspector);

            this._btnContainer = new pcui.Container({
                flex: true,
                flexDirection: 'row'
            });
            this.append(this._btnContainer);

            // add download button
            this._btnDownloadAsset = new pcui.Button({
                text: 'Download',
                icon: 'E228',
                flexGrow: 1,
                class: CLASS_DOWNLOAD_ASSET
            });

            this._btnDownloadAsset.hidden = !editor.call('permissions:read');
            const evtBtnDownloadPermissions = editor.on('permissions:set:' + config.self.id, () => {
                this._btnDownloadAsset.hidden = ! editor.call('permissions:read');
            });
            this._btnDownloadAsset.once('destroy', () => {
                evtBtnDownloadPermissions.unbind();
            });
            this._btnContainer.append(this._btnDownloadAsset);

            this._btnDownloadAsset.on('click', this._onClickDownloadAsset.bind(this));

            // add edit button

            this._btnEditAsset = new pcui.Button({
                text: editor.call('permissions:write') ? 'Edit' : 'View',
                icon: 'E130',
                flexGrow: 1,
                class: CLASS_EDIT_ASSET
            });
            const evtBtnEditPermissions = editor.on('permissions:writeState', (state) => {
                this._btnEditAsset.text = state ? 'Edit' : 'View';
            });
            this._btnEditAsset.once('destroy', () => {
                evtBtnEditPermissions.unbind();
            });
            this._btnEditAsset.on('click', this._onClickEditAsset.bind(this));
            this._btnContainer.append(this._btnEditAsset);

            // add typed asset inspectors
            this._typedAssetInspectors = {};

            this._assetTypes.forEach(assetType => {

                // check if class exists
                const cls = `${assetType[0].toUpperCase()}${assetType.substring(1)}AssetInspector`;
                if (pcui.hasOwnProperty(cls)) {
                    const inspector = new pcui[cls]({
                        hidden: true,
                        assets: args.assets,
                        projectSettings: args.projectSettings,
                        history: args.history
                    });

                    this._typedAssetInspectors[assetType] = inspector;

                    this.append(inspector);
                }
            });

            this._assetsList = args.assets;
            this._assets = null;
            this._assetEvents = [];
        }

        _onClickDownloadAsset(evt) {
            const legacyScripts = this._projectSettings.get('useLegacyScripts');
            if (this._assets[0].get('type') !== 'folder' && ! (legacyScripts && this._assets[0].get('type') === 'script') && this._assets[0].get('type') !== 'sprite') {

                if (this._assets[0].get('source') || this._assets[0].get('type') === 'texture' || this._assets[0].get('type') === 'audio') {
                    window.open(this._assets[0].get('file.url'));
                } else {
                    window.open('/api/assets/' + this._assets[0].get('id') + '/download?branchId=' + config.self.branch.id);
                }
            }
        }

        _onClickEditAsset(evt) {
            editor.call('assets:edit', this._assets[0]);
        }

        _onClickSourceAsset(evt) {
            const sourceId = this._assets[0].get('source_asset_id');
            if (!sourceId)
                return;

            const asset = editor.call('assets:get', sourceId);

            if (! asset)
                return;

            editor.call('selector:set', 'asset', [asset]);
        }

        _updateFileSize(assets) {
            if (!this._assets) return;

            const totalSize = this._assets.map(asset => {
                return asset.has('file.size') ? asset.get('file.size') : 0;
            }).reduce((total, curr) => {
                return total + curr;
            });

            this._attributesInspector.getField('size').values = this._assets.map(asset => {
                return bytesToHuman(totalSize);
            });
        }

        _updateDownloadButtonOnCubemapChange() {
            if (!this._assets || !this._assets[0].get('type') === 'cubemap') return;
            let hasAllCubemapTextures = true;
            this._assets[0].get('data.textures').forEach(texture => {
                if (texture === null) {
                    hasAllCubemapTextures = false;
                }
            });
            if (!hasAllCubemapTextures) {
                this._btnDownloadAsset.disabled = true;
            } else {
                this._btnDownloadAsset.disabled = false;
            }
        }

        link(assets) {
            this.unlink();

            if (!assets || !assets.length) return;

            this._assets = assets;

            console.log(assets);
            this._attributesInspector.link(assets);

            this._attributesInspector.getField('source').values = assets.map(asset => {
                return asset.get('source') ? 'no' : 'yes';
            });
            this._attributesInspector.getField('assets').values = assets.map(asset => {
                return assets.length;
            });
            this._attributesInspector.getField('type').values = assets.map(asset => {
                if (asset.get('type') === 'scene') {
                    return 'source scene';
                }

                return asset.get('type');
            });
            this._updateFileSize();
            assets.forEach(asset => {
                this._assetEvents.push(asset.on('file.size:set', this._updateFileSize.bind(this)));
            });

            this._attributesInspector.getField('source_asset_id').values = assets.map(asset => {
                const sourceAssetId = asset.get('source_asset_id');
                if (!sourceAssetId) return 'none';

                const sourceAsset = this._assetsList.get(sourceAssetId);
                return sourceAsset ? sourceAsset.get('name') : sourceAssetId;
            });

            this._assetTypes.forEach(assetType => {
                // check if class exists
                const cls = `${assetType[0].toUpperCase()}${assetType.substring(1)}AssetInspector`;
                if (pcui.hasOwnProperty(cls)) {
                    let shouldDisplayTypedInspector = true;
                    assets.forEach(asset => {
                        if (asset.get('type') !== assetType) {
                            shouldDisplayTypedInspector = false;
                        }
                    });
                    if (shouldDisplayTypedInspector) {
                        this._typedAssetInspectors[assetType].link(assets);
                        this._typedAssetInspectors[assetType].hidden = false;
                    } else {
                        this._typedAssetInspectors[assetType].hidden = true;
                    }
                }
            });

            // Determine if the Edit/View button should be displayed
            this._btnEditAsset.hidden = assets.length > 1 || !this._editableTypes[assets[0].get('type')];

            // Determine if the Download button should be displayed
            this._btnDownloadAsset.hidden = assets.length > 1 || assets[0].get('type') === 'folder';

            // Determine if Download button should be disabled
            this._btnDownloadAsset.disabled = false;
            if (assets[0].get('type') === 'cubemap') {
                this._updateDownloadButtonOnCubemapChange.bind(this)();
                for (let ind = 0; ind < 6; ind++) {
                    this._assetEvents.push(assets[0].on('data.textures.' + ind + ':set', this._updateDownloadButtonOnCubemapChange.bind(this)));
                }
            }

            // Hide fields based on current asset type
            const hiddenFields = {
                'tags': [
                    'scene',
                    'folder'
                ],
                'source_asset_id': [
                    'scene',
                    'folder'
                ],
                'preload': [
                    'scene',
                    'folder'
                ],
                'bundles': [
                    'bundle',
                    'scene'
                ],
                'assets': [
                    'single'
                ],
                'id': [
                    'multi'
                ],
                'name': [
                    'multi'
                ]
            };
            Object.keys(hiddenFields).forEach(attribute => {
                let hiddenForAnyAsset = false;
                assets.forEach(asset => {
                    if (hiddenFields[attribute].includes(asset.get('type'))) {
                        hiddenForAnyAsset = true;
                    }
                });
                if (
                    hiddenForAnyAsset ||
                    (hiddenFields[attribute].includes('multi') && assets.length > 1) ||
                    (hiddenFields[attribute].includes('single') && assets.length === 1)
                ) {
                    this._attributesInspector.getField(attribute).parent.hidden = true;
                } else {
                    this._attributesInspector.getField(attribute).parent.hidden = false;
                }
            });

            // Set source asset attribute link
            this._assetEvents.push(this._attributesInspector.getField('source_asset_id').on(
                'click',
                this._onClickSourceAsset.bind(this)
            ));
            this._attributesInspector.getField('source_asset_id').class.add('pcui-selectable');
        }

        unlink() {
            super.unlink();

            if (!this._assets) return;

            this._assetEvents.forEach(evt => evt.unbind());
            this._assetEvents.length = 0;

            this._assets = null;

            this._attributesInspector.unlink();

            this._assetTypes.forEach(assetType => {
                const cls = `${assetType[0].toUpperCase()}${assetType.substring(1)}AssetInspector`;
                if (pcui.hasOwnProperty(cls)) {
                    this._typedAssetInspectors[assetType].unlink();
                    this._typedAssetInspectors[assetType].hidden = true;
                }
            });
        }
    }

    return {
        AssetInspector: AssetInspector
    };
})());
