Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'scene-asset-inspector';
    const CLASS_ASSET = CLASS_ROOT + '-asset';

    const ATTRIBUTES = [{
        label: 'Animation',
        alias: 'animation',
        type: 'container',
        args: {
                flex: true,
                flexDirection: 'row',
                flexWrap: 'wrap'
            }
        },
    {
        label: 'Textures',
        alias: 'textures',
        type: 'container',
        args: {
            flex: true,
            flexDirection: 'row',
            flexWrap: 'wrap'
        }
    },
    {
        label: 'Materials',
        alias: 'materials',
        type: 'container',
        args: {
            flex: true,
            flexDirection: 'row',
            flexWrap: 'wrap'
        }
    }, {
        label: 'Scene',
        alias: 'scene',
        type: 'container',
        args: {
            flex: true,
            flexDirection: 'row',
            flexWrap: 'wrap'
        }
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

            this.buildDom(DOM(args));

            this._contentAttributes.getField('textures').parent.labelAlignTop = true;
            this._contentAttributes.getField('materials').parent.labelAlignTop = true;
            this._contentAttributes.getField('animation').parent.labelAlignTop = true;
            this._contentAttributes.getField('scene').parent.labelAlignTop = true;
        }

        _getContainer(name) {
            return this._contentAttributes.getField(name).parent.field;
        }

        _createSmallLabel(text) {
            const label = new pcui.Label({
                text: text
            });
            label.style.marginTop = '0';
            label.style.marginBottom = '0';
            label.style.fontSize = '11px';
            return label;
        }

        _animationCheck(available) {
            this._getContainer('animation').clear();
            this._getContainer('animation').append(this._createSmallLabel(available ? 'yes' : 'no'));
        }

        _addTextures(textures) {
            if (textures && textures.length > 0) {
                textures.forEach(texture => {
                    const textureLabel = new pcui.Label({ text: texture.name, class: CLASS_ASSET });
                    this._getContainer('textures').append(textureLabel);
                });
            } else {
                this._getContainer('textures').append(this._createSmallLabel('no'));
            }
        }

        _removeTextures() {
            this._getContainer('textures').clear();
        }

        _addMaterials(materials) {
            if (materials && materials.length > 0) {
                materials.forEach(material => {
                    const materialLabel = new pcui.Label({ text: material.name, class: CLASS_ASSET });
                    this._getContainer('materials').append(materialLabel);
                });
            } else {
                this._getContainer('materials').append(this._createSmallLabel('no'));
            }
        }

        _removeMaterials() {
            this._getContainer('materials').clear();
        }

        _addScene(scene) {
            if (scene) {
                this._getContainer('scene').append(this._createSmallLabel('yes'));
            } else {
                this._getContainer('scene').append(this._createSmallLabel('no'));
            }
        }

        _removeScene() {
            this._getContainer('scene').clear();
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
            this._addScene(assets[0].get('meta.scene'));
            this._assetEvents.push(assets[0].on('meta.scene:set', () => {
                this._removeScene();
                this._addScene(assets[0].get('meta.scene'));
            }));
        }

        unlink() {
            this._contentAttributes.unlink();
            this._relatedAssetsInspector.unlink();
            this._assetEvents.forEach(evt => evt.unbind());
            this._assetEvents = [];
            this._removeTextures();
            this._removeMaterials();
            this._removeScene();
        }
    }

    return {
        SceneSourceAssetInspector: SceneSourceAssetInspector
    };
})());
