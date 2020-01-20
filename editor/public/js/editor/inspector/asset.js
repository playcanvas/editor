Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'asset-inspector';
    const CLASS_DOWNLOAD_ASSET = CLASS_ROOT + '-download-asset';

    const ATTRIBUTES = [{
        label: 'ID',
        path: 'id',
        type: 'label'
    }, {
        label: 'Name',
        path: 'name',
        type: 'string'
    }, {
        label: 'Tags',
        path: 'tags',
        type: 'tags',
        args: {
            type: 'string',
            placeholder: 'Add Tags'
        }
    }, {
        label: 'Runtime',
        alias: 'source',
        type: 'boolean',
        args: {
            renderChanges: false,
            readOnly: true
        }
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

            this._attributesInspector = new pcui.AttributesInspector({
                history: args.history,
                attributes: ATTRIBUTES
            });
            this.append(this._attributesInspector);

            // add component button
            this._btnDownloadAsset = new pcui.Button({
                text: 'DOWNLOAD',
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
            this.append(this._btnDownloadAsset);

            this._btnDownloadAsset.on('click', this._onClickDownloadAsset.bind(this));

            // add typed asset inspectors
            this._typedAssetInspectors = {};
            // #TODO get actual list of asset types
            // const assetTypes = editor.call(':list');
            this._assetTypes = ['animation'];
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

        _updateFileSize(assets) {
            if (!this._assets) return;

            this._attributesInspector.getField('size').values = this._assets.map(asset => {
                return asset.has('file.size') ? bytesToHuman(asset.get('file.size')) : bytesToHuman(0);
            });
        }

        link(assets) {
            this.unlink();

            if (!assets || !assets.length) return;

            this._assets = assets;

            this._attributesInspector.link(assets);

            this._attributesInspector.getField('source').values = assets.map(asset => !asset.get('source'));
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
                if (!sourceAssetId) return null;

                const sourceAsset = this._assetsList.get(sourceAssetId);
                return sourceAsset ? sourceAsset.get('name') : sourceAssetId;
            });

            this._assetTypes.forEach(assetType => {
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
            });
        }

        unlink() {
            super.unlink();

            if (!this._assets) return;

            this._assetEvents.forEach(evt => evt.unbind());
            this._assetEvents.length = 0;

            this._assets = null;

            this._attributesInspector.unlink();

            this._assetTypes.forEach(assetType => {
                this._typedAssetInspectors[assetType].unlink();
                this._typedAssetInspectors[assetType].hidden = true;
            });
        }
    }

    return {
        AssetInspector: AssetInspector
    };
})());
