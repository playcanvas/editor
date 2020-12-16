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
            label: 'Create Container Assets',
            type: 'boolean',
            alias: 'asset-tasks:useContainers',
            path: 'editor.pipeline.useContainers'
        },
        {
            observer: 'settings',
            label: 'Sample rate',
            alias: 'asset-tasks:animSampleRate',
            path: 'editor.pipeline.animSampleRate',
            type: 'select',
            args: {
                type: 'number',
                options: [
                    { v: 0, t: 'Disabled (use keys)' },
                    { v: 1, t: '1' },
                    { v: 10, t: '10' },
                    { v: 20, t: '20' },
                    { v: 30, t: '30' },
                    { v: 40, t: '40' },
                    { v: 50, t: '50' },
                    { v: 60, t: '60' },
                    { v: 100, t: '100' }
                ]
            }
        },
        {
            observer: 'settings',
            label: 'Curve tolerance',
            type: 'number',
            alias: 'asset-tasks:animCurveTolerance',
            path: 'editor.pipeline.animCurveTolerance'
        },
        {
            observer: 'settings',
            label: 'Cubic curves',
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
            this._appendSection('Animation Import Settings', this._attributesInspector.getField('editor.pipeline.useContainers'));

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

            if (!editor.call('users:hasFlag', 'hasContainerAssets')) {
                this._attributesInspector.getField('editor.pipeline.useContainers').parent.hidden = true;
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
