Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'scene-asset-inspector';
    const CLASS_ASSET = CLASS_ROOT + '-asset';
    const CLASS_NO_ASSET = CLASS_ROOT + '-no-asset';
    const CLASS_ASSET_CONTAINER = CLASS_ROOT + '-asset-container';

    const ATTRIBUTES = [{
        label: 'Animation',
        alias: 'animation',
        type: 'label'
    },
    {
        label: 'Textures',
        alias: 'textures',
        type: 'label'
    },
    {
        label: 'Materials',
        alias: 'materials',
        type: 'label'
    }];

    const DOM = args => [
        {
            root: {
                contentPanel: new pcui.Panel({ headerText: 'CONTENTS' })
            },
            children: [
                {
                    contentAttributes: new pcui.AttributesInspector({
                        assets: args.assets,
                        history: args.history,
                        attributes: ATTRIBUTES
                    })
                }
            ]
        },
        {
            relatedAssetsInspector: new pcui.RelatedAssetsInspector({
                assets: args.assets
            })
        }
    ];

    class SceneSourceAssetInspector extends pcui.Container {
        constructor(args) {
            args = Object.assign({}, args);

            super(args);
            this._assetEvents = [];
            this._textures = [];
            this._materials = [];

            this.buildDom(DOM(args));

            this._contentAttributes.getField('textures').parent.class.add(CLASS_ASSET_CONTAINER);
            this._contentAttributes.getField('textures').class.add(CLASS_NO_ASSET);
            this._contentAttributes.getField('materials').parent.class.add(CLASS_ASSET_CONTAINER);
            this._contentAttributes.getField('materials').class.add(CLASS_NO_ASSET);
        }


        _animationCheck(available) {
            this._contentAttributes.getField('animation').value = available ? 'yes' : 'no';
        }

        _addTextures(textures) {
            if (textures && textures.length > 0) {
                textures.forEach(texture => {
                    const textureLabel = new pcui.Label({ text: texture.name, class: CLASS_ASSET });
                    this._contentAttributes.getField('textures').parent.append(textureLabel);
                    this._textures.push(textureLabel);
                    this._contentAttributes.getField('textures').hidden = true;
                });
            } else {
                this._contentAttributes.getField('textures').value = 'no';
                this._contentAttributes.getField('textures').hidden = false;
            }
        }

        _removeTextures() {
            this._textures.forEach(texture => {
                this._contentAttributes.getField('textures').parent.remove(texture);
            });
        }

        _addMaterials(materials) {
            if (materials && materials.length > 0) {
                materials.forEach(material => {
                    const materialLabel = new pcui.Label({ text: material.name, class: CLASS_ASSET });
                    this._contentAttributes.getField('materials').parent.append(materialLabel);
                    this._materials.push(materialLabel);
                    this._contentAttributes.getField('materials').hidden = true;
                });
            } else {
                this._contentAttributes.getField('materials').value = 'no';
                this._contentAttributes.getField('materials').hidden = false;
            }
        }

        _removeMaterials() {
            this._materials.forEach(material => {
                this._contentAttributes.getField('materials').parent.remove(material);
            });
        }

        link(assets) {
            this.unlink();
            this._contentAttributes.link(assets);
            this._relatedAssetsInspector.link(assets);
            this._animationCheck(assets[0].get('meta.animation.available'));
            this._assetEvents.push(assets[0].on('meta.animation.available:set', this._animationCheck.bind(this)));
            this._addTextures(assets[0].get('meta.textures'));
            this._assetEvents.push(assets[0].on('meta.textures:set', () => {
                this._removeTextures();
                this.addTextures(assets[0].get('meta.textures'));
            }));
            this._assetEvents.push(assets[0].on('meta.textures:unset', () => {
                this._removeTextures();
                this._addTextures(assets[0].get('meta.textures'));
            }));
            this._addMaterials(assets[0].get('meta.materials'));
            this._assetEvents.push(assets[0].on('meta.materials:set', () => {
                this._removeMaterials();
                this._addMaterials(assets[0].get('meta.materials'));
            }));
            this._assetEvents.push(assets[0].on('meta.materials:unset', () => {
                this._removeMaterials();
                this._addMaterials(assets[0].get('meta.materials'));
            }));
        }

        unlink() {
            this._contentAttributes.unlink();
            this._relatedAssetsInspector.unlink();
            this._assetEvents.forEach(evt => evt.unbind());
            this._assetEvents = [];
            this._removeTextures();
            this._removeMaterials();
        }
    }

    return {
        SceneSourceAssetInspector: SceneSourceAssetInspector
    };
})());
