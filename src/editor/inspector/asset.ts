import { Container, Button, BindingObserversToElement } from '@playcanvas/pcui';


import { AnimationAssetInspectorPreview } from './assets/animation-preview.ts';
import { AnimationAssetInspector } from './assets/animation.ts';
import { AnimstategraphAssetInspector } from './assets/animstategraph.ts';
import { AudioAssetInspector } from './assets/audio.ts';
import { BundleAssetInspector } from './assets/bundle.ts';
import { ContainerAssetInspector } from './assets/container.ts';
import { CssAssetInspector } from './assets/css.ts';
import { CubemapAssetInspectorPreview } from './assets/cubemap-preview.ts';
import { CubemapAssetInspector } from './assets/cubemap.ts';
import { FontAssetInspectorPreview } from './assets/font-preview.ts';
import { FontSourceAssetInspector } from './assets/font-source.ts';
import { FontAssetInspector } from './assets/font.ts';
import { GSplatAssetInspector } from './assets/gsplat.ts';
import { HtmlAssetInspector } from './assets/html.ts';
import { JsonAssetInspector } from './assets/json.ts';
import { MaterialAssetInspectorPreview } from './assets/material-preview.ts';
import { MaterialAssetInspector } from './assets/material.ts';
import { ModelAssetInspectorPreview } from './assets/model-preview.ts';
import { ModelAssetInspector } from './assets/model.ts';
import { RenderAssetInspectorPreview } from './assets/render-preview.ts';
import { RenderAssetInspector } from './assets/render.ts';
import { SceneSourceAssetInspector } from './assets/scene-source.ts';
import { ScriptAssetInspector } from './assets/script.ts';
import { ShaderAssetInspector } from './assets/shader.ts';
import { SpriteAssetInspectorPreview } from './assets/sprite-preview.ts';
import { SpriteAssetInspector } from './assets/sprite.ts';
import { TextAssetInspector } from './assets/text.ts';
import { TextureAssetInspectorPreview } from './assets/texture-preview.ts';
import { TextureSourceAssetInspector } from './assets/texture-source.ts';
import { TextureAssetInspector } from './assets/texture.ts';
import { WasmAssetInspector } from './assets/wasm.ts';
import { AttributesInspector } from './attributes-inspector.ts';
import { bytesToHuman, convertDatetime } from '../../common/utils.ts';
import { LOAD_SCRIPT_AS_ASSET, LOAD_SCRIPT_BEFORE_ENGINE, LOAD_SCRIPT_AFTER_ENGINE } from '../../core/constants.ts';

/**
 * @import { Attribute } from './attribute.type.d.ts'
 */

/** @type {Map<string, new (...args: any[]) => any>} */
const assetInspectors = new Map();
assetInspectors.set('animation', AnimationAssetInspector);
assetInspectors.set('animstategraph', AnimstategraphAssetInspector);
assetInspectors.set('audio', AudioAssetInspector);
assetInspectors.set('bundle', BundleAssetInspector);
assetInspectors.set('container', ContainerAssetInspector);
assetInspectors.set('css', CssAssetInspector);
assetInspectors.set('cubemap', CubemapAssetInspector);
assetInspectors.set('font', FontAssetInspector);
assetInspectors.set('gsplat', GSplatAssetInspector);
assetInspectors.set('html', HtmlAssetInspector);
assetInspectors.set('json', JsonAssetInspector);
assetInspectors.set('material', MaterialAssetInspector);
assetInspectors.set('model', ModelAssetInspector);
assetInspectors.set('render', RenderAssetInspector);
assetInspectors.set('script', ScriptAssetInspector);
assetInspectors.set('shader', ShaderAssetInspector);
assetInspectors.set('sprite', SpriteAssetInspector);
assetInspectors.set('text', TextAssetInspector);
assetInspectors.set('texture', TextureAssetInspector);
assetInspectors.set('textureAtlas', TextureAssetInspector);
assetInspectors.set('wasm', WasmAssetInspector);

/** @type {Map<string, new (...args: any[]) => any>} */
const sourceAssetInspectors = new Map();
sourceAssetInspectors.set('font', FontSourceAssetInspector);
sourceAssetInspectors.set('scene', SceneSourceAssetInspector);
sourceAssetInspectors.set('texture', TextureSourceAssetInspector);

/** @type {Map<string, new (...args: any[]) => any>} */
const assetInspectorPreviews = new Map();
assetInspectorPreviews.set('animation', AnimationAssetInspectorPreview);
assetInspectorPreviews.set('cubemap', CubemapAssetInspectorPreview);
assetInspectorPreviews.set('font', FontAssetInspectorPreview);
assetInspectorPreviews.set('material', MaterialAssetInspectorPreview);
assetInspectorPreviews.set('model', ModelAssetInspectorPreview);
assetInspectorPreviews.set('render', RenderAssetInspectorPreview);
assetInspectorPreviews.set('sprite', SpriteAssetInspectorPreview);
assetInspectorPreviews.set('texture', TextureAssetInspectorPreview);
assetInspectorPreviews.set('textureAtlas', TextureAssetInspectorPreview);

const CLASS_ROOT = 'asset-inspector';

/**
 * @type {Attribute[]}
 */
const ATTRIBUTES = [{
    label: 'ID',
    alias: 'id',
    path: 'id',
    reference: 'asset:id',
    type: 'label',
    args: {
        allowTextSelection: true
    }
}, {
    label: 'Assets',
    path: 'assets',
    type: 'label'
}, {
    label: 'Name',
    path: 'name',
    reference: 'asset:name',
    type: 'string'
}, {
    label: 'Filename',
    path: 'filename',
    type: 'label'
}, {
    label: 'Tags',
    alias: 'tags',
    path: 'tags',
    reference: 'asset:tags',
    type: 'tags',
    args: {
        type: 'string',
        placeholder: 'Add Tags'
    }
}, {
    label: 'Runtime',
    alias: 'source',
    type: 'label',
    reference: 'asset:runtime'
}, {
    label: 'Type',
    alias: 'type',
    reference: 'asset:type',
    type: 'label',
    args: {
        renderChanges: false
    }
}, {
    label: 'Exclude',
    path: 'exclude',
    reference: 'asset:exclude',
    type: 'boolean'
}, {
    label: 'Preload',
    path: 'preload',
    alias: 'preload',
    reference: 'asset:preload',
    type: 'boolean'
}, {
    label: 'Loading Order',
    alias: 'loadingOrder',
    type: 'button',
    reference: 'asset:script:order',
    args: {
        text: 'MANAGE'
    }
}, {
    label: 'Loading Type',
    path: 'data.loadingType',
    type: 'select',
    reference: 'asset:script:loadingType',
    args: {
        type: 'number',
        options: [
            { v: LOAD_SCRIPT_AS_ASSET, t: 'Asset' },
            { v: LOAD_SCRIPT_BEFORE_ENGINE, t: 'Before Engine' },
            { v: LOAD_SCRIPT_AFTER_ENGINE, t: 'After Engine' }
        ]
    }
}, {
    label: 'Size',
    alias: 'size',
    reference: 'asset:size',
    type: 'label',
    args: {
        renderChanges: false
    }
}, {
    label: 'Source',
    alias: 'source_asset_id',
    type: 'label',
    reference: 'asset:source',
    args: {
        renderChanges: false
    }
}, {
    label: 'Created',
    type: 'label',
    path: 'createdAt',
    alias: 'created',
    reference: 'asset:created',
    args: {
        renderChanges: false
    }
}, {
    label: 'License',
    alias: 'license',
    reference: 'asset:license',
    type: 'label',
    args: {
        allowTextSelection: true
    }
}, {
    label: 'Author',
    alias: 'author',
    reference: 'asset:author',
    type: 'label',
    args: {
        allowTextSelection: true
    }
}];

// Hide fields based on current asset type
const HIDDEN_FIELDS = {
    'tags': [
        'folder.source',
        'scene.source',
        'texture.source',
        'font.source',
        'legacyScripts'
    ],
    'source_asset_id': [
        'folder.source',
        'scene.source',
        'texture.source',
        'font.source',
        'legacyScripts'
    ],
    'exclude': [
        'folder.source',
        'scene.source',
        'texture.source',
        'font.source',
        'legacyScripts'
    ],
    'preload': [
        'folder.source',
        'scene.source',
        'texture.source',
        'font.source',
        'legacyScripts'
    ],
    'assets': [
        'single',
        'legacyScripts'
    ],
    'id': [
        'multi',
        'legacyScripts'
    ],
    'size': [
        'folder.source',
        'legacyScripts'
    ],
    'source': [
        'legacyScripts'
    ],
    'name': [
        'multi',
        'legacyScripts'
    ],
    'filename': [
        'notLegacyScripts'
    ],
    // license and author fields are available for source scene assets only for now
    'license': [
        'container',
        'render',
        'folder',
        'folder.source',
        'legacyScripts'
    ],
    'author': [
        'container',
        'render',
        'folder',
        'folder.source',
        'legacyScripts'
    ]
};

const isModelAsset = (asset) => {
    const filename = asset.get('file.filename');
    return (filename && String(filename).match(/\.glb$/) !== null) || (asset.get('type') === 'gsplat');
};

const isTextureAsset = (asset) => {
    const type = asset.get('type');
    return type && ['texture', 'textureatlas'].indexOf(type) !== -1;
};

// handle opening a list of assets
editor.method('assets:open', (assets) => {
    const hostname = window.location.hostname;
    const encodeUrl = (url) => {
        return encodeURIComponent(`https://${hostname}${url}`);
    };

    const modelUrls = [];
    const textureUrls = [];

    assets.forEach((asset) => {
        if (isModelAsset(asset)) {
            modelUrls.push(`load=${encodeUrl(asset.get('file.url'))}`);
        } else if (isTextureAsset(asset)) {
            const isRGBM = !!asset.get('data.rgbm');

            textureUrls.push(`load=${encodeUrl(asset.get('file.url'))}`);
            if (isRGBM) {
                textureUrls.push('type=rgbm');
            }

            const basisUrl = asset.get('file.variants.basis.url');
            if (basisUrl) {
                textureUrls.push(`load=${encodeUrl(basisUrl)}`);
                if (isRGBM) {
                    textureUrls.push('type=rgbm');
                }
            }
        }
    });

    if (modelUrls.length) {
        window.open(`/model-viewer?${modelUrls.join('&')}`);
    }

    if (textureUrls.length) {
        window.open(`/texture-tool?${textureUrls.join('&')}`);
    }
});

class AssetInspector extends Container {
    constructor(args) {
        if (!args) args = {};
        args.flex = true;

        super(args);

        this.args = args;

        this.class.add(CLASS_ROOT);

        this._projectSettings = args.projectSettings;
        this._editableTypes = args.editableTypes;

        this._assetTypes = editor.call('schema:assets:list');
        this._licenseTypes = null;
        this._attributesInspector = new AttributesInspector({
            history: args.history,
            attributes: ATTRIBUTES
        });
        this.append(this._attributesInspector);

        this._containerButtons = new Container({
            flex: true,
            flexDirection: 'row'
        });
        this.append(this._containerButtons);

        // add download button
        this._btnDownloadAsset = new Button({
            text: 'DOWNLOAD',
            icon: 'E228',
            ignoreParent: true
        });
        this._btnDownloadAsset.style.flex = 1;

        this._containerButtons.append(this._btnDownloadAsset);

        this._btnDownloadAsset.on('click', this._onClickDownloadAsset.bind(this));

        // open in viewer button
        this._btnOpenInViewer = new Button({
            text: 'OPEN IN VIEWER',
            icon: 'E117',
            ignoreParent: true
        });
        this._btnOpenInViewer.style.flex = 1;

        this._containerButtons.append(this._btnOpenInViewer);

        this._btnOpenInViewer.on('click', this._onClickOpenInViewer.bind(this));

        // add edit button

        this._btnEditAsset = new Button({
            text: editor.call('permissions:write') ? 'EDIT' : 'VIEW',
            icon: 'E130',
            ignoreParent: true
        });
        this._btnEditAsset.style.flex = 1;
        const evtBtnEditPermissions = editor.on('permissions:writeState', (state) => {
            this._btnEditAsset.text = state ? 'EDIT' : 'VIEW';
        });
        this._btnEditAsset.once('destroy', () => {
            evtBtnEditPermissions.unbind();
        });
        this._btnEditAsset.on('click', this._onClickEditAsset.bind(this));
        this._containerButtons.append(this._btnEditAsset);

        // add edit button
        this._btnEditSprite = new Button({
            text: 'SPRITE EDITOR',
            icon: 'E413'
        });
        this._btnEditSprite.style.flex = 1;
        this._btnEditSprite.on('click', this._onClickEditSprite.bind(this));
        this._containerButtons.append(this._btnEditSprite);

        this._attributesInspector.getField('loadingOrder').on('click', this._onClickLoadingOrder.bind(this));

        // one way binding from observers to element for name field
        // because the other way is handled by calling assets:rename
        this._attributesInspector.getField('name').binding = new BindingObserversToElement({
            history: args.history
        });

        // add typed asset inspectors
        this._typedAssetInspectors = [];
        this._typedAssetPreviews = [];

        this._assetTypes.forEach((assetType) => {
            // check if class exists
            const cls = assetInspectors.get(assetType);
            if (cls) {
                const inspector = new cls({
                    hidden: true,
                    assets: args.assets,
                    entities: args.entities,
                    projectSettings: args.projectSettings,
                    history: args.history,
                    inspectorPanel: args.inspectorPanel,
                    inspectorPanelSecondary: args.inspectorPanelSecondary
                });

                this._typedAssetInspectors[assetType] = inspector;

                this.append(inspector);
            }
            const clsSource = sourceAssetInspectors.get(assetType);
            if (clsSource) {
                const inspector = new clsSource({
                    hidden: true,
                    assets: args.assets,
                    projectSettings: args.projectSettings,
                    history: args.history
                });

                this._typedAssetInspectors[`${assetType}-source`] = inspector;

                this.append(inspector);
            }
            const clsPreview = assetInspectorPreviews.get(assetType);
            if (clsPreview) {
                const inspector = new clsPreview({
                    hidden: true,
                    assets: args.assets,
                    projectSettings: args.projectSettings,
                    history: args.history
                });

                this._typedAssetPreviews[assetType] = inspector;

                this.prepend(inspector);
            }
        });

        this._assetsList = args.assets;
        this._assets = null;
        this._assetEvents = [];
    }

    _onClickDownloadAsset(evt) {
        const legacyScripts = this._projectSettings.get('useLegacyScripts');
        if (this._assets[0].get('type') !== 'folder' && !(legacyScripts && this._assets[0].get('type') === 'script') && this._assets[0].get('type') !== 'sprite') {

            if (this._assets[0].get('source') || this._assets[0].get('type') === 'texture' || this._assets[0].get('type') === 'audio') {
                window.open(this._assets[0].get('file.url'));
            } else {
                window.open(`/api/assets/${this._assets[0].get('id')}/download?branchId=${config.self.branch.id}`);
            }
        }
    }

    _onClickOpenInViewer(evt) {
        editor.call('assets:open', this._assets);
    }

    _onClickEditAsset(evt) {
        editor.call('assets:edit', this._assets[0]);
    }

    _onClickEditSprite(evt) {
        editor.call('picker:sprites', this._assets[0]);
    }

    _onClickSourceAsset(evt) {
        const sourceId = this._assets[0].get('source_asset_id');
        if (!sourceId) {
            return;
        }

        const asset = editor.call('assets:get', sourceId);

        if (!asset) {
            return;
        }

        editor.call('selector:set', 'asset', [asset]);
    }

    _onClickLoadingOrder() {
        editor.call('selector:set', 'editorSettings', [editor.call('settings:projectUser')]);
        setTimeout(() => {
            editor.call('editorSettings:panel:unfold', 'scripts-order');
        }, 0);
    }

    _updateFileSize(assets) {
        if (!this._assets) return;

        const totalSize = this._assets.map((asset) => {
            return asset.has('file.size') ? asset.get('file.size') : 0;
        }).reduce((total, curr) => {
            return total + curr;
        });

        this._attributesInspector.getField('size').values = this._assets.map((asset) => {
            return bytesToHuman(totalSize);
        });
    }

    _updateDates(assets) {
        if (!this._assets) return;

        this._attributesInspector.getField('createdAt').values = this._assets.map((asset) => {
            return asset.get('createdAt') &&  convertDatetime(asset.get('createdAt'));
        });
    }

    _buildLicenseHtml(licenseId) {

        const licenseData = this._licenseTypes.find(el => el.id === licenseId);
        if (!licenseData) {
            return '<Error>';
        }
        return `<a href="${licenseData.url}" target="_blank" rel="noopener noreferrer">${licenseData.name}</a>`;
    }

    _buildAuthorHtml(author, authorUrl) {
        return `<a href="${authorUrl}" target="_blank" rel="noopener noreferrer">${author}</a>`;
    }

    async _updateLicense(assets) {
        if (!this._assets) return;

        if (!this._licenseTypes) {
            this._licenseTypes = await editor.call('picker:store:licenses');
        }

        const licenses = this._assets.map((asset) => {
            return asset.get('license') &&  this._buildLicenseHtml(asset.get('license.id'));
        });

        if (licenses.length > 0) {
            let licenseHtml = licenses[0];
            for (const license of licenses) {
                if (license !== licenses[0]) {
                    licenseHtml = '...';
                    break;
                }
            }

            this._attributesInspector.getField('license').dom.innerHTML = licenseHtml;
        }

        const authors = this._assets.map((asset) => {
            return asset.get('license') &&  this._buildAuthorHtml(asset.get('license.author'), asset.get('license.authorUrl'));
        });

        if (authors.length > 0) {
            let authorHtml = authors[0];
            for (const author of authors) {
                if (author !== authors[0]) {
                    authorHtml = '...';
                    break;
                }
            }

            this._attributesInspector.getField('author').dom.innerHTML  = authorHtml;
        }
    }

    _updateOpenInViewerButton() {
        const allModel = this._assets.every(a => isModelAsset(a));
        const allTexture = !allModel && this._assets.every(a => isTextureAsset(a));
        this._btnOpenInViewer.hidden = !allModel && !allTexture;
    }

    _updateDownloadButton() {
        let disabled = false;
        let hidden = false;

        if (this._assets && this._assets[0].get('type') === 'cubemap') {
            let hasAllCubemapTextures = true;
            this._assets[0].get('data.textures').forEach((texture) => {
                if (texture === null) {
                    hasAllCubemapTextures = false;
                }
            });
            if (!hasAllCubemapTextures) {
                disabled = true;
            }
        }

        if (this._assets) {
            if (this._assets[0].get('type') === 'script' && this._projectSettings.get('useLegacyScripts')) {
                hidden = true;
            } else if (this._assets.length > 1 || ['folder', 'sprite', 'animstategraph', 'render', 'template'].includes(this._assets[0].get('type'))) {
                hidden = true;
            }
        }

        this._btnDownloadAsset.disabled = disabled;
        this._btnDownloadAsset.hidden = hidden;
    }

    updatePreview() {
        Object.keys(this._typedAssetPreviews).forEach((assetPreviewKey) => {
            const assetPreview = this._typedAssetPreviews[assetPreviewKey];
            if (!assetPreview.hidden && typeof assetPreview.updatePreview === 'function') {
                assetPreview.updatePreview();
            }
        });
    }

    _updateAssetName(value) {
        if (!value) return;
        editor.call('assets:rename', this._assets[0], value);
    }

    link(assets) {
        this.unlink();

        if (!assets || !assets.length) return;

        this._assets = assets;

        this._containerButtons.hidden = false;

        const legacyScripts = this._projectSettings.get('useLegacyScripts');

        this._attributesInspector.link(assets);

        this._attributesInspector.getField('source').values = assets.map((asset) => {
            return asset.get('source') ? 'no' : 'yes';
        });
        this._attributesInspector.getField('assets').values = assets.map((asset) => {
            return assets.length;
        });
        this._attributesInspector.getField('type').values = assets.map((asset) => {
            if (asset.get('type') === 'scene') {
                return 'source scene';
            }

            return asset.get('type');
        });
        this._updateFileSize();
        this._updateDates();
        this._updateLicense();

        assets.forEach((asset) => {
            this._assetEvents.push(asset.on('file.size:set', this._updateFileSize.bind(this)));
        });

        this._attributesInspector.getField('source_asset_id').values = assets.map((asset) => {
            const sourceAssetId = asset.get('source_asset_id');
            if (!sourceAssetId) return 'none';

            const sourceAsset = this._assetsList.get(sourceAssetId);
            return sourceAsset ? sourceAsset.get('name') : sourceAssetId;
        });

        this._assetTypes.forEach((assetType) => {
            // check if class exists
            const cls = assetInspectors.get(assetType);
            if (cls) {
                let shouldDisplayTypedInspector = true;
                assets.forEach((asset) => {
                    if (asset.get('type') !== assetType.toLowerCase() || asset.get('source')) {
                        shouldDisplayTypedInspector = false;
                    } else if (assetType === 'script' && legacyScripts) {
                        shouldDisplayTypedInspector = false;
                    }
                });
                if (shouldDisplayTypedInspector) {
                    this._typedAssetInspectors[assetType].link(assets);
                    this._typedAssetInspectors[assetType].hidden = false;
                } else {
                    this._typedAssetInspectors[assetType].hidden = true;
                }
            }
            if (assets.length === 1) {
                const clsSource = sourceAssetInspectors.get(assetType);
                if (clsSource) {
                    let shouldDisplayTypedInspector = true;
                    assets.forEach((asset) => {
                        if (asset.get('type') !== assetType.toLowerCase() || !asset.get('source') || !asset.get('type') === 'scene') {
                            shouldDisplayTypedInspector = false;
                        }
                    });
                    if (shouldDisplayTypedInspector) {
                        this._typedAssetInspectors[`${assetType}-source`].link(assets);
                        this._typedAssetInspectors[`${assetType}-source`].hidden = false;
                    } else {
                        this._typedAssetInspectors[`${assetType}-source`].hidden = true;
                    }
                }
                const clsPreview = assetInspectorPreviews.get(assetType);
                if (clsPreview) {
                    let shouldDisplayTypedInspector = true;
                    assets.forEach((asset) => {
                        if (asset.get('type') !== assetType.toLowerCase() || asset.get('source')) {
                            shouldDisplayTypedInspector = false;
                        }
                    });
                    if (shouldDisplayTypedInspector) {
                        this._typedAssetPreviews[assetType].link(assets);
                        this._typedAssetPreviews[assetType].hidden = false;
                    } else {
                        this._typedAssetPreviews[assetType].hidden = true;
                    }
                }
            }
        });

        // Determine if the Edit/View button should be displayed
        this._btnEditAsset.hidden = assets.length > 1 || !this._editableTypes[assets[0].get('type')];

        // Determine the Download button state
        this._updateDownloadButton();

        // Determine the open in viewer button state
        this._updateOpenInViewerButton();

        if (assets[0].get('type') === 'cubemap') {
            this._updateDownloadButton.bind(this)();
            for (let ind = 0; ind < 6; ind++) {
                this._assetEvents.push(assets[0].on(`data.textures.${ind}:set`, this._updateDownloadButton.bind(this)));
            }
        }

        // Determine if the Edit sprite button should be displayed
        this._btnEditSprite.hidden = assets.length > 1 || !['sprite', 'textureatlas'].includes(assets[0].get('type'));

        Object.keys(HIDDEN_FIELDS).forEach((attribute) => {
            this._toggleAssetField(attribute);
        });
        this._toggleAssetField('loadingOrder');
        this._toggleAssetField('data.loadingType');

        // Set source asset attribute link
        this._assetEvents.push(this._attributesInspector.getField('source_asset_id').on(
            'click',
            this._onClickSourceAsset.bind(this)
        ));
        // Set name in S3 on change
        this._assetEvents.push(this._attributesInspector.getField('name').on(
            'change',
            this._updateAssetName.bind(this)
        ));
        this._attributesInspector.getField('source_asset_id').class.add('pcui-selectable');

        this.hidden = false;
    }

    _toggleAssetField(attribute) {
        const legacyScripts = this._projectSettings.get('useLegacyScripts');

        const hiddenField = HIDDEN_FIELDS[attribute];

        let hiddenForAnyAsset = false;
        this._assets.forEach((asset) => {
            let assetType = asset.get('type');
            if (asset.get('source') === true) {
                assetType += '.source';
            }

            if ((attribute === 'license' || attribute === 'author')  && !asset.get('license')) {
                hiddenForAnyAsset = true;
            }

            if (legacyScripts && hiddenField && hiddenField.includes('legacyScripts') && asset.get('type') === 'script') {
                hiddenForAnyAsset = true;
            }

            if (hiddenField && hiddenField.includes('notLegacyScripts') && (asset.get('type') !== 'script' || !legacyScripts)) {
                hiddenForAnyAsset = true;
            }

            if (hiddenField && hiddenField.includes(assetType)) {
                hiddenForAnyAsset = true;
            } else if (attribute === 'loadingOrder' || attribute === 'data.loadingType') {
                if (assetType !== 'script' || legacyScripts) {
                    hiddenForAnyAsset = true;
                }
            }
        });

        if (hiddenForAnyAsset ||
            (hiddenField && hiddenField.includes('multi') && this._assets.length > 1) ||
            (hiddenField && hiddenField.includes('single') && this._assets.length === 1)
        ) {
            this._attributesInspector.getField(attribute).parent.hidden = true;
        } else {
            this._attributesInspector.getField(attribute).parent.hidden = false;
        }

    }

    unlink() {
        super.unlink();

        if (!this._assets) return;

        this._containerButtons.hidden = true;

        this._assetEvents.forEach(evt => evt.unbind());
        this._assetEvents.length = 0;

        this._assets = null;

        this._attributesInspector.unlink();

        this._assetTypes.forEach((assetType) => {
            const cls = assetInspectors.get(assetType);
            if (cls) {
                this._typedAssetInspectors[assetType].unlink();
                this._typedAssetInspectors[assetType].hidden = true;
            }
            const clsSource = sourceAssetInspectors.get(assetType);
            if (clsSource) {
                this._typedAssetInspectors[`${assetType}-source`].unlink();
                this._typedAssetInspectors[`${assetType}-source`].hidden = true;
            }
            const clsPreview = assetInspectorPreviews.get(assetType);
            if (clsPreview) {
                this._typedAssetPreviews[assetType].unlink();
                this._typedAssetPreviews[assetType].hidden = true;
            }
        });
    }
}

export { AssetInspector };
