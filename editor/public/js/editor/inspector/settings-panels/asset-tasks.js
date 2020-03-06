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
            label: 'Force legacy model v2',
            type: 'boolean',
            alias: 'asset-tasks:useModelV2',
            path: 'useModelV2'
        },
        {
            observer: 'settings',
            label: 'Ovewrite Models',
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
            this._appendSection('Texture Import Settings', this._attributesInspector.getField('editor.pipeline.searchRelatedAssets'));
            this._appendSection('Model Import Settings', this._attributesInspector.getField('editor.pipeline.textureDefaultToAtlas'));

            // reference
            this._panelTooltip = editor.call('attributes:reference:attach', 'settings:asset-tasks', this.header, this.header.dom);
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
