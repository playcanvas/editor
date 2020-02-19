Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'asset-font-inspector';
    const CLASS_LOCALE_PANEL = CLASS_ROOT + '-locale-panel';
    const CLASS_LOCALE_REMOVE_BUTTON = CLASS_ROOT + '-locale-remove-button';
    const CLASS_CHARACTER_RANGE = CLASS_ROOT + '-character-range';
    const CLASS_CHARACTER_RANGE_LABEL = CLASS_CHARACTER_RANGE + '-label';
    const CLASS_CHARACTER_RANGE_BUTTON = CLASS_CHARACTER_RANGE + '-button';

    const PROPERTIES_ATTRIBUTES = [{
        label: 'Intensity',
        path: 'data.intensity',
        type: 'slider'
    }];

    const FONT_ATTRIBUTES = [{
        label: 'Characters',
        alias: 'characters',
        type: 'string'
    }, {
        label: 'Invert',
        path: 'meta.invert',
        type: 'boolean'
    }];

    const LOCALIZATION_ATTRIBUTES = [{
        label: 'Add Locale',
        alias: 'localization',
        type: 'string',
        args: {
            placeholder: 'Type to add (e.g. en-US)'
        }
    }];

    const addReferences = (attributes) => {
        attributes.forEach(attr => {
            const path = attr.alias || attr.path;
            if (!path) return;
            const parts = path.split('.');
            attr.reference = `asset:font:${parts[parts.length - 1]}`;
        });
    };
    addReferences(PROPERTIES_ATTRIBUTES);
    addReferences(FONT_ATTRIBUTES);

    const DOM = (parent) => [
        {
            root: {
                propertiesPanel: new pcui.Panel({
                    headerText: 'PROPERTIES'
                })
            },
            children: [{
                propertiesAttributes: new pcui.AttributesInspector({
                    assets: parent._args.assets,
                    history: parent._args.history,
                    attributes: PROPERTIES_ATTRIBUTES
                })
            }]
        },
        {
            root: {
                characterPresetsPanel: new pcui.Panel({
                    headerText: 'CHARACTER PRESETS'
                })
            },
            children: [{
                latinButton: new pcui.Button({ text: 'Latin' })
            },
            {
                latinSupplementButton: new pcui.Button({ text: 'Latin Supplement' })
            },
            {
                cyrillicButton: new pcui.Button({ text: 'Cyrillic' })
            },
            {
                greekButton: new pcui.Button({ text: 'Greek' })
            }]
        },
        {
            root: {
                characterRangePanel: new pcui.Panel({
                    headerText: 'CUSTOM CHARACTER RANGE'
                })
            },
            children: [{
                root: {
                    characterRangeContainer: new pcui.Container({
                        flex: true,
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'row',
                        class: CLASS_CHARACTER_RANGE
                    })
                },
                children: [{
                    characterRangeLabel: new pcui.Label({
                        text: 'Range (hex)',
                        class: CLASS_CHARACTER_RANGE_LABEL
                    })
                }, {
                    characterRangeStart: new pcui.TextInput({
                        placeholder: 'From',
                        value: '0x20'
                    })
                }, {
                    characterRangeEnd: new pcui.TextInput({
                        placeholder: 'To',
                        value: '0x7E'
                    })
                }, {
                    characterRangeButton: new pcui.Button({
                        icon: 'E287',
                        class: CLASS_CHARACTER_RANGE_BUTTON
                    })
                }]
            }]
        },
        {
            root: {
                fontPanel: new pcui.Panel({
                    headerText: 'FONT',
                    flex: true
                })
            },
            children: [{
                fontAttributes: new pcui.AttributesInspector({
                    assets: parent._args.assets,
                    history: parent._args.history,
                    attributes: FONT_ATTRIBUTES
                })
            }, {
                processFontButton: new pcui.Button({
                    text: 'Process Font',
                    flexGrow: 1
                })
            }]
        },
        {
            root: {
                localizationPanel: new pcui.Panel({
                    headerText: 'LOCALIZATION'
                })
            },
            children: [{
                localizationAttributes: new pcui.AttributesInspector({
                    assets: parent._args.assets,
                    history: parent._args.history,
                    attributes: LOCALIZATION_ATTRIBUTES
                })
            }]
        }
    ];

    // character presets
    const CHARACTER_PRESETS = {
        LATIN: { from: 0x20, to: 0x7e },
        LATIN_SUPPLEMENT: { from: 0xA0, to: 0xFF },
        CYRILLIC: { from: 0x400, to: 0x4ff },
        GREEK: { from: 0x370, to: 0x3FF }
    };

    class FontAssetInspector extends pcui.Container {
        constructor(args) {
            args = Object.assign({}, args);

            super(args);
            this._args = args;
            this._assets = null;
            this._assetEvents = [];
            this._localizations = {};

            this.buildDom(DOM(this));

            editor.call('attributes:reference:attach', `asset:font:presets`, this._characterPresetsPanel, this._characterPresetsPanel.header.dom);
            editor.call('attributes:reference:attach', `asset:font:customRange`, this._characterRangePanel, this._characterRangePanel.header.dom);
            editor.call('attributes:reference:attach', `asset:font:asset`, this._fontPanel, this._fontPanel.header.dom);
            editor.call('attributes:reference:attach', `asset:localization`, this._localizationPanel, this._localizationPanel.header.dom);
        }

        _getCharacterRange(range) {
            const chars = [];
            for (let i = range.from; i <= range.to; i++) {
                chars.push(String.fromCharCode(i));
            }
            return chars.join('');
        }

        _onClickPresetButton(charRange) {
            this._characterRangeStart.value = `0x${charRange.from.toString(16)}`;
            this._characterRangeEnd.value = `0x${charRange.to.toString(16)}`;
            this._fontAttributes.getField('characters').values = this._assets.map(() => {
                return this._fontAttributes.getField('characters').value + this._getCharacterRange(charRange);
            });
        }

        _onClickCharacterRangeButton() {
            const from = this._characterRangeStart.value;
            const to = this._characterRangeEnd.value;
            this._fontAttributes.getField('meta.chars').values = this._assets.map(() => {
                return this._fontAttributes.getField('characters').value + this._getCharacterRange({ from, to });
            });
        }

        _onClickProcessFontButton() {
            const characterValues = this._fontAttributes.getField('characters').value;
            this._assets.forEach(asset => {
                const sourceId = asset.get('source_asset_id');
                if (!sourceId) return;

                const source = editor.call('assets:get', sourceId);
                if (!source) return;

                // remove duplicate chars
                // remove duplicate chars but keep same order
                let unique = '';
                const chars = {};

                for (let i = 0, len = characterValues.length; i < len; i++) {
                    if (chars[characterValues[i]]) continue;
                    chars[characterValues[i]] = true;
                    unique += characterValues[i];
                }

                const task = {
                    source: parseInt(source.get('uniqueId'), 10),
                    target: parseInt(asset.get('uniqueId'), 10),
                    chars: unique,
                    invert: this._fontAttributes.getField('meta.invert').value
                };

                editor.call('realtime:send', 'pipeline', {
                    name: 'convert',
                    data: task
                });
            });
        }

        _toggleProcessFontButton(asset) {
            this._processFontButton.disabled = asset.get('task') === 'running';
        }

        _refreshLocalizationsForAsset() {
            Object.keys(this._localizations).forEach(locale => {
                this._removeLocalization(locale);

            });
            Object.keys(this._assets[0].get('i18n'))
            .sort((a, b) => {
                if (a > b)
                    return 1;
                else if (b > a)
                    return -1;
                return 0;
            })
            .forEach(locale => {
                const localizationAssetPanel = new pcui.Panel({
                    headerText: locale
                });
                localizationAssetPanel.class.add(CLASS_LOCALE_PANEL);
                localizationAssetPanel._removeLocalizationButton = new pcui.Button({
                    icon: 'E389'
                });
                localizationAssetPanel._removeLocalizationButton.class.add(CLASS_LOCALE_REMOVE_BUTTON);
                this._assetEvents.push(
                    localizationAssetPanel._removeLocalizationButton.on('click', () => this._assets[0].unset(`i18n.${locale}`))
                );
                localizationAssetPanel._localizationAsset = new pcui.AssetInput({
                    assetType: 'font',
                    assets: this._args.assets,
                    flexGrow: 1,
                    text: 'Asset',
                    binding: new pcui.BindingTwoWay({
                        history: this._args.history
                    }),
                    allowDragDrop: true
                });
                localizationAssetPanel._localizationAsset.link(this._assets, `i18n.${locale}`);
                localizationAssetPanel.append(localizationAssetPanel._localizationAsset);
                localizationAssetPanel.header.append(localizationAssetPanel._removeLocalizationButton);
                this._localizationPanel.append(localizationAssetPanel);
                this._localizations[locale] = localizationAssetPanel;
            });
        }

        _addLocalization(locale) {
            if (locale === '') {
                this._localizationAttributes.getField('localization').class.remove(pcui.CLASS_ERROR);
                return;
            }
            if (!Object.keys(this._assets[0].get(`i18n`)).includes(locale)) {
                this._assets[0].set('i18n.' + locale, null);
                this._localizationAttributes.getField('localization').value = '';
                this._localizationAttributes.getField('localization').class.remove(pcui.CLASS_ERROR);
            } else {
                this._localizationAttributes.getField('localization').class.add(pcui.CLASS_ERROR);
            }
        }

        _removeLocalization(locale) {
            const localizationAssetPanel = this._localizations[locale];
            localizationAssetPanel._localizationAsset.unlink();
            this._localizationPanel.remove(localizationAssetPanel);
            delete this._localizations[locale];
        }

        link(assets) {
            this.unlink();
            this._assets = assets;

            // Linking
            this._propertiesAttributes.link(assets);
            this._fontAttributes.link(assets);
            this._localizationAttributes.link(assets);
            this._refreshLocalizationsForAsset();

            // Events
            this._assetEvents.push(this._latinButton.on('click', () => this._onClickPresetButton(CHARACTER_PRESETS.LATIN)));
            this._assetEvents.push(this._latinSupplementButton.on('click', () => this._onClickPresetButton(CHARACTER_PRESETS.LATIN_SUPPLEMENT)));
            this._assetEvents.push(this._cyrillicButton.on('click', () => this._onClickPresetButton(CHARACTER_PRESETS.CYRILLIC)));
            this._assetEvents.push(this._greekButton.on('click', () => this._onClickPresetButton(CHARACTER_PRESETS.GREEK)));
            this._assetEvents.push(this._characterRangeButton.on('click', this._onClickCharacterRangeButton.bind(this)));
            this._assetEvents.push(this._processFontButton.on('click', this._onClickProcessFontButton.bind(this)));
            this._assetEvents.push(this._localizationAttributes.getField('localization').on('change', this._addLocalization.bind(this)));
            assets.forEach((asset) => {
                this._assetEvents.push(asset.on('task:set', () => this._toggleProcessFontButton(asset)));
                this._assetEvents.push(asset.on('*:set', this._refreshLocalizationsForAsset.bind(this)));
                this._assetEvents.push(asset.on('*:unset', this._refreshLocalizationsForAsset.bind(this)));
            });

            // View adjustments
            this._characterRangePanel.hidden = assets.length > 1;
            this._characterPresetsPanel.hidden = assets.length > 1;
            this._fontPanel.hidden = assets.length > 1;
            this._localizationPanel.hidden = assets.length > 1;
            this._fontAttributes.getField('characters').values = assets.map(asset => {
                return asset.get('meta.chars');
            });
        }

        unlink() {
            if (!this._assets) return;
            this._propertiesAttributes.unlink();
            this._fontAttributes.unlink();
            this._localizationAttributes.unlink();
            Object.keys(this._localizations).forEach(localization => {
                this._removeLocalization(localization);
            });
            this._assetEvents.forEach(evt => evt.unbind());
            this._localizationAttributes.getField('localization').value = '';
            this._localizationAttributes.getField('localization').class.remove(pcui.CLASS_ERROR);
        }
    }

    return {
        FontAssetInspector: FontAssetInspector
    };
})());
