Object.assign(pcui, (function () {
    'use strict';

    const PRESETS = {
        '0,1,0,1': 'Top Left Anchor',
        '0,1,0,1/0,1': 'Top Left Anchor & Pivot',
        '0.5,1,0.5,1': 'Top Anchor',
        '0.5,1,0.5,1/0.5,1': 'Top Anchor & Pivot',
        '1,1,1,1': 'Top Right Anchor',
        '1,1,1,1/1,1': 'Top Right Anchor & Pivot',
        '0,0.5,0,0.5': 'Left Anchor',
        '0,0.5,0,0.5/0,0.5': 'Left Anchor & Pivot',
        '0.5,0.5,0.5,0.5': 'Center Anchor',
        '0.5,0.5,0.5,0.5/0.5,0.5': 'Center Anchor & Pivot',
        '1,0.5,1,0.5': 'Right Anchor',
        '1,0.5,1,0.5/1,0.5': 'Right Anchor & Pivot',
        '0,0,0,0': 'Bottom Left Anchor',
        '0,0,0,0/0,0': 'Bottom Left Anchor & Pivot',
        '0.5,0,0.5,0': 'Bottom Anchor',
        '0.5,0,0.5,0/0.5,0': 'Bottom Anchor & Pivot',
        '1,0,1,0': 'Bottom Right Anchor',
        '1,0,1,0/1,0': 'Bottom Right Anchor & Pivot',
        'custom': 'Custom'
    };

    const ATTRIBUTES = [{
        label: 'Type',
        path: 'components.element.type',
        type: 'select',
        args: {
            type: 'string',
            options: [{
                v: 'text', t: 'Text'
            }, {
                v: 'image', t: 'Image'
            }, {
                v: 'group', t: 'Group'
            }]
        }
    }, {
        label: 'Preset',
        type: 'select',
        alias: 'components.element.preset',
        args: {
            type: 'string',
            options: Object.keys(PRESETS).map(key => {
                return { v: key, t: PRESETS[key] };
            })
        }
    }, {
        label: 'Anchor',
        path: 'components.element.anchor',
        type: 'vec4',
        args: {
            precision: 2,
            step: 0.1,
            min: 0,
            max: 1,
            placeholder: ['←', '↓', '→', '↑']
        }
    }, {
        label: 'Pivot',
        path: 'components.element.pivot',
        type: 'vec2',
        args: {
            precision: 2,
            step: 0.1,
            min: 0,
            max: 1,
            placeholder: ['↔', '↕']
        }
    }, {
        label: 'Auto Width',
        path: 'components.element.autoWidth',
        type: 'boolean'
    }, {
        label: 'Auto Fit Width',
        path: 'components.element.autoFitWidth',
        type: 'boolean'
    }, {
        label: 'Width',
        path: 'components.element.width',
        type: 'number',
        args: {
            precision: 2,
            step: 1
        }
    }, {
        label: 'Auto Height',
        path: 'components.element.autoHeight',
        type: 'boolean'
    }, {
        label: 'Auto Fit Height',
        path: 'components.element.autoFitHeight',
        type: 'boolean'
    }, {
        label: 'Height',
        path: 'components.element.height',
        type: 'number',
        args: {
            precision: 2,
            step: 1
        }
    }, {
        label: 'Margin',
        path: 'components.element.margin',
        type: 'vec4',
        args: {
            placeholder: ['←', '↓', '→', '↑'],
            precision: 2,
            step: 1
        }
    }, {
        label: 'Alignment',
        path: 'components.element.alignment',
        type: 'vec2',
        args: {
            precision: 2,
            step: 0.1,
            min: 0,
            max: 1,
            placeholder: ['↔', '↕']
        }
    }, {
        label: 'Font',
        path: 'components.element.fontAsset',
        type: 'asset',
        args: {
            assetType: 'font'
        }
    }, {
        label: 'Localized',
        type: 'boolean',
        alias: 'components.element.localized'
    }, {
        label: 'Text',
        path: 'components.element.text',
        type: 'text'
    }, {
        label: 'Key',
        path: 'components.element.key',
        type: 'text'
    }, {
        label: 'Enable Markup',
        path: 'components.element.enableMarkup',
        type: 'boolean'
    }, {
        label: 'Font Size',
        path: 'components.element.fontSize',
        type: 'number'
    }, {
        label: 'Min Font Size',
        path: 'components.element.minFontSize',
        type: 'number',
        args: {
            min: 0
        }
    }, {
        label: 'Max Font Size',
        path: 'components.element.maxFontSize',
        type: 'number',
        args: {
            min: 0
        }
    }, {
        label: 'Line Height',
        path: 'components.element.lineHeight',
        type: 'number'
    }, {
        label: 'Wrap Lines',
        path: 'components.element.wrapLines',
        type: 'boolean'
    }, {
        label: 'Max Lines',
        path: 'components.element.maxLines',
        type: 'number',
        args: {
            min: 1,
            allowNull: true
        }
    }, {
        label: 'Spacing',
        path: 'components.element.spacing',
        type: 'number'
    }, {
        label: 'Color',
        path: 'components.element.color',
        type: 'rgb'
    }, {
        label: 'Opacity',
        path: 'components.element.opacity',
        type: 'slider',
        args: {
            min: 0,
            max: 1,
            precision: 3,
            step: 0.01
        }
    }, {
        label: 'Outline Color',
        path: 'components.element.outlineColor',
        type: 'rgba'
    }, {
        label: 'Outline Thickness',
        path: 'components.element.outlineThickness',
        type: 'slider',
        args: {
            precision: 2,
            step: 0.1,
            min: 0,
            max: 1
        }
    }, {
        label: 'Shadow Color',
        path: 'components.element.shadowColor',
        type: 'rgba'
    }, {
        label: 'Shadow Offset',
        path: 'components.element.shadowOffset',
        type: 'vec2',
        args: {
            precision: 2,
            step: 0.1,
            min: -1,
            max: 1,
            placeholder: ['↔', '↕']
        }
    }, {
        label: 'Rect',
        path: 'components.element.rect',
        type: 'vec4',
        args: {
            placeholder: ['U', 'V', 'W', 'H']
        }
    }, {
        label: 'Mask',
        path: 'components.element.mask',
        type: 'boolean'
    }, {
        label: 'Texture',
        path: 'components.element.textureAsset',
        type: 'asset',
        args: {
            assetType: 'texture'
        }
    }, {
        label: 'Sprite',
        path: 'components.element.spriteAsset',
        type: 'asset',
        args: {
            assetType: 'sprite'
        }
    }, {
        label: 'Frame',
        path: 'components.element.spriteFrame',
        type: 'number',
        args: {
            min: 0,
            precision: 0,
            step: 1
        }
    }, {
        label: 'Pixels Per Unit',
        path: 'components.element.pixelsPerUnit',
        type: 'number',
        args: {
            min: 0,
            allowNull: true
        }
    }, {
        label: 'Material',
        path: 'components.element.materialAsset',
        type: 'asset',
        args: {
            assetType: 'material'
        }
    }, {
        label: 'Use Input',
        path: 'components.element.useInput',
        type: 'boolean'
    }, {
        type: 'divider'
    }, {
        label: 'Batch Group',
        path: 'components.element.batchGroupId',
        type: 'batchgroup'
    }, {
        label: 'Layers',
        path: 'components.element.layers',
        type: 'layers',
        args: {
            excludeLayers: [
                LAYERID_DEPTH,
                LAYERID_SKYBOX,
                LAYERID_IMMEDIATE
            ]
        }
    }];

    ATTRIBUTES.forEach(attr => {
        const field = attr.path || attr.alias;
        if (!field) return;
        const parts = field.split('.');
        attr.reference = `element:${parts[parts.length - 1]}`;
    });

    // Custom binding from element -> observers for texture and sprite assets which
    // resizes an Image Element when the asset is first assigned
    class ImageAssetElementToObserversBinding extends pcui.BindingElementToObservers {
        constructor(assets, args) {
            super(args);
            this._assets = assets;
        }

        clone() {
            return new ImageAssetElementToObserversBinding(this._assets, {
                history: this._history,
                historyPrefix: this._historyPrefix,
                historyPostfix: this._historyPostfix,
                historyName: this._historyName,
                historyCombine: this._historyCombine
            });
        }

        _getSpriteDimensions(value, entity) {
            const spriteAsset = this._assets.get(value);
            // renderMode has three states: 0 = Simple, 1 = Slices, 2 = Tiled. Only Simple should set the element width / height.
            if (!spriteAsset || spriteAsset.get('data.renderMode') !== 0) return null;
            const spriteFrame = entity.get('components.element.spriteFrame');
            let frameKey = spriteAsset.get(`data.frameKeys.${spriteFrame}`);
            if (!frameKey) {
                const frameKeys = spriteAsset.get('data.frameKeys');
                frameKey = frameKeys[frameKeys.length - 1];
            }

            const textureAtlasAsset = this._assets.get(spriteAsset.get('data.textureAtlasAsset'));
            if (!textureAtlasAsset) return null;
            const spriteRect = textureAtlasAsset.get(`data.frames.${frameKey}.rect`);
            const width = spriteRect[2];
            const height = spriteRect[3];
            return {
                width,
                height
            };
        }

        _getTextureDimensions(value) {
            const asset = this._assets.get(value);
            const width = asset && asset.get('meta.width') || 0;
            const height = asset && asset.get('meta.height') || 0;
            return {
                width,
                height
            };
        }

        _hasSplitAnchor(entity) {
            const anchor = entity.get('components.element.anchor');
            return !anchor ||
                   Math.abs(anchor[0] - anchor[2]) > 0.01 ||
                   Math.abs(anchor[1] - anchor[3]) > 0.01;
        }

        // Override setValue to set additional fields
        setValue(value) {
            if (this.applyingChange) return;
            if (!this._observers) return;

            this.applyingChange = true;

            // make copy of observers if we are using history
            // so that we can undo on the same observers in the future
            const observers = this._observers.slice();
            const paths = this._paths.slice();

            let previous = {};

            const undo = () => {
                for (let i = 0; i < observers.length; i++) {
                    const latest = observers[i].latest();
                    if (!latest || !latest.has('components.element')) continue;

                    let history = false;
                    if (latest.history) {
                        history = latest.history.enabled;
                        latest.history.enabled = false;
                    }

                    const path = this._pathAt(paths, i);

                    const prevEntry = previous[latest.get('resource_id')];

                    latest.set(path, prevEntry.value);

                    if (prevEntry.hasOwnProperty('width')) {
                        latest.set('components.element.width', prevEntry.width);
                        latest.set('components.element.height', prevEntry.height);
                        latest.set('components.element.margin', prevEntry.margin);
                    }

                    if (history) {
                        latest.history.enabled = true;
                    }
                }
            };

            const redo = () => {
                previous = {};

                const asset = this._assets.get(value);

                for (let i = 0; i < observers.length; i++) {
                    const latest = observers[i].latest();
                    if (!latest || !latest.has('components.element')) continue;

                    let width = 0;
                    let height = 0;
                    if (asset && asset.get('type') === 'sprite') {
                        const dimensions = this._getSpriteDimensions(value, latest);
                        if (dimensions) {
                            width = dimensions.width;
                            height = dimensions.height;
                        }
                    } else if (asset && asset.get('type') === 'texture') {
                        const dimensions = this._getTextureDimensions(value);
                        width = dimensions.width;
                        height = dimensions.height;
                    }

                    let history = false;
                    if (latest.history) {
                        history = latest.history.enabled;
                        latest.history.enabled = false;
                    }

                    const path = this._pathAt(paths, i);

                    const prevEntry = {
                        value: latest.get(path)
                    };

                    latest.set(path, value);

                    if (width && height && !this._hasSplitAnchor(latest)) {
                        prevEntry.width = latest.get('components.element.width');
                        prevEntry.height = latest.get('components.element.height');
                        prevEntry.margin = latest.get('components.element.margin');

                        latest.set('components.element.width', width);
                        latest.set('components.element.height', height);

                        if (latest.entity) {
                            const margin = latest.entity.element.margin;
                            latest.set('components.element.margin', [margin.x, margin.y, margin.z, margin.w]);
                        }
                    }

                    previous[latest.get('resource_id')] = prevEntry;

                    if (history) {
                        latest.history.enabled = true;
                    }
                }
            };

            if (this._history) {
                this._history.add({
                    name: this._getHistoryActionName(paths),
                    redo: redo,
                    undo: undo
                });

            }

            redo();

            this.applyingChange = false;
        }
    }
    class SpriteFrameElementToObserversBinding extends ImageAssetElementToObserversBinding {

        // Override setValue to set additional fields
        setValue(value) {
            if (this.applyingChange) return;
            if (!this._observers) return;

            this.applyingChange = true;

            // make copy of observers if we are using history
            // so that we can undo on the same observers in the future
            const observers = this._observers.slice();
            const paths = this._paths.slice();

            let previous = {};

            const undo = () => {
                for (let i = 0; i < observers.length; i++) {
                    const latest = observers[i].latest();
                    if (!latest || !latest.has('components.element')) continue;

                    let history = false;
                    if (latest.history) {
                        history = latest.history.enabled;
                        latest.history.enabled = false;
                    }

                    const path = this._pathAt(paths, i);

                    const prevEntry = previous[latest.get('resource_id')];

                    latest.set(path, prevEntry.value);

                    if (prevEntry.hasOwnProperty('width')) {
                        latest.set('components.element.width', prevEntry.width);
                        latest.set('components.element.height', prevEntry.height);
                    }

                    if (history) {
                        latest.history.enabled = true;
                    }
                }
            };

            const redo = () => {
                previous = {};

                for (let i = 0; i < observers.length; i++) {
                    const latest = observers[i].latest();
                    if (!latest || !latest.has('components.element')) continue;

                    let history = false;
                    if (latest.history) {
                        history = latest.history.enabled;
                        latest.history.enabled = false;
                    }

                    const path = this._pathAt(paths, i);

                    const prevEntry = {
                        value: latest.get(path)
                    };

                    latest.set('components.element.spriteFrame', value);

                    const dimensions = this._getSpriteDimensions(latest.get('components.element.spriteAsset'), latest);
                    if (dimensions) {
                        const width = dimensions.width;
                        const height = dimensions.height;
                        prevEntry.width = latest.get('components.element.width');
                        prevEntry.height = latest.get('components.element.height');
                        latest.set('components.element.width', width);
                        latest.set('components.element.height', height);
                    }

                    previous[latest.get('resource_id')] = prevEntry;

                    if (history) {
                        latest.history.enabled = true;
                    }
                }
            };

            if (this._history) {
                this._history.add({
                    name: this._getHistoryActionName(paths),
                    redo: redo,
                    undo: undo
                });

            }

            redo();

            this.applyingChange = false;
        }
    }

    class ElementComponentInspector extends pcui.ComponentInspector {
        constructor(args) {
            args = Object.assign({}, args);
            args.component = 'element';

            super(args);

            this._attributesInspector = new pcui.AttributesInspector({
                assets: args.assets,
                projectSettings: args.projectSettings,
                history: args.history,
                attributes: ATTRIBUTES,
                templateOverridesInspector: this._templateOverridesInspector
            });
            this.append(this._attributesInspector);

            // in order to display RTL text correctly in the editor
            // see https://www.w3.org/International/articles/inline-bidi-markup/
            this._field('text').input.setAttribute('dir', 'auto');

            [
                'type',
                'localized',
                'key',
                'autoWidth',
                'autoHeight',
                'autoFitWidth',
                'autoFitHeight',
                'wrapLines',
                'materialAsset',
                'spriteAsset',
                'textureAsset',
                'fontAsset'
            ].forEach(name => {
                this._field(name).on('change', this._toggleFields.bind(this));
            });

            this._field('key').on('change', this._onFieldKeyChange.bind(this));
            this._field('localized').on('change', this._onFieldLocalizedChange.bind(this));
            this._field('anchor').on('change', this._onFieldAnchorChange.bind(this));
            this._field('pivot').on('change', this._onFieldPivotChange.bind(this));
            this._field('preset').on('change', this._onFieldPresetChange.bind(this));
            this._field('fontAsset').on('change', this._onFieldFontAssetChange.bind(this));

            // update binding of textureAsset field
            this._field('textureAsset').binding = new pcui.BindingTwoWay({
                history: args.history,
                bindingElementToObservers: new ImageAssetElementToObserversBinding(args.assets, {
                    history: args.history
                })
            });
            // update binding of spriteAsset field
            this._field('spriteAsset').binding = new pcui.BindingTwoWay({
                history: args.history,
                bindingElementToObservers: new ImageAssetElementToObserversBinding(args.assets, {
                    history: args.history
                },
                this.entities
                ),
            });
            // update binding of spriteFrame field
            this._field('spriteFrame').binding = new pcui.BindingTwoWay({
                history: args.history,
                bindingElementToObservers: new SpriteFrameElementToObserversBinding(args.assets, {
                    history: args.history
                },
                this.entities
                ),
            });

            this._suppressLocalizedEvents = false;
            this._suppressPresetEvents = false;
            this._suppressToggleFields = false;
        }

        _field(name) {
            return this._attributesInspector.getField(`components.element.${name}`);
        }

        _toggleFields() {
            if (this._suppressToggleFields) return;

            const type = this._field('type').value;
            const isText = type === 'text';
            const isImage = type === 'image';

            const texture = this._field('textureAsset').value;
            const sprite = this._field('spriteAsset').value;
            const material = this._field('materialAsset').value;

            const anchor = this._field('anchor').value;
            const horizontalSplit = Math.abs(anchor[0] - anchor[2]) > 0.001;
            const verticalSplit = Math.abs(anchor[1] - anchor[3]) > 0.001;

            [
                'autoWidth',
                'autoHeight',
                'alignment',
                'enableMarkup',
                'autoFitWidth',
                'autoFitHeight',
                'lineHeight',
                'wrapLines',
                'spacing',
                'outlineColor',
                'outlineThickness',
                'shadowColor',
                'shadowOffset'
            ].forEach(field => {
                this._field(field).parent.hidden = !isText;
            });

            this._field('fontAsset').hidden = !isText;
            this._field('maxLines').parent.hidden = !isText || !this._field('wrapLines').value;
            this._field('localized').parent.hidden = !isText;
            this._field('text').parent.hidden = !isText || this._field('localized').value || this._field('localized').class.contains(pcui.CLASS_MULTIPLE_VALUES);
            this._field('key').parent.hidden = !isText || !this._field('localized').value || this._field('localized').class.contains(pcui.CLASS_MULTIPLE_VALUES);
            this._field('spriteAsset').hidden = !isImage || texture || material;
            this._field('spriteFrame').parent.hidden = this._field('spriteAsset').hidden || !sprite;
            this._field('pixelsPerUnit').parent.hidden = this._field('spriteFrame').parent.hidden;
            this._field('textureAsset').hidden = !isImage || sprite || material;
            this._field('materialAsset').hidden = !isImage || texture || sprite;
            this._field('color').parent.hidden = !isImage && !isText || material;
            this._field('opacity').parent.hidden = this._field('color').parent.hidden;
            this._field('rect').parent.hidden = !isImage || sprite;
            this._field('mask').parent.hidden = !isImage;

            this._field('width').disabled = horizontalSplit || (this._field('autoWidth').value && isText);
            this._field('height').disabled = verticalSplit || (this._field('autoHeight').value && isText);
            this._field('autoWidth').disabled = horizontalSplit;
            this._field('autoHeight').disabled = verticalSplit;
            this._field('autoFitWidth').disabled = this._field('autoWidth').value;
            this._field('autoFitHeight').disabled = this._field('autoHeight').value;
            this._field('maxFontSize').parent.hidden = !isText || ((this._field('autoFitWidth').disabled || !this._field('autoFitWidth').value) && (this._field('autoFitHeight').disabled || !this._field('autoFitHeight').value));
            this._field('minFontSize').parent.hidden = this._field('maxFontSize').parent.hidden;
            this._field('fontSize').parent.hidden = !isText || !this._field('maxFontSize').parent.hidden;

            const margins = this._field('margin').inputs;
            margins[0].disabled = !horizontalSplit;
            margins[2].disabled = margins[0].disabled;

            margins[1].disabled = !verticalSplit;
            margins[3].disabled = margins[1].disabled;
        }

        _onFieldPresetChange(value) {
            if (!value || value === 'custom' || this._suppressPresetEvents) return;

            if (!this._entities) return;

            // copy current entities for undo / redo
            const entities = this._entities.slice();

            this._suppressPresetEvents = true;

            const fields = value.split('/');
            const anchor = fields[0].split(',').map(v => parseFloat(v));
            const pivot = fields.length === 2 ? fields[1].split(',').map(v => parseFloat(v)) : null;

            const prev = {};

            for (let i = 0; i < entities.length; i++) {
                prev[entities[i].get('resource_id')] = {
                    anchor: entities[i].get('components.element.anchor'),
                    pivot: entities[i].get('components.element.pivot'),
                    width: entities[i].get('components.element.width'),
                    height: entities[i].get('components.element.height')
                };
            }

            function undo() {
                for (let i = 0; i < entities.length; i++) {
                    const entity = entities[i].latest();
                    if (!entity || !entity.has('components.element')) continue;

                    const history = entity.history.enabled;
                    entity.history.enabled = false;
                    const prevRecord = prev[entity.get('resource_id')];
                    entity.set('components.element.anchor', prevRecord.anchor);
                    if (pivot) {
                        entity.set('components.element.pivot', prevRecord.pivot);
                    }
                    if (entity.entity && entity.entity.element) {
                        entity.entity.element.width = prevRecord.width;
                        entity.entity.element.height = prevRecord.height;
                    }
                    entity.history.enabled = history;
                }
            }

            function redo() {
                for (var i = 0; i < entities.length; i++) {
                    const entity = entities[i].latest();
                    if (!entity || !entity.has('components.element')) continue;

                    const history = entity.history.enabled;
                    entity.history.enabled = false;
                    entity.set('components.element.anchor', anchor);
                    if (pivot) {
                        entity.set('components.element.pivot', pivot);
                    }

                    const prevRecord = prev[entity.get('resource_id')];

                    if (entity.entity && entity.entity.element) {
                        entity.entity.element.width = prevRecord.width;
                        entity.entity.element.height = prevRecord.height;
                    }

                    entity.history.enabled = history;
                }
            }

            redo();

            if (this._history) {
                this._history.add({
                    name: 'entities.components.element.preset',
                    undo: undo,
                    redo: redo
                });
            }

            this._suppressPresetEvents = false;
        }

        _onFieldKeyChange(value) {
            this._suppressLocalizedEvents = true;
            if (this._field('key').class.contains(pcui.CLASS_MULTIPLE_VALUES)) {
                // set multiple values state
                this._field('localized').values = [true, false];
            } else if (value) {
                this._field('localized').value = true;
            } else {
                this._field('localized').value = false;
            }

            this._suppressLocalizedEvents = false;
        }

        _onFieldLocalizedChange(value) {
            if (this._suppressLocalizedEvents) return;

            // if value is not boolean then ignore as it might mean
            // it's just showing multiple different values
            if (value !== true && value !== false) return;

            if (!this._entities) return;

            // copy current entities for undo / redo functions
            const entities = this._entities.slice();

            let prev;
            const path = value ? 'components.element.key' : 'components.element.text';
            const otherPath = value ? 'components.element.text' : 'components.element.key';

            function undo() {
                for (let i = 0; i < prev.length; i += 2) {
                    const e = prev[i].latest();
                    if (!e || !e.has('components.element')) continue;

                    const history = e.history.enabled;
                    e.history.enabled = false;
                    e.set(path, null);
                    e.set(otherPath, prev[i + 1]);
                    e.history.enabled = history;
                }
            }

            function redo() {
                prev = [];
                for (let i = 0, len = entities.length; i < len; i++) {
                    const e = entities[i].latest();
                    if (!e || !e.has('components.element')) continue;

                    // we need to switch between the 'key'
                    // and 'text' fields depending on whether we picked
                    // for this element to be localized or not.
                    // But don't do anything if this element is already localized
                    // (or not depending on which we picked).
                    const val = e.get(otherPath);
                    if (val === null) continue;

                    prev.push(e);
                    prev.push(val);

                    var history = e.history.enabled;
                    e.history.enabled = false;
                    e.set(otherPath, null);
                    e.set(path, val);
                    e.history.enabled = history;
                }
            }

            redo();

            if (this._history) {
                this._history.add({
                    name: 'entities.components.element.localized',
                    undo: undo,
                    redo: redo
                });
            }
        }

        _onFieldAnchorChange(value) {
            if (!this._suppressPresetEvents) {
                this._suppressPresetEvents = true;
                this._updatePreset();
                this._suppressPresetEvents = false;
            }
            this._toggleFields();
        }

        _onFieldPivotChange(value) {
            if (!this._suppressPresetEvents) {
                this._suppressPresetEvents = true;
                this._updatePreset();
                this._suppressPresetEvents = false;
            }
            this._toggleFields();
        }

        _onFieldFontAssetChange(value) {
            if (value) {
                editor.call('settings:projectUser').set('editor.lastSelectedFontId', value);
            }
        }

        _getCurrentPresetValue() {
            const anchor = this._field('anchor').value;
            if (anchor) {
                const anchorKey = anchor.join(',');
                if (PRESETS[anchorKey]) {
                    const pivot = this._field('pivot').value || [];
                    const pivotKey = anchorKey + '/' + pivot.join(',');
                    if (PRESETS[pivotKey]) {
                        return pivotKey;
                    }

                    return anchorKey;
                }
            }

            return 'custom';
        }

        _updatePreset() {
            this._field('preset').value = this._getCurrentPresetValue();
        }

        link(entities) {
            super.link(entities);

            this._suppressToggleFields = true;
            this._attributesInspector.link(entities);
            this._suppressToggleFields = false;

            this._toggleFields();
        }

        unlink() {
            super.unlink();
            this._attributesInspector.unlink();
        }
    }

    return {
        ElementComponentInspector: ElementComponentInspector
    };
})());
