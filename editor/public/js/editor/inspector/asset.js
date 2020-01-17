Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'asset-inspector';
    const CLASS_DOWNLOAD_ASSET = CLASS_ROOT + '-download-asset';

    const ATTRIBUTES = [
        {
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
            path: 'source',
            type: 'label',
            args: {
                formatTextMap: {
                    'true': 'yes',
                    'false': 'no'
                }
            }
        }, {
            label: 'Type',
            path: 'type',
            type: 'label',
            args: {
                formatTextMap: {
                    'scene': 'Source scene'
                }
            }
        }, {
            label: 'Preload',
            path: 'preload',
            type: 'boolean'
        }, {
            label: 'Size',
            path: 'file.size',
            type: 'label',
            args: {
                formatText: bytesToHuman
            }
        }, {
            label: 'Source',
            path: 'source_asset_id',
            type: 'label',
            args: {
                formatText: (source_asset_id) => {
                    var name = '';
                    var assets = editor.call('assets:raw').data;
                    assets.forEach(asset => {
                        if (asset._data.id == source_asset_id) {
                            name = asset._data.name;
                        }
                    })
                    return name;
                }
            }
        }
    ];

    ATTRIBUTES.forEach(attr => {
        const parts = attr.path.split('.');
        attr.reference = `entity:${parts[parts.length - 1]}`;
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
                attributes: ATTRIBUTES,
                // templateOverridesSidebar: this._templateOverridesSidebar
            });
            this.append(this._attributesInspector);

            // add component button
            this._btnDownloadAsset = new pcui.Button({
                text: 'Download',
                icon: 'E228',
                flexGrow: 1,
                class: CLASS_DOWNLOAD_ASSET
            });
            this._btnDownloadAsset.hidden = !editor.call('permissions:read');
            var evtBtnDownloadPermissions = editor.on('permissions:set:' + config.self.id, function() {
                this._btnDownloadAsset.hidden = ! editor.call('permissions:read');
            });                
            this._btnDownloadAsset.once('destroy', function() {
                evtBtnDownloadPermissions.unbind();
            });
            this.append(this._btnDownloadAsset);

            this._btnDownloadAsset.on('click', this._onClickDownloadAsset.bind(this));

            // add typed asset inspectors
            this._typedAssetInspectors = {};
            //#TODO get actual list of asset types
            // const assetTypes = editor.call(':list');
            this._assetTypes = ['animation'];
            this._assetTypes.forEach(assetType => {

                // check if class exists
                const cls = `Asset${assetType[0].toUpperCase()}${assetType.substring(1)}Inspector`;
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
        }

        _onClickDownloadAsset(evt) {
            var legacyScripts = editor.call('settings:project').get('useLegacyScripts');
            if (this._assets[0].get('type') !== 'folder' && ! (legacyScripts && this._assets[0].get('type') === 'script') && this._assets[0].get('type') !== 'sprite') {
                // download
                if (this._btnDownloadAsset.prevent)
                    return;

                if (this._assets[0].get('source') || this._assets[0].get('type') === 'texture' || this._assets[0].get('type') === 'audio') {
                    window.open(this._assets[0].get('file.url'));
                } else {
                    window.open('/api/assets/' + this._assets[0].get('id') + '/download?branchId=' + config.self.branch.id);
                }
            }
        }

        link(assets) {
            this.unlink();

            if (!assets || !assets.length) return;

            this._assets = assets;

            this._attributesInspector.link(assets);

            this._assetTypes.forEach(assetType => {
                if (assetType == assets[0]._data.type) {
                    this._typedAssetInspectors[assetType].link(assets);
                    this._typedAssetInspectors[assetType].hidden = false;
                }
            });
        }

        unlink() {
            super.unlink();

            if (!this._assets) return;

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
