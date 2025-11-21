import type { Observer } from '@playcanvas/observer';

import { LegacyButton } from '../../common/ui/button';
import { LegacyLabel } from '../../common/ui/label';
import { LegacyList } from '../../common/ui/list';
import { LegacyListItem } from '../../common/ui/list-item';
import { LegacyPanel } from '../../common/ui/panel';
import { LegacyTextField } from '../../common/ui/text-field';


editor.once('load', () => {
    const legacyScripts = editor.call('settings:project').get('useLegacyScripts');
    const root = editor.call('layout.attributes');

    // get the right path from args
    const pathAt = function (args, index) {
        return args.paths ? args.paths[index] : args.path;
    };

    const historyState = function (item, state) {
        if (item.history !== undefined) {
            if (typeof item.history === 'boolean') {
                item.history = state;
            } else {
                item.history.enabled = state;
            }
        } else {
            if (item._parent && item._parent.history !== undefined) {
                item._parent.history.enabled = state;
            }
        }
    };

    /**
     * Creates an Asset List widget
     *
     * @param args - Widget arguments
     * @param args.link - The observers we are editing
     * @param args.type - The asset type that is selectable from the asset list
     * @param args.filterFn - A custom function that filters assets that can be dragged on the list. The function
     * takes the asset as its only argument.
     */
    editor.method('attributes:addAssetsList', (args: {
        link: Observer[];
        type?: string;
        filterFn?: (asset: Observer) => boolean;
        panel: LegacyPanel;
    }) => {
        const link = args.link;
        const assetType = args.type;
        const assetFilterFn = args.filterFn;
        const panel = args.panel;
        const events = [];
        // index list items by asset id
        let assetIndex = {};

        const panelWidget = new LegacyPanel();
        panelWidget.flex = true;
        panelWidget.class.add('asset-list');

        let isSelectingAssets = false;
        let currentSelection = null;

        // button that enables selection mode
        const btnSelectionMode = new LegacyButton({
            text: 'Add Assets'
        });
        btnSelectionMode.class.add('selection-mode');
        panelWidget.append(btnSelectionMode);

        // panel for buttons
        const panelButtons = new LegacyPanel();
        panelButtons.class.add('buttons');
        panelButtons.flex = true;
        panelButtons.hidden = true;

        // label
        const labelAdd = new LegacyLabel({
            text: 'Add Assets'
        });
        panelButtons.append(labelAdd);

        // add button
        const btnAdd = new LegacyButton({
            text: 'ADD SELECTION'
        });
        btnAdd.disabled = true;
        btnAdd.class.add('add-assets');

        panelButtons.append(btnAdd);

        // done button
        const btnDone = new LegacyButton({
            text: 'DONE'
        });
        btnDone.flexGrow = 1;
        btnDone.class.add('done');
        panelButtons.append(btnDone);

        panelWidget.append(panelButtons);

        btnSelectionMode.on('click', () => {
            isSelectingAssets = true;
            panelButtons.hidden = false;
            btnSelectionMode.hidden = true;

            fieldAssets.parent.style.zIndex = 102;
            dropRef.disabled = true;

            // asset picker
            editor.call('picker:asset', {
                type: assetType,
                multi: true
            });

            // on pick
            let evtPick = editor.on('picker:assets', (assets) => {
                currentSelection = assets.filter((asset) => {
                    if (assetFilterFn) {
                        return assetFilterFn(asset);
                    }

                    if (legacyScripts && asset.get('type') === 'script') {
                        return false;
                    }

                    return true;
                }).map((asset) => {
                    return parseInt(asset.get('id'), 10);
                });

                btnAdd.disabled = !currentSelection.length;
            });

            editor.once('picker:asset:close', () => {
                currentSelection = null;
                isSelectingAssets = false;
                panelButtons.hidden = true;
                btnSelectionMode.hidden = false;
                btnAdd.disabled = true;
                fieldAssets.parent.style.zIndex = '';
                dropRef.disabled = !panel.enabled;

                if (evtPick) {
                    evtPick.unbind();
                    evtPick = null;
                }
            });
        });

        btnDone.on('click', () => {
            editor.call('picker:asset:close');
        });

        // search field
        const fieldFilter = new LegacyTextField();
        fieldFilter.hidden = true;
        fieldFilter.elementInput.setAttribute('placeholder', 'Type to filter');
        fieldFilter.keyChange = true;
        fieldFilter.renderChanges = false;
        panelWidget.append(fieldFilter);

        // assets
        var fieldAssets;
        const fieldAssetsList = new LegacyList();
        fieldAssetsList.class.add('empty');
        fieldAssetsList.flexGrow = 1;

        fieldAssetsList.on('select', (item) => {
            if (!item.asset) {
                return;
            }
            editor.call('selector:set', 'asset', [item.asset]);
        });

        // Adds asset ids to the list
        const addAssets = function (assetIds) {
            const records = [];

            for (let i = 0; i < link.length; i++) {
                const path = pathAt(args, i);

                for (let j = 0; j < assetIds.length; j++) {
                    const assetId = assetIds[j];

                    // check if already in list
                    if (link[i].get(path).indexOf(assetId) !== -1) {
                        continue;
                    }

                    records.push({
                        item: link[i],
                        path: path,
                        value: assetId
                    });

                    historyState(link[i], false);
                    link[i].insert(path, assetId);
                    historyState(link[i], true);
                }
            }

            editor.api.globals.history.add({
                name: pathAt(args, 0),
                combine: false,
                undo: function () {
                    for (let i = 0; i < records.length; i++) {
                        const item = records[i].item.latest();
                        if (!item) {
                            continue;
                        }

                        historyState(item, false);
                        item.removeValue(records[i].path, records[i].value);
                        historyState(item, true);
                    }
                },
                redo: function () {
                    for (let i = 0; i < records.length; i++) {
                        const item = records[i].item.latest();
                        if (!item) {
                            continue;
                        }

                        historyState(item, false);
                        item.insert(records[i].path, records[i].value);
                        historyState(item, true);
                    }
                }
            });
        };

        // Removes asset id from the list
        const removeAsset = function (assetId) {
            const records = [];

            for (let i = 0; i < link.length; i++) {
                const path = pathAt(args, i);
                const ind = link[i].get(path).indexOf(assetId);
                if (ind === -1) {
                    continue;
                }

                records.push({
                    item: link[i],
                    path: path,
                    value: assetId,
                    ind: ind
                });

                historyState(link[i], false);
                link[i].removeValue(path, assetId);
                historyState(link[i], true);
            }

            editor.api.globals.history.add({
                name: pathAt(args, 0),
                combine: false,
                undo: function () {
                    for (let i = 0; i < records.length; i++) {
                        const item = records[i].item.latest();
                        if (!item) {
                            continue;
                        }

                        historyState(item, false);
                        item.insert(records[i].path, records[i].value, records[i].ind);
                        historyState(item, true);
                    }
                },
                redo: function () {
                    for (let i = 0; i < records.length; i++) {
                        const item = records[i].item.latest();
                        if (!item) {
                            continue;
                        }

                        historyState(item, false);
                        item.removeValue(records[i].path, records[i].value);
                        historyState(item, true);
                    }
                }
            });
        };

        // add asset list item to the list
        const addAssetListItem = function (assetId, after) {
            assetId = parseInt(assetId, 10);

            let item = assetIndex[assetId];
            if (item) {
                item.count++;
                item.text = (item.count === link.length ? '' : '* ') + item._assetText;
                return;
            }

            const asset = editor.call('assets:get', assetId);
            let text = assetId;
            if (asset && asset.get('name')) {
                text = asset.get('name');
            } else if (!asset) {
                text += ' (Missing)';
            }

            item = new LegacyListItem({
                text: (link.length === 1) ? text : `* ${text}`
            });
            if (asset) {
                item.class.add(`type-${asset.get('type')}`);
            }
            item.count = 1;
            item.asset = asset;
            item._assetText = text;

            if (after) {
                fieldAssetsList.appendAfter(item, after);
            } else {
                fieldAssetsList.append(item);
            }

            fieldAssetsList.class.remove('empty');
            fieldFilter.hidden = false;

            assetIndex[assetId] = item;

            // remove button
            const btnRemove = new LegacyButton();
            btnRemove.class.add('remove');
            btnRemove.on('click', () => {
                removeAsset(assetId);

            });
            btnRemove.parent = item;
            item.element.appendChild(btnRemove.element);

            item.once('destroy', () => {
                delete assetIndex[assetId];
            });
        };

        // Removes list item for the specified asset id
        const removeAssetListItem = function (assetId) {
            const item = assetIndex[assetId];

            if (!item) {
                return;
            }

            item.count--;

            if (item.count === 0) {
                item.destroy();
                fieldAssets.emit('remove', item);

                if (!fieldAssetsList.element.children.length) {
                    fieldAssetsList.class.add('empty');
                    fieldFilter.hidden = true;
                }

            } else {
                item.text = (item.count === link.length ? '' : '* ') + item._assetText;
            }
        };

        // drop
        var dropRef = editor.call('drop:target', {
            ref: panelWidget,
            type: `asset.${assetType}`,
            filter: function (type, data) {
                // type
                if ((assetType && assetType !== '*' && type !== `asset.${assetType}`) || !type.startsWith('asset') || editor.call('assets:get', parseInt(data.id, 10)).get('source')) {
                    return false;
                }

                // if a custom filter function has
                // been provided then use it now
                if (assetFilterFn) {
                    if (!assetFilterFn(editor.call('assets:get', data.id))) {
                        return false;
                    }
                }

                // overflowed
                const rectA = root.innerElement.getBoundingClientRect();
                const rectB = panelWidget.element.getBoundingClientRect();
                if (rectB.top <= rectA.top || rectB.bottom >= rectA.bottom) {
                    return false;
                }

                // already added
                const id = parseInt(data.id, 10);
                for (let i = 0; i < link.length; i++) {
                    if (link[i].get(pathAt(args, i)).indexOf(id) === -1) {
                        return true;
                    }
                }

                return false;
            },
            drop: function (type, data) {
                if ((assetType && assetType !== '*' && type !== `asset.${assetType}`) || !type.startsWith('asset') || editor.call('assets:get', parseInt(data.id, 10)).get('source')) {
                    return;
                }

                const assetId = parseInt(data.id, 10);
                addAssets([assetId]);
            }
        });
        dropRef.disabled = panel.disabled;
        panel.on('enable', () => {
            if (!isSelectingAssets) {
                dropRef.disabled = false;
            }
        });
        panel.on('disable', () => {
            dropRef.disabled = true;

            // clear list item
            const items = fieldAssetsList.element.children;
            let i = items.length;
            while (i--) {
                if (!items[i].ui || !(items[i].ui instanceof LegacyListItem)) {
                    continue;
                }

                items[i].ui.destroy();
            }

            fieldAssetsList.class.add('empty');
            fieldFilter.hidden = true;

            assetIndex = {};
        });
        fieldAssetsList.on('destroy', () => {
            dropRef.destroy();
        });

        panelWidget.append(fieldAssetsList);

        fieldAssets = editor.call('attributes:addField', {
            parent: panel,
            name: args.name || '',
            type: 'element',
            element: panelWidget,
            reference: args.reference
        });
        fieldAssets.class.add('assets');

        // reference assets
        if (args.reference) {
            editor.call('attributes:reference:attach', args.reference, fieldAssets.parent.innerElement.firstChild.ui);
        }

        // on adding new asset
        btnAdd.on('click', () => {
            if (isSelectingAssets) {
                if (currentSelection) {
                    addAssets(currentSelection);
                    currentSelection = null;
                    editor.call('picker:asset:deselect');
                }
            }
        });

        const createInsertHandler = function (index) {
            const path = pathAt(args, index);
            return link[index].on(`${path}:insert`, function (assetId, ind) {
                let before;
                if (ind === 0) {
                    before = null;
                } else {
                    before = assetIndex[this.get(`${path}.${ind}`)];
                }
                addAssetListItem(assetId, before);
            });
        };

        // list
        for (let i = 0; i < link.length; i++) {
            const assets = link[i].get(pathAt(args, i));
            if (assets) {
                for (let a = 0; a < assets.length; a++) {
                    addAssetListItem(assets[a]);
                }
            }


            events.push(link[i].on(`${pathAt(args, i)}:set`, (assets, assetsOld) => {
                if (!(assets instanceof Array)) {
                    return;
                }

                if (!(assetsOld instanceof Array)) {
                    assetsOld = [];
                }

                for (let a = 0; a < assetsOld.length; a++) {
                    removeAssetListItem(assetsOld[a]);
                }

                for (let a = 0; a < assets.length; a++) {
                    addAssetListItem(assets[a]);
                }
            }));

            events.push(createInsertHandler(i));

            events.push(link[i].on(`${pathAt(args, i)}:remove`, removeAssetListItem));
        }

        const filterAssets = function (filter) {
            let id;

            if (!filter) {
                for (id in assetIndex) {
                    assetIndex[id].hidden = false;
                }
                return;
            }

            const items = [];
            for (id in assetIndex) {
                items.push([assetIndex[id].text, parseInt(id, 10)]);
            }
            const results = editor.call('search:items', items, filter);
            for (id in assetIndex) {
                if (results.indexOf(parseInt(id, 10)) === -1) {
                    assetIndex[id].hidden = true;
                } else {
                    assetIndex[id].hidden = false;
                }
            }
        };

        fieldFilter.on('change', filterAssets);

        fieldAssetsList.once('destroy', () => {
            for (let i = 0; i < events.length; i++) {
                events[i].unbind();
            }

            events.length = 0;
        });

        if (args.canOverrideTemplate && (args.path || args.paths)) {
            editor.call('attributes:registerOverridePath', pathAt(args, 0), fieldAssets.parent.element);
        }

        return fieldAssetsList;
    });
});
