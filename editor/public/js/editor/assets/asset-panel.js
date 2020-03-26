Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'pcui-asset-panel';

    const TYPES = {
        animation: 'Animation',
        audio: 'Audio',
        bundle: 'Asset Bundle',
        binary: 'Binary',
        cubemap: 'Cubemap',
        css: 'Css',
        font: 'Font',
        folderSource: 'Folder',
        json: 'Json',
        html: 'Html',
        material: 'Material',
        model: 'Model',
        sceneSource: 'Model (source)',
        script: 'Script',
        shader: 'Shader',
        sprite: 'Sprite',
        template: 'Template',
        text: 'Text',
        texture: 'Texture',
        textureSource: 'Texture (source)',
        textureatlas: 'Texture Atlas',
        textureatlasSource: 'Texture Atlas (source)'
    };

    class AssetPanel extends pcui.Panel {
        constructor(args) {
            args = Object.assign({
                headerText: 'ASSETS'
            }, args);

            super(args);

            this.class.add(CLASS_ROOT);

            this._detailsView = new pcui.Table({
                columns: [{
                    title: 'Name',
                    sortKey: 'name'
                }, {
                    title: 'Type',
                    sortKey: 'type'
                // }, {
                //     title: 'ID',
                //     sortFn: (a, b) => {
                //         return parseInt(a.get('id'), 10) - parseInt(b.get('id'), 10);
                //     }
                }, {
                    title: 'Size',
                    sortKey: 'file.size'
                }],
                createRowFn: this._createDetailsViewRow.bind(this)
            });
            this.append(this._detailsView);

            this._assetEvents = [];

            if (args.assets) {
                this.assets = args.assets;
            }

            // freeze initial width
            // this.on('parent', parent => {
            //     if (parent && this.width) {
            //         console.log(this.width);
                    // this._detailsView.table.width = this.width;
                // }
            // });
        }

        _createDetailsViewRow(asset) {
            const row = new pcui.TableRow();

            // name
            let cell = new pcui.TableCell({
                flex: true,
                flexDirection: 'row',
                alignItems: 'center'
            });
            row.append(cell);

            // thumb
            const thumb = new pcui.AssetThumbnail({
                assets: this._assets,
                value: asset.get('id'),
                flexShrink: 0
            });
            cell.append(thumb);

            const labelName = new pcui.Label({
                binding: new pcui.BindingObserversToElement(),
                flexShrink: 0
            });
            labelName.link(asset, 'name');
            cell.append(labelName);



            // // id
            // cell = new pcui.TableCell();
            // row.append(cell);

            // const labelId = new pcui.Label({
            //     text: asset.get('id')
            // });
            // cell.append(labelId);

            // type
            cell = new pcui.TableCell();
            row.append(cell);

            let typeKey = asset.get('type');
            if (asset.get('source')) {
                typeKey += 'Source';
            }

            let type = TYPES[typeKey];
            if (!type) {
                type = asset.get('type')[0].toUpperCase() + asset.get('type').substring(1);
            }

            const labelType = new pcui.Label({
                text: type
            });
            cell.append(labelType);

            // size
            cell = new pcui.TableCell();
            row.append(cell);

            const labelSize = new pcui.Label({
                binding: new pcui.BindingObserversToElement({
                    customUpdate: (element, observers, paths) => {
                        if (!observers[0].has(paths[0])) {
                            element.value = '';
                        } else {
                            element.value = bytesToHuman(observers[0].get(paths[0]));
                        }
                    }
                })
            });
            labelSize.link(asset, 'file.size');
            cell.append(labelSize);

            return row;
        }

        _onAssetAdd(asset) {
            this._detailsView.link(this._assets.array());
        }

        _onAssetRemove(asset) {
            this._detailsView.link(this._assets.array());
        }

        destroy() {
            if (this._destroyed) return;

            this._assetEvents.forEach(e => e.unbind());
            this._assetEvents.length = 0;

            super.destroy();
        }

        get assets() {
            return this._assets;
        }

        set assets(value) {
            this._assetEvents.forEach(e => e.unbind());
            this._assetEvents.length = 0;

            this._detailsView.unlink();

            this._assets = value;
            if (!this._assets) return;

            this._detailsView.link(this._assets.array());

            this._assetEvents.push(this._assets.on('add', this._onAssetAdd.bind(this)));
            this._assetEvents.push(this._assets.on('remove', this._onAssetRemove.bind(this)));
        }

    }

    return {
        AssetPanel: AssetPanel
    };
})());
