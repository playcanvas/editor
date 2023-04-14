import { Overlay, Element, Label, Button, Container, Panel, LabelGroup, Progress } from '@playcanvas/pcui';
import { sizeToString } from '../../../common/filesystem-utils';

// highlight.js
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';

hljs.registerLanguage('javascript', javascript);

editor.once('load', function () {
    // GLOBAL VARIABLES

    // used to display storeitem stats
    let storeItem = null;

    let containerPreview = null;
    let itemName = null;
    let storeItemThumb = null;
    let itemData = null;
    let storeItemAssets = [];
    let codePreview = null;

    const EMPTY_THUMBNAIL_IMAGE = 'https://playcanvas.com/static-assets/images/store-default-thumbnail.jpg';

    const isGlbAsset = (asset) => {
        const filename = asset.file.filename;
        return filename && String(filename).match(/\.glb$/) !== null;
    };

    const isTextureAsset = (asset) => {
        const type = asset.type;
        return ['texture', 'textureatlas'].includes(type);
    };

    const isScriptAsset = (asset) => {
        const type = asset.type;
        return type  === 'script';
    };

    // UI
    const displayDescription = (containerTabContent) => {
        const itemStats = new Container({
            class: 'storeitem-stats',
            flex: true
        });
        const elementDescription = new Element({
            class: 'item-description'
        });
        elementDescription.dom.innerHTML = storeItem.description;
        containerTabContent.append(elementDescription);
        containerTabContent.append(itemStats);

        itemStats.append(new LabelGroup({
            text: 'Size: ',
            field: new Label({ class: 'data-label', text: sizeToString(storeItem.size) })
        }).dom);

        const date = new Date(storeItem.modified);
        itemStats.append(new LabelGroup({
            text: 'Last updated: ',
            field: new Label({ class: 'data-label', text: date.toLocaleDateString() })
        }).dom);

        itemStats.append(new LabelGroup({
            text: 'Views: ',
            field: new Label({ class: 'data-label', text: storeItem.views })
        }).dom);

        itemStats.append(new LabelGroup({
            text: 'Downloads: ',
            field: new Label({ class: 'data-label', text: storeItem.downloads })
        }).dom);
    };

    const displayContent = (containerTabContent) => {
        const itemStats = new Container({
            class: 'storeitem-assets',
            flex: true
        });
        containerTabContent.append(itemStats);

        // all asset types font bundle  template cubemap script material animation folder
        const getNameClass = (asset) => {
            if (asset.type === 'textureatlas' || asset.type === 'texture') {
                return 'assets-name-texture';
            }
            if (asset.type === 'scene' || asset.type === 'model') {
                return 'assets-name-3d';
            }
            if (asset.type === 'script') {
                return 'assets-name-script';
            }
            if (asset.type === 'font') {
                return 'assets-name-font';
            }
            return 'assets-name';
        };

        for (const i in storeItemAssets) {
            const item = storeItemAssets[i];
            if (item.file) {
                const containerAssets = new Container({ class: 'assets-row' });
                itemStats.append(containerAssets);
                containerAssets.append(new Label({ class: getNameClass(item), text: item.file.filename }));
                containerAssets.append(new Label({ class: 'assets-size', text: sizeToString(item.file.size) }));
            }
        }
    };

    const refreshDataUI = (root) => {

        // cleanup
        itemData.clear();

        // add actual data
        const containerTabs = new Container({
            class: 'storeitem-tabs'
        });
        itemData.append(containerTabs);

        // add actual data
        const containerTabContent = new Container({
            class: 'storeitem-data-container'
        });
        itemData.append(containerTabContent);

        // description tab
        const labelDescription = new Label({
            text: 'Description'
        });

        const descriptionOnClick = () => {
            // display description
            labelDescription.class.toggle('clicked', true);
            labelContent.class.toggle('clicked', false);
            labelLicense.class.toggle('clicked', false);

            containerTabContent.clear();
            displayDescription(containerTabContent);
        };

        labelDescription.on('click', descriptionOnClick);
        containerTabs.append(labelDescription);

        // content tab
        const labelContent = new Label({
            text: 'Content'
        });
        labelContent.on('click', () => {

            // display content
            labelDescription.class.toggle('clicked', false);
            labelContent.class.toggle('clicked', true);
            labelLicense.class.toggle('clicked', false);

            containerTabContent.clear();
            displayContent(containerTabContent);
        });
        containerTabs.append(labelContent);

        // license tab
        const labelLicense = new Label({
            text: 'License'
        });
        labelLicense.on('click', () => {

            // display license
            labelDescription.class.toggle('clicked', false);
            labelContent.class.toggle('clicked', false);
            labelLicense.class.toggle('clicked', true);

            // display license
            containerTabContent.clear();

            const licenseText = new Element({
                class: 'item-description'
            });
            licenseText.dom.innerHTML = storeItem.license;
            containerTabContent.append(licenseText);
        });

        if (storeItem.license) {
            containerTabs.append(labelLicense);
        }

        // display description by default
        descriptionOnClick();
    };

    // helper method to refresh storeitem-specific UI components depending on current view
    const refreshUI = async () => {

        if (storeItem) {
            let displayThumbnail = true;

            if (storeItemAssets && storeItemAssets.length && isScriptAsset(storeItemAssets[0])) {
                // download script content
                const code = storeItemAssets[0].id ? await editor.call('store:loadAsset', storeItemAssets[0]) : '';

                //  script preview
                codePreview = new Element({
                    class: 'code-preview'
                });
                const html = hljs.highlight(code, { language: 'js' }).value;
                codePreview.dom.innerHTML = `<pre><code class="hljs javascript">${html}</code></pre>`;
                if (containerPreview.dom.firstChild !== codePreview) {
                    containerPreview.append(codePreview);
                }
                displayThumbnail = false;
            }

            if (displayThumbnail) {
                if (storeItem.pictures.length) {
                    const pictures = `${config.url.images}/${config.aws.s3Prefix}files/pictures/`;
                    storeItemThumb.src = pictures + storeItem.pictures[0] + "/1280x720.jpg";
                } else {
                    storeItemThumb.src = EMPTY_THUMBNAIL_IMAGE;
                }
                if (containerPreview.dom.firstChild !== storeItemThumb) {
                    containerPreview.append(storeItemThumb);
                }
            }

            itemName.text = storeItem.name;

            refreshDataUI();
        }
    };

    // overlay
    const overlay = new Overlay({
        clickable: true,
        class: 'picker-storeitem',
        hidden: true
    });

    var root = editor.call('layout.root');
    root.append(overlay);

    // main panel
    const panel = new Panel({
        headerText: 'PLAYCANVAS ASSET STORE',
        class: 'storeitem-root-panel'
    });
    overlay.append(panel);

    // header utils container
    const headerUtils = new Container({
        class: 'header-utils'
    });
    panel.header.append(headerUtils);

    // close button
    const btnClose = new Button({
        class: 'close',
        icon: 'E132'
    });
    btnClose.on('click', function () {
        editor.call('picker:store:cms:close');
        editor.call('picker:storeitem:close');
    });
    headerUtils.append(btnClose);

    // top panel
    const topPanel = new Container({
        class: 'storeitem-top-panel'
    });
    panel.append(topPanel);

    // progress bar and loading label
    const progressBarContainer = new Container({ class: 'progress-container' });
    const progressBar = new Progress({
        value: 100,
        class: 'progress',
        hidden: true
    });
    const progressLabel = new Label({ text: 'Uploading', hidden: true });
    topPanel.append(progressBarContainer);
    progressBarContainer.append(progressBar);
    progressBarContainer.append(progressLabel);

    // Return button
    const returnButton = new Button({
        class: 'return-button',
        icon: 'E182'
    });
    topPanel.append(returnButton);

    returnButton.on('click', () => {
        editor.call('picker:storeitem:close');
    });

    // store item name
    itemName = new Label({
        class: 'storeitem-name'
    });

    topPanel.append(itemName);

    // import button
    const importButton = new Button({
        class: 'import-button',
        icon: 'E228',
        text: 'IMPORT'
    });
    topPanel.append(importButton);

    importButton.on('click', async () => {
        toggleProgress(true);
        await editor.call('store:clone', storeItem.id, storeItem.name, config.project.id);
        toggleProgress(false);
    });

    // viewer button
    const viewerButton = new Button({
        class: 'viewer-button',
        icon: 'E188',
        text: 'OPEN VIEWER'
    });
    topPanel.append(viewerButton);

    viewerButton.on('click', () => {

        // open model viewer with the first asset in the list
        const hostname = window.location.hostname;
        const encodeUrl = (url) => {
            return encodeURIComponent(`https://${hostname}${url}`);
        };

        const modelUrls = [];
        const textureUrls = [];

        storeItemAssets.forEach((asset) => {
            const url = `/api/store/assets/${asset.id}/file/${asset.file.filename}`;
            if (isGlbAsset(asset)) {
                modelUrls.push(encodeUrl(url));
            } else if (isTextureAsset(asset)) {
                textureUrls.push(encodeUrl(url));
            }
        });

        if (modelUrls.length) {
            window.open(`/viewer?load=${modelUrls.join('&load=')}`);
        }

        if (textureUrls.length) {
            window.open(`/texture-tool?load=${textureUrls.join('&load=')}`);
        }
    });

    const bottomPanel = new Container({
        class: 'storeitem-content'
    });
    panel.append(bottomPanel);

    // thumbnail image
    containerPreview = new Container({
        class: 'storeitem-preview'
    });
    bottomPanel.append(containerPreview);

    storeItemThumb = new Image();
    containerPreview.dom.loading = 'lazy';  // lazy loading of images

    // storeitem data
    itemData = new Container({
        class: 'storeitem-data'
    });
    bottomPanel.append(itemData);

    const loadStoreItem = async function (storeItemId) {
        storeItem = [];
        const results = await editor.call('store:loadStoreItem', storeItemId);
        storeItem = results;
    };

    const loadStoreItemAssets = async function (storeItemId) {
        storeItemAssets = [];
        const results = await editor.call('store:assets:list', storeItemId);
        storeItemAssets = results.result;
    };

    // ESC key should close popup
    var onKeyDown = function (e) {
        if (e.target && /(input)|(textarea)/i.test(e.target.tagName))
            return;

        if (e.keyCode === 27 && overlay.clickable) {
            overlay.hidden = true;
        }
    };

    // EVENTS

    // handle show
    overlay.on('show', function () {
        window.addEventListener('keydown', onKeyDown);

        // editor-blocking picker open
        editor.emit('picker:open', 'storeitem');
    });

    // handle hide
    overlay.on('hide', function () {
        // editor-blocking picker closed
        editor.emit('picker:close', 'storeitem');
    });

    // register panel without a menu option
    editor.method('picker:storeitem:registerPanel', function (name, title, panel) {
        // just do the regular registration but hide the menu
        var item = editor.call('picker:storeitem:registerMenu', name, title, panel);
        item.class.add('hidden');
        return item;
    });

    // displays or hides the loading bar in the CMS main panel based on parameter
    const toggleProgress = (toggle, progress = 100, label = "") => {
        progressBar.value = progress;
        progressBar.hidden = !toggle;
        if (label !== "") {
            progressLabel.hidden = false;
            progressLabel.text = label;
            progressBarContainer.class.add('progress-container-expand');
        } else {
            progressLabel.hidden = true;
            progressBarContainer.class.remove('progress-container-expand');
        }
    };

    // open popup
    editor.method('picker:storeitem', async function (option, item) {

        toggleProgress(false);

        // create script asset in source branch and dest
        await Promise.all([
            loadStoreItem(item.id),
            loadStoreItemAssets(item.id)
        ]);

        // data is downloaded, refresh the panel
        refreshUI();

        overlay.hidden = false;
    });

    // close popup
    editor.method('picker:storeitem:close', () => {
        containerPreview.clear();
        storeItemAssets = [];
        storeItem = null;
        overlay.hidden = true;
    });
});
