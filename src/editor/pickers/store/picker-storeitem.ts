import { Element, Label, Button, Container, LabelGroup, Progress } from '@playcanvas/pcui';
// @ts-ignore
import filenamify from 'filenamify/browser';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';

import { bytesToHuman } from '../../../common/utils';

hljs.registerLanguage('javascript', javascript);

const sketchfabAuthTitle = 'Sketchfab Login';
const sketchfabAuthMessage = `To import models from Sketchfab, 
you need to log in with a Sketchfab account.

Sketchfab is a 3D modeling platform website to publish, share, 
discover, buy and sell 3D, VR and AR content. 
All Sketchfab models imported to 
PlayCanvas are free to use and are licensed 
under [Creative Commons Attribution](https://creativecommons.org/licenses/by/4.0/).`;
const sketchfabAuthLogin = 'Sign up or log in to Sketchfab';

let storeItemPanel = null;

editor.once('load', () => {
    // GLOBAL VARIABLES

    // used to display storeitem stats
    let storeItem = null;

    let containerPreview = null;
    let itemName = null;
    let storeItemThumb = null;
    let itemData = null;
    let codePreview = null;
    let viewerButton = null;
    let importButton = null;
    let returnButton = null;
    let itemStats = null;
    let licenses = null;

    const isScriptAsset = (asset) => {
        const type = asset.type;
        return type  === 'script';
    };

    const displayStats = (itemStats) => {
        if (storeItem.size !== undefined) {
            itemStats.append(new LabelGroup({
                text: 'Size: ',
                field: new Label({ class: 'data-label', text: bytesToHuman(storeItem.size) })
            }).dom);
        }

        if (storeItem.vertexCount !== undefined) {
            itemStats.append(new LabelGroup({
                text: 'Vertex count: ',
                field: new Label({ class: 'data-label', text: storeItem.vertexCount })
            }).dom);
        }

        if (storeItem.textureCount !== undefined) {
            itemStats.append(new LabelGroup({
                text: 'Texture count: ',
                field: new Label({ class: 'data-label', text: storeItem.textureCount })
            }).dom);
        }

        if (storeItem.animationCount !== undefined) {
            itemStats.append(new LabelGroup({
                text: 'Animation count: ',
                field: new Label({ class: 'data-label', text: storeItem.animationCount })
            }).dom);
        }

        const date = new Date(storeItem?.modified || null);
        itemStats.append(new LabelGroup({
            text: 'Last updated: ',
            field: new Label({ class: 'data-label', text: date.toLocaleDateString() })
        }).dom);

        if (storeItem.views !== undefined) {
            itemStats.append(new LabelGroup({
                text: 'Views: ',
                field: new Label({ class: 'data-label', text: storeItem.views })
            }).dom);
        }

        if (storeItem.downloads !== undefined) {
            itemStats.append(new LabelGroup({
                text: 'Downloads: ',
                field: new Label({ class: 'data-label', text: storeItem.downloads })
            }).dom);
        }
    };

    // Remove script tags from the URL
    function removeScript(url) {
        return url.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }

    function escapeString(str) {
        const escaped = str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '\'': '&#39;',
            '"': '&quot;'
        }[tag]));
        return escaped;
    }

    const buildLicenseHtml = (license) => {
        const licenseData = licenses.find(el => el.id === license.id);
        if (!licenseData) {
            return '<Error>';
        }
        return `License: <a href="${removeScript(licenseData.url)}" target="_blank" rel="noopener noreferrer">${escapeString(licenseData.name)}</a>`;
    };

    const buildAuthorHtml = (license) => {
        return `Author: <a href="${removeScript(license.authorUrl)}" target="_blank" rel="noopener noreferrer">${license.author}</a>`;
    };

    const displayLicense = (containerTabContent) => {
        if (storeItem.license) {
            const elementLicense = new Element({
                class: 'item-license'
            });
            const licenseHtml = storeItem.license.id ? buildLicenseHtml(storeItem.license) : storeItem.license;
            elementLicense.dom.innerHTML = licenseHtml;
            containerTabContent.append(elementLicense);

            if (storeItem.license.author) {
                const elementAuthor = new Element({
                    class: 'item-author-label'
                });
                const authorHtml = buildAuthorHtml(storeItem.license);
                elementAuthor.dom.innerHTML = authorHtml;
                containerTabContent.append(elementAuthor);
            }
        }
    };

    // UI
    const displayDescription = (containerTabContent) => {

        const elementDescription = new Element({
            class: 'item-description'
        });
        elementDescription.dom.innerHTML = storeItem.description;
        containerTabContent.append(elementDescription);
    };

    const displayContent = (containerTabContent) => {

        if (!storeItem.assets || storeItem.assets.length === 0) {
            return;
        }

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
            if (asset.type === 'template') {
                return 'assets-name-template';
            }
            return 'assets-name';
        };

        for (const item of storeItem.assets) {
            const className = getNameClass(item);
            const labelGroup = new LabelGroup({
                text: item.name,
                field: new Label({ class: 'data-label', text: item.size }),
                nativeTooltip: true
            });
            labelGroup.label.class.add(className);
            itemStats.append(labelGroup.dom);
        }
    };

    const displayTags = (containerTabContent) => {

        if (!storeItem.tags || storeItem.tags.length === 0) {
            return;
        }

        const itemStats = new Container({
            class: 'storeitem-assets',
            flex: true
        });
        containerTabContent.append(itemStats);

        for (const item of storeItem.tags) {
            const tagLabel = new Label({ class: 'tag-name', text: item.name });
            tagLabel.on('click', () => {
                editor.call('picker:storeitem:close');
                editor.call('picker:store:search:tags', [item.slug], [item.name]);
            });
            itemStats.append(tagLabel.dom);
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
            labelTags.class.toggle('clicked', false);

            containerTabContent.clear();
            displayDescription(containerTabContent);
            displayLicense(containerTabContent);

            itemStats = new Container({
                class: 'storeitem-stats',
                flex: true
            });
            itemData.append(itemStats);
            displayStats(itemStats);
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
            labelTags.class.toggle('clicked', false);

            containerTabContent.clear();
            if (itemStats) {
                itemData.remove(itemStats);
            }
            displayContent(containerTabContent);
        });
        containerTabs.append(labelContent);

        // tags tab
        const labelTags = new Label({
            text: 'Tags'
        });
        labelTags.on('click', () => {

            // display content
            labelDescription.class.toggle('clicked', false);
            labelContent.class.toggle('clicked', false);
            labelTags.class.toggle('clicked', true);

            containerTabContent.clear();
            if (itemStats) {
                itemData.remove(itemStats);
            }
            displayTags(containerTabContent);
        });
        containerTabs.append(labelTags);

        // display description by default
        descriptionOnClick();
    };

    const isSketchfabItem = (item) => {
        return item.store === 'sketchfab';
    };

    const loginToSketchfab = () => {
        editor.call('picker:messageBox', sketchfabAuthTitle, sketchfabAuthMessage, sketchfabAuthLogin, null, (ok) => {
            if (ok) {
                // visit authorization page
                const redirectUrl = `${config.store.sketchfab.redirectUrl}`;
                const authUrl = `https://sketchfab.com/oauth2/authorize/?response_type=code&client_id=${config.store.sketchfab.clientId}&redirect_uri=${redirectUrl}`;
                window.open(authUrl);
            }
        });
    };

    const displayError = () => {
        editor.call('picker:messageBox', 'Clone error', 'Cloning item failed. Please check the console logs and report the issue.', 'Close', null);
    };

    let progressBar = null;
    let progressLabel = null;
    let progressBarContainer = null;

    // displays or hides the loading bar in the CMS main panel based on parameter
    const toggleProgress = (toggle, progress = 100, label = '') => {
        if (!progressBar) {
            return;
        }

        progressBar.value = progress;
        progressBar.hidden = !toggle;
        if (label !== '') {
            progressLabel.hidden = false;
            progressLabel.text = label;
            progressBarContainer.class.add('progress-container-expand');
        } else {
            progressLabel.hidden = true;
            progressBarContainer.class.remove('progress-container-expand');
        }
    };


    const cloneItem = async () => {

        toggleProgress(true);
        importButton.enabled = false;
        returnButton.enabled = false;

        try {
            const store = await editor.call('picker:store:getStore');
            await store.cloneItem(storeItem);
        } catch (err) {
            // if user is not logged in to sketchfab
            if (err === 'Unauthorized' && isSketchfabItem(storeItem)) {
                loginToSketchfab();
            } else {
                // otherwise show error message
                console.error(err);
                displayError();
            }

            importButton.enabled = editor.call('permissions:write');

        } finally {
            toggleProgress(false);
            returnButton.enabled = true;
        }
    };

    // helper method to check if the storeitem is already cloned
    const itemClonedAlready = (name) => {
        const itemName = filenamify(name);
        const candidates = editor.call('assets:find', (item) => {
            if (item.get('type') === 'folder' && item.get('name') === itemName) {
                return true;
            }
            return false;
        });
        return candidates.length > 0;
    };

    // helper method to refresh storeitem-specific UI components depending on current view
    const refreshUI = async () => {

        if (storeItem) {

            importButton.enabled = editor.call('permissions:write');

            if (viewerButton) {
                viewerButton.hidden = storeItem.viewerUrl === undefined;
            }

            let displayThumbnail = true;

            if (storeItem.assets && storeItem.assets.length && isScriptAsset(storeItem.assets[0])) {
                // download script content
                const result = storeItem.assets[0].id ? await editor.call('store:loadAsset', storeItem.assets[0]) : '';

                // replace \r and \r\n with \n
                const code = result.replace(/\r\n?/g, '\n');

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
                storeItemThumb.src = storeItem.thumbnail;
                if (containerPreview.dom.firstChild !== storeItemThumb) {
                    containerPreview.append(storeItemThumb);
                }
            }

            itemName.text = storeItem.name;
            refreshDataUI();
        }
    };

    const root = editor.call('layout.root');

    const createPanel = () => {

        // main panel
        const panel = new Container({
            class: 'storeitem-root-panel'
        });

        root.append(panel);

        // top panel
        const topPanel = new Container({
            class: 'storeitem-top-panel'
        });
        panel.append(topPanel);

        // progress bar and loading label
        progressBarContainer = new Container({ class: 'progress-container' });
        progressBar = new Progress({
            value: 100,
            class: 'progress',
            hidden: true
        });
        progressLabel = new Label({ text: 'Uploading', hidden: true });
        topPanel.append(progressBarContainer);
        progressBarContainer.append(progressBar);
        progressBarContainer.append(progressLabel);

        // Return button
        returnButton = new Button({
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
        importButton = new Button({
            class: 'import-button',
            icon: 'E228',
            text: 'IMPORT'
        });
        topPanel.append(importButton);

        importButton.on('click', () => {

            // show popup if we think there already exists in the scene
            if (itemClonedAlready(storeItem.name)) {
                editor.call('picker:confirm',
                    'It appears your assets panel already contains this item. Continuing may result in duplicates. Do you want to continue?',
                    () => {
                        cloneItem();
                    },
                    {
                        yesText: 'Yes',
                        noText: 'Cancel'
                    });
            } else {
                cloneItem();
            }
        });

        // viewer button
        viewerButton = new Button({
            class: 'viewer-button',
            icon: 'E188',
            text: 'OPEN VIEWER'
        });
        topPanel.append(viewerButton);

        viewerButton.on('click', () => {
            window.open(storeItem.viewerUrl);
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

        // ESC key should close popup
        const onKeyDown = function (e) {
            if (e.target && /input|textarea/i.test(e.target.tagName)) {
                return;
            }

            if (e.key === 'Escape' && returnButton.enabled) {
                panel.hidden = true;
            }
        };

        // EVENTS

        // handle show
        panel.on('show', () => {
            window.addEventListener('keydown', onKeyDown);

            // editor-blocking picker open
            editor.emit('picker:open', 'storeitem');
        });

        // handle hide
        panel.on('hide', () => {
            // editor-blocking picker closed
            containerPreview.clear();
            storeItem = null;
            editor.emit('picker:close', 'storeitem');
        });

        return panel;
    };

    const loadStoreItem = async function (item) {
        storeItem = await item.load(item);
    };

    // register panel without a menu option
    editor.method('picker:storeitem:registerPanel', (name, title, panel) => {
        // just do the regular registration but hide the menu
        const item = editor.call('picker:storeitem:registerMenu', name, title, panel);
        item.class.add('hidden');
        return item;
    });

    // open popup
    editor.method('picker:storeitem:open', async (storePanel, option, item) => {

        toggleProgress(false);

        if (!storeItemPanel) {
            storeItemPanel = createPanel();
            storePanel.append(storeItemPanel);
            licenses = await editor.call('picker:store:licenses');
        } else {
            storeItemPanel.hidden = false;
        }

        // create script asset in source branch and dest
        await loadStoreItem(item);

        // data is downloaded, refresh the panel
        refreshUI();
    });

    // close popup
    editor.method('picker:storeitem:close', () => {
        if (storeItemPanel) {
            storeItemPanel.hidden = true;
        }
    });

    // close popup
    editor.method('picker:storeitem:opened', () => {
        return storeItemPanel && storeItemPanel.hidden === false;
    });
});
