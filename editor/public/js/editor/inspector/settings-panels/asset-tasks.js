Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'asset-tasks-settings-panel';
    const CLASS_SECTION = CLASS_ROOT + '-section';
    const CLASS_ATTRIBUTES = CLASS_ROOT + '-attributes';

    const ATTRIBUTES = [
        {
            observer: 'settings',
            label: 'Search related assets',
            type: 'boolean',
            alias: 'asset-tasks:searchRelatedAssets',
            path: 'editor.pipeline.searchRelatedAssets'
        },
        {
            observer: 'settings',
            label: 'Assets default to preload',
            type: 'boolean',
            alias: 'asset-tasks:defaultAssetPreload',
            path: 'editor.pipeline.defaultAssetPreload'
        },
        {
            observer: 'settings',
            label: 'Textures POT',
            type: 'boolean',
            alias: 'asset-tasks:texturePot',
            path: 'editor.pipeline.texturePot'
        },
        {
            observer: 'settings',
            label: 'Create Atlases',
            type: 'boolean',
            alias: 'asset-tasks:textureDefaultToAtlas',
            path: 'editor.pipeline.textureDefaultToAtlas'
        },
        {
            observer: 'settings',
            label: 'Preserve material mappings',
            type: 'boolean',
            alias: 'asset-tasks:preserveMapping',
            path: 'editor.pipeline.preserveMapping'
        },
        {
            observer: 'settings',
            label: 'Overwrite Models',
            type: 'boolean',
            alias: 'asset-tasks:overwrite.model',
            path: 'editor.pipeline.overwriteModel'
        },
        {
            observer: 'settings',
            label: 'Overwrite Animations',
            type: 'boolean',
            alias: 'asset-tasks:overwrite.animation',
            path: 'editor.pipeline.overwriteAnimation'
        },
        {
            observer: 'settings',
            label: 'Overwrite Materials',
            type: 'boolean',
            alias: 'asset-tasks:overwrite.material',
            path: 'editor.pipeline.overwriteMaterial'
        },
        {
            observer: 'settings',
            label: 'Overwrite Textures',
            type: 'boolean',
            alias: 'asset-tasks:overwrite.texture',
            path: 'editor.pipeline.overwriteTexture'
        },
        {
            observer: 'settings',
            label: 'Convert to GLB',
            type: 'boolean',
            alias: 'asset-tasks:useGlb',
            path: 'editor.pipeline.useGlb'
        },
        {
            observer: 'settings',
            label: 'Anim curve sample interval',
            type: 'number',
            alias: 'asset-tasks:animSampleInterval',
            path: 'editor.pipeline.animSampleInterval'
        },
        {
            observer: 'settings',
            label: 'Anim curve tolerance',
            type: 'number',
            alias: 'asset-tasks:animCurveTolerance',
            path: 'editor.pipeline.animCurveTolerance'
        },
        {
            observer: 'settings',
            label: 'Anim enable cubic curves',
            type: 'boolean',
            alias: 'asset-tasks:animEnableCubic',
            path: 'editor.pipeline.animEnableCubic'
        }
    ];

    class AssettasksSettingsPanel extends pcui.BaseSettingsPanel {
        constructor(args) {
            args = Object.assign({}, args);
            args.headerText = 'ASSET TASKS';
            args.attributes = ATTRIBUTES;
            args.splitReferencePath = false;

            super(args);

            this._attributesInspector.class.add(CLASS_ATTRIBUTES);

            // add sections
            this._appendSection('Texture Import Settings', this._attributesInspector.getField('editor.pipeline.defaultAssetPreload'));
            this._appendSection('Model Import Settings', this._attributesInspector.getField('editor.pipeline.textureDefaultToAtlas'));

            // reference
            if (!this._panelTooltip) {
                const ref = editor.call('attributes:reference:get', 'settings:asset-tasks');
                if (ref) {
                    this._panelTooltip = new pcui.TooltipReference({
                        reference: ref
                    });

                    this._panelTooltip.attach({
                        target: this.header
                    });

                    this.once('destroy', () => {
                        this._panelTooltip.destroy();
                        this._panelTooltip = null;
                    });
                }
            }

            const hasUseGlb = editor.call('users:hasFlag', 'hasConvertGlb');

            const fieldUseGlb = this._attributesInspector.getField('editor.pipeline.useGlb');
            if (!hasUseGlb && !fieldUseGlb.value) {
                fieldUseGlb.parent.hidden = true;
            }

            let evtUseGlb = args.settings.on('editor.pipeline.useGlb:set', value => {
                if (value) {
                    fieldUseGlb.parent.hidden = false;
                } else if (!hasUseGlb) {
                    fieldUseGlb.parent.hidden = true;
                }
            });

            fieldUseGlb.on('destroy', () => {
                evtUseGlb.unbind();
                evtUseGlb = null;
            });

            if (!hasUseGlb) {
                // use the useGlb flag to hide animation options
                this._attributesInspector.getField('editor.pipeline.animSampleInterval').parent.hidden = true;
                this._attributesInspector.getField('editor.pipeline.animCurveTolerance').parent.hidden = true;
                this._attributesInspector.getField('editor.pipeline.animEnableCubic').parent.hidden = true;
            }
        }

        _appendSection(title, attributeElement) {
            const section = new pcui.Panel({ headerText: title, class: CLASS_SECTION });
            attributeElement.parent.parent.appendAfter(section, attributeElement.parent);
        }
    }

    return {
        AssettasksSettingsPanel: AssettasksSettingsPanel
    };
})());
