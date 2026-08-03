import { Observer } from '@playcanvas/observer';
import type { EventHandle } from '@playcanvas/observer';
import { Panel, Button, Container, Label, TextInput, Menu, BindingTwoWay } from '@playcanvas/pcui';

import { CLASS_ERROR } from '@/common/pcui/constants';
import { AssetInput } from '@/common/pcui/element/element-asset-input';
import { Table } from '@/common/pcui/element/element-table';
import { TableCell } from '@/common/pcui/element/element-table-cell';
import { TableRow } from '@/common/pcui/element/element-table-row';
import { normalizeFontJson } from '@/common/referenced-font-handler';
import { tooltip, tooltipRefItem } from '@/common/tooltips';
import type { History } from '@/editor-api';

import type { Attribute } from '../attribute.type.d';
import { AttributesInspector } from '../attributes-inspector';

const CLASS_ROOT = 'asset-font-inspector';
const CLASS_LOCALE_PANEL = `${CLASS_ROOT}-locale-panel`;
const CLASS_CHARACTER_RANGE = `${CLASS_ROOT}-character-range`;
const CLASS_CHARACTER_RANGE_LABEL = `${CLASS_CHARACTER_RANGE}-label`;
const CLASS_CHARACTER_RANGE_BUTTON = `${CLASS_CHARACTER_RANGE}-button`;
const CLASS_FONT = `${CLASS_ROOT}-font`;
const CLASS_PROCESS_FONT_WARNING_MESSAGE = `${CLASS_ROOT}-process-font-warning-message`;
const CLASS_PROCESS_FONT_WARNING_ITEMS = `${CLASS_ROOT}-process-font-warning-items`;
const CLASS_SOURCE_FILES_WARNING = `${CLASS_ROOT}-source-files-warning`;

const PROPERTIES_ATTRIBUTES: Attribute[] = [
    {
        label: 'Intensity',
        path: 'data.intensity',
        type: 'slider'
    }
];

const FONT_ATTRIBUTES: Attribute[] = [
    {
        label: 'Characters',
        alias: 'characters',
        type: 'text'
    },
    {
        label: 'Invert',
        path: 'meta.invert',
        type: 'boolean'
    }
];

const LOCALIZATION_ATTRIBUTES: Attribute[] = [
    {
        label: 'Add Locale',
        alias: 'localization',
        type: 'string',
        args: {
            placeholder: 'Type to add (e.g. en-US)'
        }
    }
];

// pickers for the unpacked mirror assets of a client-imported (referenced) font. the texture list is
// an ordered array, not a single picker: a hand-supplied atlas may pack into a different number of
// pages than the generated one, and page order is what the descriptor's chars[].map indexes into
const SOURCE_FILES_ATTRIBUTES: Attribute[] = [
    {
        label: 'JSON',
        path: 'data.jsonAsset',
        type: 'asset',
        args: { assetType: 'json' }
    },
    {
        label: 'Textures',
        path: 'data.textureAssets',
        type: 'assets',
        args: { assetType: 'texture' }
    }
];

/**
 * @param attributes - The attributes to add references to
 */
const addReferences = (attributes: Attribute[]) => {
    attributes.forEach((attr) => {
        const path = attr.alias || attr.path;
        if (!path) {
            return;
        }
        const parts = path.split('.');
        attr.reference = `asset:font:${parts[parts.length - 1]}`;
    });
};
addReferences(PROPERTIES_ATTRIBUTES);
addReferences(FONT_ATTRIBUTES);
addReferences(SOURCE_FILES_ATTRIBUTES);

const DOM = (parent) => [
    {
        root: {
            propertiesPanel: new Panel({
                headerText: 'PROPERTIES'
            })
        },
        children: [
            {
                propertiesAttributes: new AttributesInspector({
                    assets: parent._args.assets,
                    history: parent._args.history,
                    attributes: PROPERTIES_ATTRIBUTES
                })
            }
        ]
    },
    {
        root: {
            sourceFilesPanel: new Panel({
                headerText: 'SOURCE FILES'
            })
        },
        children: [
            {
                sourceFilesAttributes: new AttributesInspector({
                    assets: parent._args.assets,
                    history: parent._args.history,
                    attributes: SOURCE_FILES_ATTRIBUTES
                })
            },
            {
                sourceFilesWarning: new Label({
                    hidden: true,
                    flexGrow: 1,
                    class: [CLASS_ERROR, CLASS_SOURCE_FILES_WARNING]
                })
            }
        ]
    },
    {
        root: {
            characterPresetsPanel: new Panel({
                headerText: 'CHARACTER PRESETS'
            })
        },
        children: [
            {
                latinButton: new Button({ text: 'Latin' })
            },
            {
                latinSupplementButton: new Button({ text: 'Latin Supplement' })
            },
            {
                cyrillicButton: new Button({ text: 'Cyrillic' })
            },
            {
                greekButton: new Button({ text: 'Greek' })
            }
        ]
    },
    {
        root: {
            characterRangePanel: new Panel({
                headerText: 'CUSTOM CHARACTER RANGE'
            })
        },
        children: [
            {
                root: {
                    characterRangeContainer: new Container({
                        flex: true,
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'row',
                        class: CLASS_CHARACTER_RANGE
                    })
                },
                children: [
                    {
                        characterRangeLabel: new Label({
                            text: 'Range (hex)',
                            class: CLASS_CHARACTER_RANGE_LABEL
                        })
                    },
                    {
                        characterRangeStart: new TextInput({
                            placeholder: 'From',
                            value: '0x20'
                        })
                    },
                    {
                        characterRangeEnd: new TextInput({
                            placeholder: 'To',
                            value: '0x7E'
                        })
                    },
                    {
                        characterRangeButton: new Button({
                            icon: 'E287',
                            class: CLASS_CHARACTER_RANGE_BUTTON
                        })
                    }
                ]
            }
        ]
    },
    {
        root: {
            fontPanel: new Panel({
                headerText: 'FONT',
                flex: true,
                class: CLASS_FONT
            })
        },
        children: [
            {
                fontAttributes: new AttributesInspector({
                    assets: parent._args.assets,
                    history: parent._args.history,
                    attributes: FONT_ATTRIBUTES
                })
            },
            {
                processFontButton: new Button({
                    text: 'REGENERATE FONT ASSETS',
                    flexGrow: 1
                })
            },
            {
                root: {
                    processFontWarningContainer: new Container({
                        flex: true,
                        hidden: true
                    })
                },
                children: [
                    {
                        processFontWarningMessage: new Label({
                            text: 'Warning. The following characters were not found in the font file:',
                            flexGrow: 1,
                            class: [CLASS_ERROR, CLASS_PROCESS_FONT_WARNING_MESSAGE]
                        })
                    },
                    {
                        processFontWarningItems: new Table({
                            class: [CLASS_PROCESS_FONT_WARNING_ITEMS],
                            scrollable: true,
                            columns: [
                                {
                                    title: 'Character',
                                    width: '50%'
                                },
                                {
                                    title: 'Unicode',
                                    width: '50%'
                                }
                            ],
                            defaultSortColumn: 0,
                            createRowFn: (observer: Observer) => {
                                const copyToClipboard = (str: string) => {
                                    const el = document.createElement('textarea');
                                    el.value = str;
                                    document.body.appendChild(el);
                                    el.select();
                                    document.execCommand('copy');
                                    document.body.removeChild(el);
                                };

                                const character = observer.get('character');

                                const row = new TableRow();

                                const characterCell = new TableCell({
                                    alignItems: 'center'
                                });
                                const characterLabel = new Label({ text: character });
                                characterCell.append(characterLabel);
                                row.append(characterCell);

                                const unicodeCell = new TableCell({
                                    alignItems: 'center'
                                });
                                const unicodeLabel = new Label({ text: character.charCodeAt() });
                                unicodeCell.append(unicodeLabel);
                                row.append(unicodeCell);

                                const root = editor.call('layout.root');

                                const characterMenu = new Menu({
                                    items: [
                                        {
                                            text: 'Copy character',
                                            onSelect: () => copyToClipboard(character)
                                        }
                                    ]
                                });

                                root.append(characterMenu);
                                parent._contextMenus.push(characterMenu);

                                characterCell.dom.addEventListener('contextmenu', (e: MouseEvent) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    characterMenu.position(e.clientX, e.clientY);
                                    characterMenu.hidden = false;
                                });

                                const unicodeMenu = new Menu({
                                    items: [
                                        {
                                            text: 'Copy unicode',
                                            onSelect: () => copyToClipboard(character.charCodeAt())
                                        }
                                    ]
                                });

                                root.append(unicodeMenu);
                                parent._contextMenus.push(unicodeMenu);

                                unicodeCell.dom.addEventListener('contextmenu', (e: MouseEvent) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    unicodeMenu.position(e.clientX, e.clientY);
                                    unicodeMenu.hidden = false;
                                });

                                return row;
                            }
                        })
                    }
                ]
            }
        ]
    },
    {
        root: {
            localizationPanel: new Panel({
                headerText: 'LOCALIZATION'
            })
        },
        children: [
            {
                localizationAttributes: new AttributesInspector({
                    assets: parent._args.assets,
                    history: parent._args.history,
                    attributes: LOCALIZATION_ATTRIBUTES
                })
            }
        ]
    }
];

// character presets
const CHARACTER_PRESETS = {
    LATIN: { from: 0x20, to: 0x7e },
    LATIN_SUPPLEMENT: { from: 0xa0, to: 0xff },
    CYRILLIC: { from: 0x400, to: 0x4ff },
    GREEK: { from: 0x370, to: 0x3ff }
};

type FontAssetInspectorArgs = {
    assets?: Observer[];
    history?: History;
} & Record<string, unknown>;

class FontAssetInspector extends Container {
    _args: FontAssetInspectorArgs;

    _assets: Observer[] | null;

    _assetEvents: EventHandle[];

    _localizations: Record<string, Panel>;

    _localizationAssets: Record<string, AssetInput>;

    _contextMenus: Menu[];

    _characterPresetsPanel: Panel;

    _characterRangePanel: Panel;

    _characterRangeStart: TextInput;

    _characterRangeEnd: TextInput;

    _fontPanel: Panel;

    _fontAttributes: AttributesInspector;

    _processFontButton: Button;

    _processing: boolean;

    _processFontWarningContainer: Container;

    _processFontWarningItems: Table;

    _localizationPanel: Panel;

    _localizationAttributes: AttributesInspector;

    _latinButton: Button;

    _latinSupplementButton: Button;

    _cyrillicButton: Button;

    _greekButton: Button;

    _characterRangeButton: Button;

    _propertiesPanel: Panel;

    _propertiesAttributes: AttributesInspector;

    _sourceFilesPanel: Panel;

    _sourceFilesAttributes: AttributesInspector;

    _sourceFilesWarning: Label;

    constructor(args: FontAssetInspectorArgs = {} as FontAssetInspectorArgs) {
        args = Object.assign({}, args);

        super(args);
        this._args = args;
        this._assets = null;
        this._assetEvents = [];
        this._localizations = {};
        this._localizationAssets = {};
        this._contextMenus = [];
        this._processing = false;

        this.buildDom(DOM(this));

        let ref = editor.call('attributes:reference:get', 'asset:font:presets');
        if (ref) {
            tooltip().attach({
                container: tooltipRefItem({
                    reference: ref
                }),
                target: this._characterPresetsPanel.header
            });
        }

        ref = editor.call('attributes:reference:get', 'asset:font:customRange');
        if (ref) {
            tooltip().attach({
                container: tooltipRefItem({
                    reference: ref
                }),
                target: this._characterRangePanel.header
            });
        }

        ref = editor.call('attributes:reference:get', 'asset:font:asset');
        if (ref) {
            tooltip().attach({
                container: tooltipRefItem({
                    reference: ref
                }),
                target: this._fontPanel.header
            });
        }

        ref = editor.call('attributes:reference:get', 'asset:localization');
        if (ref) {
            tooltip().attach({
                container: tooltipRefItem({
                    reference: ref
                }),
                target: this._localizationPanel.header
            });
        }
    }

    _getCharacterRange(range: { from: number; to: number }): string {
        const chars = [];
        for (let i = range.from; i <= range.to; i++) {
            chars.push(String.fromCharCode(i));
        }
        return chars.join('');
    }

    _onClickPresetButton(charRange: { from: number; to: number }) {
        this._characterRangeStart.value = `0x${charRange.from.toString(16)}`;
        this._characterRangeEnd.value = `0x${charRange.to.toString(16)}`;
        const charactersField = this._fontAttributes.getField('characters');
        charactersField.values = this._assets.map(() => {
            return charactersField.value + this._getCharacterRange(charRange);
        });
    }

    _onClickCharacterRangeButton() {
        const from = this._characterRangeStart.value;
        const to = this._characterRangeEnd.value;
        const charactersField = this._fontAttributes.getField('characters');
        charactersField.values = this._assets.map(() => {
            return charactersField.value + this._getCharacterRange({ from, to });
        });
    }

    _onClickProcessFontButton() {
        for (const contextMenu of this._contextMenus) {
            contextMenu.destroy();
        }

        this._contextMenus.length = 0;
        this._processFontWarningContainer.hidden = true;

        const asset = this._assets[0];
        // converting a legacy font rewrites data, replaces the file and drops the server-generated
        // descriptor, none of it through history — so it cannot be undone
        if (!asset.has('data.jsonAsset')) {
            editor.call(
                'picker:confirm',
                'Converting this font replaces its data and file with references to new JSON and texture assets. This cannot be undone.',
                () => this._reprocess(asset),
                { yesText: 'CONVERT' }
            );
            return;
        }
        this._reprocess(asset);
    }

    _reprocess(asset: Observer) {
        const chars = [...new Set(Array.from(this._fontAttributes.getField('characters').value))].join('');
        this._processing = true;
        this._toggleProcessFontButton(asset);
        editor.call('fonts:reprocess', asset, chars, this._fontAttributes.getField('meta.invert').value).then(() => {
            this._processing = false;
            // the user can select away mid-regenerate; don't write to an unlinked inspector
            if (!this._assets?.includes(asset)) {
                return;
            }
            const referenced = asset.has('data.jsonAsset');
            this._sourceFilesPanel.hidden = !referenced;
            this._propertiesPanel.hidden = referenced;
            this._toggleProcessFontButton(asset);
            this._refreshSourceFilesWarning(asset);
        });
    }

    _toggleProcessFontButton(asset: Observer) {
        const referenced = asset.has('data.jsonAsset');
        this._processFontButton.text = this._processing
            ? referenced
                ? 'REGENERATING FONT ASSETS…'
                : 'CONVERTING TO REFERENCED FONT…'
            : referenced
              ? 'REGENERATE FONT ASSETS'
              : 'CONVERT TO REFERENCED FONT';
        this._processFontButton.enabled = !this._processing && asset.get('task') !== 'running';
    }

    // the source-file refs are user-editable, so report the states the handler soft-fails on rather than
    // letting the font silently render blank.
    // ponytail: reads the json through the viewport app, so nothing is reported until that resource has
    // loaded; refresh again once it does if that proves too quiet in practice
    _refreshSourceFilesWarning(asset: Observer) {
        const jsonId = asset.get('data.jsonAsset');
        const textureIds = asset.get('data.textureAssets') || [];
        let msg = '';

        if (!jsonId) {
            msg = 'No JSON asset referenced. The font will render blank.';
        } else if (!textureIds.length || textureIds.some((id: number) => !id)) {
            msg = 'No texture asset referenced. The font will render blank.';
        } else {
            const json = editor.call('viewport:app')?.assets.get(jsonId);
            if (json?.resource) {
                const [err, data] = normalizeFontJson(json.resource);
                const maps = data?.info?.maps?.length;
                if (err) {
                    msg = `JSON asset is not a valid font descriptor: ${err}.`;
                } else if (maps !== textureIds.length) {
                    msg = `JSON asset declares ${maps} atlas page(s) but ${textureIds.length} texture(s) are referenced.`;
                }
            }
        }

        this._sourceFilesWarning.text = msg;
        this._sourceFilesWarning.hidden = !msg;
    }

    _showUnavailableCharacters(unavailableCharacters: string[]) {
        this._processFontWarningContainer.hidden = unavailableCharacters.length === 0;
        if (unavailableCharacters.length > 0) {
            this._processFontWarningItems.link(unavailableCharacters.map((char) => new Observer({ character: char })));
        }
    }

    _refreshLocalizationsForAsset() {
        Object.keys(this._localizations).forEach((locale) => {
            this._removeLocalization(locale);
        });
        Object.keys(this._assets[0].get('i18n'))
            .sort((a, b) => {
                if (a > b) {
                    return 1;
                }
                if (b > a) {
                    return -1;
                }
                return 0;
            })
            .forEach((locale) => {
                const localizationAssetPanel = new Panel({
                    headerText: locale,
                    removable: true
                });
                localizationAssetPanel.class.add(CLASS_LOCALE_PANEL);
                this._assetEvents.push(
                    localizationAssetPanel.on('click:remove', () => {
                        this._assets[0].unset(`i18n.${locale}`);
                    })
                );
                const localizationAsset = new AssetInput({
                    assetType: 'font',
                    assets: this._args.assets,
                    flexGrow: 1,
                    text: 'Asset',
                    binding: new BindingTwoWay({
                        history: this._args.history
                    }),
                    allowDragDrop: true
                });
                localizationAsset.link(this._assets, `i18n.${locale}`);
                localizationAssetPanel.append(localizationAsset);
                this._localizationAssets[locale] = localizationAsset;
                this._localizationPanel.append(localizationAssetPanel);
                this._localizations[locale] = localizationAssetPanel;
            });
    }

    _addLocalization(locale: string) {
        if (locale === '') {
            this._localizationAttributes.getField('localization').class.remove(CLASS_ERROR);
            return;
        }
        if (!Object.keys(this._assets[0].get('i18n')).includes(locale)) {
            this._assets[0].set(`i18n.${locale}`, null);
            this._localizationAttributes.getField('localization').value = '';
            this._localizationAttributes.getField('localization').class.remove(CLASS_ERROR);
        } else {
            this._localizationAttributes.getField('localization').class.add(CLASS_ERROR);
        }
    }

    _removeLocalization(locale: string) {
        this._localizationAssets[locale]?.unlink();
        delete this._localizationAssets[locale];
        this._localizationPanel.remove(this._localizations[locale]);
        delete this._localizations[locale];
    }

    link(assets: Observer[]) {
        this.unlink();
        this._assets = assets;

        // Linking
        this._propertiesAttributes.link(assets);
        this._sourceFilesAttributes.link(assets);
        this._fontAttributes.link(assets);
        this._localizationAttributes.link(assets);
        this._refreshLocalizationsForAsset();

        // Events
        this._assetEvents.push(this._latinButton.on('click', () => this._onClickPresetButton(CHARACTER_PRESETS.LATIN)));
        this._assetEvents.push(
            this._latinSupplementButton.on('click', () => this._onClickPresetButton(CHARACTER_PRESETS.LATIN_SUPPLEMENT))
        );
        this._assetEvents.push(
            this._cyrillicButton.on('click', () => this._onClickPresetButton(CHARACTER_PRESETS.CYRILLIC))
        );
        this._assetEvents.push(this._greekButton.on('click', () => this._onClickPresetButton(CHARACTER_PRESETS.GREEK)));
        this._assetEvents.push(this._characterRangeButton.on('click', this._onClickCharacterRangeButton.bind(this)));
        this._assetEvents.push(this._processFontButton.on('click', this._onClickProcessFontButton.bind(this)));
        this._assetEvents.push(
            this._localizationAttributes.getField('localization').on('change', this._addLocalization.bind(this))
        );
        assets.forEach((asset) => {
            this._toggleProcessFontButton(asset);

            this._assetEvents.push(
                asset.on('task:set', (v) => {
                    // process font complete
                    if (v === null) {
                        const availableCharacters = asset.get('data.chars');
                        if (availableCharacters) {
                            const unavailableCharacters = this._fontAttributes
                                .getField('characters')
                                .value.split('')
                                .filter((character: string) => !availableCharacters[character.charCodeAt(0)]);
                            this._showUnavailableCharacters(unavailableCharacters);
                        }
                    } else {
                        this._processFontWarningContainer.hidden = true;
                    }
                    this._toggleProcessFontButton(asset);
                })
            );

            this._assetEvents.push(asset.on('*:set', this._refreshLocalizationsForAsset.bind(this)));
            this._assetEvents.push(asset.on('*:unset', this._refreshLocalizationsForAsset.bind(this)));

            // repointing a source-file ref can invalidate the pairing (page count, descriptor shape). the
            // observer has no mid-path wildcard, so listen on the global events and filter by path
            ['*:set', '*:insert', '*:remove', '*:move'].forEach((evt) => {
                this._assetEvents.push(
                    asset.on(evt, (path: string) => {
                        if (
                            path === 'data' ||
                            path.startsWith('data.jsonAsset') ||
                            path.startsWith('data.textureAssets')
                        ) {
                            this._refreshSourceFilesWarning(asset);
                        }
                    })
                );
            });
        });

        // client-imported (referenced) fonts have no server `task`; fonts:reprocess reports the glyphs the
        // source didn't provide via this event, mirroring the server pipeline's warning table
        this._assetEvents.push(
            editor.on('fonts:reprocessed', (font: Observer, unavailableCharacters: string[]) => {
                if (this._assets?.includes(font)) {
                    this._showUnavailableCharacters(unavailableCharacters);
                }
            })
        );

        // View adjustments
        this._characterRangePanel.hidden = assets.length > 1;
        this._characterPresetsPanel.hidden = assets.length > 1;
        this._fontPanel.hidden = assets.length > 1;
        this._localizationPanel.hidden = assets.length > 1;
        // only client-imported (referenced) fonts have unpacked mirror assets. gate on the ref fields
        // existing (not their current value) so clearing a picker doesn't hide the whole panel
        this._sourceFilesPanel.hidden =
            assets.length > 1 || (!assets[0].has('data.jsonAsset') && !assets[0].has('data.textureAssets'));
        // referenced fonts derive intensity from the json descriptor, not font.data.intensity — the
        // slider is inert for them, so hide the PROPERTIES panel (keep it for server-pipeline fonts)
        this._propertiesPanel.hidden = assets[0].has('data.jsonAsset');
        if (this._sourceFilesPanel.hidden) {
            this._sourceFilesWarning.hidden = true;
        } else {
            this._refreshSourceFilesWarning(assets[0]);
        }

        const charactersField = this._fontAttributes.getField('characters');
        charactersField.renderChanges = false;
        charactersField.values = assets.map((asset) => {
            return asset.get('meta.chars');
        });
        charactersField.renderChanges = true;
    }

    unlink() {
        if (!this._assets) {
            return;
        }
        this._propertiesAttributes.unlink();
        this._sourceFilesAttributes.unlink();
        this._fontAttributes.unlink();
        this._localizationAttributes.unlink();
        Object.keys(this._localizations).forEach((localization) => {
            this._removeLocalization(localization);
        });
        this._assetEvents.forEach((evt) => evt.unbind());
        this._localizationAttributes.getField('localization').value = '';
        this._localizationAttributes.getField('localization').class.remove(CLASS_ERROR);
    }
}

export { FontAssetInspector };
