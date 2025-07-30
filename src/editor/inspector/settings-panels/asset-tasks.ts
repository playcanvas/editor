import { Panel, Button, Container, Label } from '@playcanvas/pcui';

import { BaseSettingsPanel } from './base.ts';

/**
 * @import { Attribute } from '../attribute.type.d.ts'
 */

const CLASS_ROOT = 'asset-tasks-settings-panel';
const CLASS_SECTION = `${CLASS_ROOT}-section`;
const CLASS_ATTRIBUTES = `${CLASS_ROOT}-attributes`;

/**
 * @type {Attribute[]}
 */
const ATTRIBUTES = [
    {
        observer: 'settings',
        label: 'Search related assets',
        type: 'boolean',
        alias: 'asset-tasks:searchRelatedAssets',
        reference: 'settings:asset-tasks:searchRelatedAssets',
        path: 'editor.pipeline.searchRelatedAssets'
    },
    {
        observer: 'settings',
        label: 'Assets default to preload',
        type: 'boolean',
        alias: 'asset-tasks:defaultAssetPreload',
        reference: 'settings:asset-tasks:defaultAssetPreload',
        path: 'editor.pipeline.defaultAssetPreload'
    },
    {
        observer: 'settings',
        label: 'Textures POT',
        type: 'boolean',
        alias: 'asset-tasks:texturePot',
        reference: 'settings:asset-tasks:texturePot',
        path: 'editor.pipeline.texturePot'
    },
    {
        observer: 'settings',
        label: 'Create Atlases',
        type: 'boolean',
        alias: 'asset-tasks:textureDefaultToAtlas',
        reference: 'settings:asset-tasks:textureDefaultToAtlas',
        path: 'editor.pipeline.textureDefaultToAtlas'
    },
    {
        observer: 'settings',
        label: 'Preserve material mappings',
        type: 'boolean',
        alias: 'asset-tasks:preserveMapping',
        reference: 'settings:asset-tasks:preserveMapping',
        path: 'editor.pipeline.preserveMapping'
    },
    {
        observer: 'settings',
        label: 'Overwrite Models',
        type: 'boolean',
        alias: 'asset-tasks:overwrite.model',
        reference: 'settings:asset-tasks:overwrite:model',
        path: 'editor.pipeline.overwriteModel'
    },
    {
        observer: 'settings',
        label: 'Overwrite Animations',
        type: 'boolean',
        alias: 'asset-tasks:overwrite.animation',
        reference: 'settings:asset-tasks:overwrite:animation',
        path: 'editor.pipeline.overwriteAnimation'
    },
    {
        observer: 'settings',
        label: 'Overwrite Materials',
        type: 'boolean',
        alias: 'asset-tasks:overwrite.material',
        reference: 'settings:asset-tasks:overwrite:material',
        path: 'editor.pipeline.overwriteMaterial'
    },
    {
        observer: 'settings',
        label: 'Overwrite Textures',
        type: 'boolean',
        alias: 'asset-tasks:overwrite.texture',
        reference: 'settings:asset-tasks:overwrite:texture',
        path: 'editor.pipeline.overwriteTexture'
    },
    {
        observer: 'settings',
        label: 'Convert to GLB',
        type: 'boolean',
        alias: 'asset-tasks:useGlb',
        reference: 'settings:asset-tasks:useGlb',
        path: 'editor.pipeline.useGlb'
    },
    {
        observer: 'settings',
        label: 'Import Hierarchy',
        type: 'boolean',
        alias: 'asset-tasks:useContainers',
        reference: 'settings:asset-tasks:useContainers',
        path: 'editor.pipeline.useContainers'
    },
    {
        observer: 'settings',
        label: 'Mesh Compression',
        type: 'select',
        alias: 'asset-tasks:meshCompression',
        reference: 'settings:asset-tasks:meshCompression',
        path: 'editor.pipeline.meshCompression',
        args: {
            type: 'string',
            options: [
                { v: 'none', t: 'Disabled' },
                { v: 'draco', t: 'Draco' }
            ]
        }
    },
    {
        observer: 'settings',
        label: 'Draco Decode Speed',
        type: 'slider',
        alias: 'asset-tasks:dracoDecodeSpeed',
        reference: 'settings:asset-tasks:dracoDecodeSpeed',
        path: 'editor.pipeline.dracoDecodeSpeed',
        args: {
            precision: 1,
            step: 0.1,
            min: 0,
            max: 1
        }
    },
    {
        observer: 'settings',
        label: 'Draco Mesh Size',
        type: 'slider',
        alias: 'asset-tasks:dracoMeshSize',
        reference: 'settings:asset-tasks:dracoMeshSize',
        path: 'editor.pipeline.dracoMeshSize',
        args: {
            precision: 1,
            step: 0.1,
            min: 0,
            max: 1
        }
    },
    {
        observer: 'settings',
        label: 'Unwrap Uv',
        type: 'boolean',
        alias: 'asset-tasks:unwrapUv',
        reference: 'settings:asset-tasks:unwrapUv',
        path: 'editor.pipeline.unwrapUv'
    },
    {
        observer: 'settings',
        label: 'Texels Per Meter',
        type: 'number',
        alias: 'asset-tasks:unwrapUvTexelsPerMeter',
        reference: 'settings:asset-tasks:unwrapUvTexelsPerMeter',
        path: 'editor.pipeline.unwrapUvTexelsPerMeter',
        args: {
            min: 0
        }
    },
    {
        observer: 'settings',
        label: 'Import Morph Normals',
        type: 'boolean',
        alias: 'asset-tasks:importMorphNormals',
        reference: 'settings:asset-tasks:importMorphNormals',
        path: 'editor.pipeline.importMorphNormals'
    },
    {
        observer: 'settings',
        label: 'Create FBX Folder',
        type: 'boolean',
        alias: 'asset-tasks:createFBXFolder',
        reference: 'settings:asset-tasks:createFBXFolder',
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
        reference: 'settings:asset-tasks:animUseFbxFilename',
        path: 'editor.pipeline.animUseFbxFilename'
    },
    {
        observer: 'settings',
        label: 'Sample Rate',
        alias: 'asset-tasks:animSampleRate',
        reference: 'settings:asset-tasks:animSampleRate',
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
        reference: 'settings:asset-tasks:animCurveTolerance',
        path: 'editor.pipeline.animCurveTolerance'
    },
    {
        observer: 'settings',
        label: 'Cubic Curves',
        type: 'boolean',
        alias: 'asset-tasks:animEnableCubic',
        reference: 'settings:asset-tasks:animEnableCubic',
        path: 'editor.pipeline.animEnableCubic'
    }
];

class AssetTasksSettingsPanel extends BaseSettingsPanel {
    constructor(args) {
        args = Object.assign({}, args);
        args.headerText = 'ASSET TASKS';
        args.attributes = ATTRIBUTES;
        args.userOnlySettings = true;
        args._tooltipReference = 'settings:asset-tasks';

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

        const useGlbField = this._attributesInspector.getField('editor.pipeline.useGlb');
        const useContainersField = this._attributesInspector.getField('editor.pipeline.useContainers');
        const meshCompressionField = this._attributesInspector.getField('editor.pipeline.meshCompression');
        const dracoDecodeSpeed = this._attributesInspector.getField('editor.pipeline.dracoDecodeSpeed');
        const dracoMeshSize = this._attributesInspector.getField('editor.pipeline.dracoMeshSize');
        const animUseFbxFilenameField = this._attributesInspector.getField('editor.pipeline.animUseFbxFilename');

        const updateFields = (value) => {
            useContainersField.parent.hidden = !value;
            meshCompressionField.parent.hidden = !value;
            animUseFbxFilenameField.parent.hidden = !value;
        };
        updateFields(useGlbField.value);

        useGlbField.on('change', (value) => {
            updateFields(value);
            if (!value) {
                useContainersField.value = false;
                meshCompressionField.value = 'none';
                animUseFbxFilenameField.value = false;
            }
        });

        // draco
        this._setupDracoImportButton(meshCompressionField, 'draco.js', 'draco');
        const updateDracoImport = (value) => {
            this._containerImportDraco.hidden = (value !== 'draco') || editor.call('project:module:hasModule', 'draco');
            dracoDecodeSpeed.parent.hidden = (value !== 'draco');
            dracoMeshSize.parent.hidden = (value !== 'draco');
        };
        meshCompressionField.on('change', value => updateDracoImport(value));
        this.on('showToRoot', () => {
            updateDracoImport(meshCompressionField.value);
        });
    }

    _appendSection(title, attributeElement) {
        const section = new Panel({ headerText: title, class: CLASS_SECTION });
        attributeElement.parent.parent.appendAfter(section, attributeElement.parent);
        return section;
    }

    _setupDracoImportButton(previousField, moduleStoreName, wasmFilename) {
        this._containerImportDraco = new Container({
            class: 'pcui-subpanel',
            flex: true,
            flexDirection: 'row',
            alignItems: 'center'
        });

        this._labelImportDraco = new Label({
            text: 'Draco Not Found'
        });
        this._containerImportDraco.append(this._labelImportDraco);

        this._btnImportDraco = new Button({
            text: 'IMPORT DRACO',
            icon: 'E228',
            flexGrow: 1
        });
        this._btnImportDraco.on('click', () => {
            editor.call('project:module:addModule', moduleStoreName, wasmFilename);
        });
        this._containerImportDraco.append(this._btnImportDraco);

        previousField.parent.parent.appendAfter(this._containerImportDraco, previousField.parent);

        const events = [];
        const handleModuleImported = (name) => {
            if (name === moduleStoreName) {
                this._containerImportDraco.hidden = true;
            }
        };
        events.push(editor.on('onModuleImported', handleModuleImported));

        this._containerImportDraco.once('destroy', () => {
            events.forEach(evt => evt.unbind());
            events.length = 0;
        });
    }
}

export { AssetTasksSettingsPanel };
