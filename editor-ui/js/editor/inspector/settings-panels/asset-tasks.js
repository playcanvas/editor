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
            label: 'Import Hierarchy',
            type: 'boolean',
            alias: 'asset-tasks:useContainers',
            path: 'editor.pipeline.useContainers'
        },
        {
            observer: 'settings',
            label: 'Unwrap Uv',
            type: 'boolean',
            alias: 'asset-tasks:unwrapUv',
            path: 'editor.pipeline.unwrapUv'
        },
        {
            observer: 'settings',
            label: 'Texels Per Meter',
            type: 'number',
            alias: 'asset-tasks:unwrapUvTexelsPerMeter',
            path: 'editor.pipeline.unwrapUvTexelsPerMeter',
            args: {
                min: 0
            }
        },
        {
            observer: 'settings',
            label: 'Create FBX Folder',
            type: 'boolean',
            alias: 'asset-tasks:createFBXFolder',
            path: 'editor.pipeline.createFBXFolder'
        },
        {
            observer: 'settings',
            label: 'Naming Strategy',
            type: 'select',
            args: {
                type: 'boolean',
                options: [
                    { v: false, t: 'Use Take Name' },
                    { v: true, t: 'Use FBX Filename' }
                ]
            },
            alias: 'asset-tasks:animUseFbxFilename',
            path: 'editor.pipeline.animUseFbxFilename'
        },
        {
            observer: 'settings',
            label: 'Sample Rate',
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
                    { v: 24, t: '24' },
                    { v: 30, t: '30' },
                    { v: 40, t: '40' },
                    { v: 48, t: '48' },
                    { v: 50, t: '50' },
                    { v: 60, t: '60' },
                    { v: 100, t: '100' },
                    { v: 120, t: '120' }
                ]
            }
        },
        {
            observer: 'settings',
            label: 'Curve Tolerance',
            type: 'number',
            alias: 'asset-tasks:animCurveTolerance',
            path: 'editor.pipeline.animCurveTolerance'
        },
        {
            observer: 'settings',
            label: 'Cubic Curves',
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
            this._appendSection('Animation Import Settings', this._attributesInspector.getField('editor.pipeline.createFBXFolder'));

            if (!editor.call('users:hasFlag', 'hasUnwrapUv')) {
                this._attributesInspector.getField('editor.pipeline.unwrapUv').parent.hidden = true;
                this._attributesInspector.getField('editor.pipeline.unwrapUvTexelsPerMeter').parent.hidden = true;
            }

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

            const useGlbField = this._attributesInspector.getField('editor.pipeline.useGlb');
            const useContainersField = this._attributesInspector.getField('editor.pipeline.useContainers');
            const animUseFbxFilenameField = this._attributesInspector.getField('editor.pipeline.animUseFbxFilename');

            useContainersField.parent.hidden = !useGlbField.value;
            animUseFbxFilenameField.parent.hidden = !useGlbField.value;
            useGlbField.on('change', (value) => {
                useContainersField.parent.hidden = !value;
                animUseFbxFilenameField.parent.hidden = !value;
                if (!value) {
                    useContainersField.value = false;
                }
            });
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
