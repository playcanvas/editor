import type { Observer } from '@playcanvas/observer';

import { toLinkedFieldValue } from '@/common/pcui/compat-utils';

import {
    createAssetInput,
    createButton,
    createCheckbox,
    createCode,
    createColorInput,
    createCurveInput,
    createEntityInput,
    createGradientInput,
    createLabel,
    createNumberInput,
    createPanel,
    createProgress,
    createSelectInput,
    createSliderInput,
    createTextAreaInput,
    createTextInput
} from './attributes-pcui';

editor.once('load', () => {
    const legacyScripts = editor.call('settings:project').get('useLegacyScripts');
    const title = 'INSPECTOR';
    const root = editor.call('layout.attributes');
    root.headerText = title;

    const clearPanel = function () {
        editor.emit('attributes:beforeClear');
        root.clear();
        editor.emit('attributes:clear');
    };

    // clearing
    editor.method('attributes:clear', clearPanel);

    // set header
    editor.method('attributes:header', (text) => {
        root.headerText = text;
    });

    // return root panel
    editor.method('attributes.rootPanel', () => {
        return root;
    });

    // add panel
    editor.method('attributes:addPanel', (args = {}) => {
        // panel
        const panel = createPanel(args.name || '');
        // parent
        (args.parent || root).append(panel);

        // folding
        panel.foldable = args.foldable || args.folded;
        panel.folded = args.folded;

        return panel;
    });

    const historyState = function (item: any, state: boolean) {
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

    // get the right path from args
    const pathAt = function (args: any, index: number) {
        return args.paths ? args.paths[index] : args.path;
    };

    editor.method('attributes:linkField', (args) => {
        args.field._changing = false;
        const events = [];

        if (!(args.link instanceof Array)) {
            args.link = [args.link];
        }

        const update = function () {
            let different = false;
            let values = null;
            let path = pathAt(args, 0);
            let value = args.link[0].has(path) ? args.link[0].get(path) : undefined;
            if (args.type === 'rgb') {
                if (value) {
                    for (let i = 1; i < args.link.length; i++) {
                        path = pathAt(args, i);
                        if (!value.equals(args.link[i].get(path))) {
                            value = null;
                            different = true;
                            break;
                        }
                    }
                }
            } else if (args.type === 'asset') {
                values = args.link.map((link, i) => {
                    const itemPath = pathAt(args, i);
                    return link.has(itemPath) ? link.get(itemPath) || null : null;
                });

                let countUndefined = value === undefined ? 1 : 0;
                for (let i = 1; i < args.link.length; i++) {
                    path = pathAt(args, i);
                    if (!args.link[i].has(path)) {
                        countUndefined++;
                        continue;
                    }

                    const val = args.link[i].get(path);

                    if ((value || 0) !== (args.link[i].get(path) || 0)) {
                        if (value !== undefined) {
                            value = args.enum ? '' : null;
                            different = true;
                            break;
                        }
                    }

                    value = val;
                }

                if (countUndefined && countUndefined !== args.link.length) {
                    args.field.class.add('star');
                } else {
                    args.field.class.remove('star');
                }

                if (different) {
                    args.field.class.add('null');
                } else {
                    args.field.class.remove('null');
                }
            } else if (args.type === 'entity' || !args.type) {
                for (let i = 1; i < args.link.length; i++) {
                    path = pathAt(args, i);
                    if (value !== args.link[i].get(path)) {
                        value = 'various';
                        different = true;
                        break;
                    }
                }
                if (different) {
                    args.field.class.add('null');
                    args.field.text = 'various';
                } else {
                    args.field.class.remove('null');
                }
            } else {
                let valueFound = false;
                for (let i = 0; i < args.link.length; i++) {
                    path = pathAt(args, i);
                    if (!args.link[i].has(path)) {
                        continue;
                    }

                    if (!valueFound) {
                        valueFound = true;
                        value = args.link[i].get(path);
                    } else {
                        const v = args.link[i].get(path);
                        if ((value || 0) !== (v || 0)) {
                            value = args.enum ? '' : null;
                            different = true;
                            break;
                        }
                    }
                }
            }

            args.field._changing = true;
            if (args.type === 'asset' && different) {
                args.field.values = values;
            } else {
                args.field.value = toLinkedFieldValue(args.type, value, different);
            }
            if (args.type === 'entity' && different) {
                args.field.text = 'various';
            }

            if (args.type === 'checkbox') {
                args.field._onLinkChange(value);
            }

            args.field._changing = false;

            if (args.enum) {
                const opt = args.field.optionElements[''];
                if (opt) {
                    opt.style.display = value !== '' ? 'none' : '';
                }
            } else {
                args.field.proxy = value == null ? '...' : null;
            }
        };

        const changeField = function (value: unknown) {
            if (args.field._changing) {
                return;
            }

            if (args.enum) {
                const opt = this.optionElements[''];
                if (opt) {
                    opt.style.display = value !== '' ? 'none' : '';
                }
            } else {
                this.proxy = value === null ? '...' : null;
            }

            if (args.trim) {
                value = typeof value === 'string' ? value.trim() : value;
            }

            if (args.type === 'asset') {
                args.field.class.remove('null');
            }

            const items = [];

            // set link value
            args.field._changing = true;
            if (args.type === 'string' && args.trim) {
                args.field.value = value;
            }

            for (let i = 0; i < args.link.length; i++) {
                const path = pathAt(args, i);
                if (!args.link[i].has(path)) {
                    continue;
                }

                items.push({
                    item: args.link[i],
                    value: args.link[i].has(path) ? args.link[i].get(path) : undefined
                });

                historyState(args.link[i], false);
                args.link[i].set(path, value);
                historyState(args.link[i], true);
            }
            args.field._changing = false;

            // history
            if (args.type !== 'rgb' && !args.slider && !args.stopHistory) {
                editor.api.globals.history.add({
                    name: pathAt(args, 0),
                    combine: false,
                    undo: function () {
                        let different = false;
                        for (let i = 0; i < items.length; i++) {
                            const path = pathAt(args, i);
                            const item = items[i].item.latest();
                            if (!item) {
                                continue;
                            }

                            if (!different && items[0].value !== items[i].value) {
                                different = true;
                            }

                            historyState(item, false);
                            if (items[i].value === undefined) {
                                item.unset(path);
                            } else {
                                item.set(path, items[i].value);
                            }
                            historyState(item, true);
                        }

                        if (different) {
                            args.field.class.add('null');
                        } else {
                            args.field.class.remove('null');
                        }
                    },
                    redo: function () {
                        for (let i = 0; i < items.length; i++) {
                            const path = pathAt(args, i);
                            const item = items[i].item.latest();
                            if (!item) {
                                continue;
                            }

                            historyState(item, false);
                            if (value === undefined) {
                                item.unset(path);
                            } else {
                                item.set(path, value);
                            }
                            item.set(path, value);
                            historyState(item, true);
                        }

                        args.field.class.remove('null');
                    }
                });
            }
        };

        const changeFieldQueue = function () {
            if (args.field._changing) {
                return;
            }

            args.field._changing = true;
            setTimeout(() => {
                args.field._changing = false;
                update();
            }, 0);
        };

        let historyStart, historyEnd;

        if (args.type === 'rgb' || args.slider) {
            historyStart = function () {
                const items = [];

                for (let i = 0; i < args.link.length; i++) {
                    let v = args.link[i].get(pathAt(args, i));
                    if (v instanceof Array) {
                        v = v.slice(0);
                    }

                    items.push({
                        item: args.link[i],
                        value: v
                    });
                }

                return items;
            };

            historyEnd = function (items: { item: Observer; value: unknown }[], value: unknown) {
                // history
                editor.api.globals.history.add({
                    name: pathAt(args, 0),
                    combine: false,
                    undo: function () {
                        for (let i = 0; i < items.length; i++) {
                            const item = items[i].item.latest();
                            if (!item) {
                                continue;
                            }

                            historyState(item, false);
                            item.set(pathAt(args, i), items[i].value);
                            historyState(item, true);
                        }
                    },
                    redo: function () {
                        for (let i = 0; i < items.length; i++) {
                            const item = items[i].item.latest();
                            if (!item) {
                                continue;
                            }

                            historyState(item, false);
                            item.set(pathAt(args, i), value);
                            historyState(item, true);
                        }
                    }
                });
            };
        }

        if (args.type === 'rgb') {
            let colorPickerOn = false;
            events.push(
                args.field.on('click', () => {
                    colorPickerOn = true;

                    let items = [];

                    // picking starts
                    const evtColorPickStart = editor.on('picker:color:start', () => {
                        items = historyStart();
                    });

                    const evtColorPickEnd = editor.on('picker:color:end', () => {
                        historyEnd(items.slice(0), args.field.value);
                    });

                    // picker closed
                    editor.once('picker:color:close', () => {
                        evtColorPickStart.unbind();
                        evtColorPickEnd.unbind();
                        colorPickerOn = false;
                        args.field.element.focus();
                    });
                })
            );

            // close picker if field destroyed
            args.field.once('destroy', () => {
                if (colorPickerOn) {
                    editor.call('picker:color:close');
                }
            });
        } else if (args.slider) {
            let sliderRecords;

            events.push(
                args.field.on('start', () => {
                    sliderRecords = historyStart();
                })
            );

            events.push(
                args.field.on('end', () => {
                    historyEnd(sliderRecords.slice(0), args.field.value);
                })
            );
        }

        update();
        events.push(args.field.on('change', changeField));

        for (let i = 0; i < args.link.length; i++) {
            events.push(args.link[i].on(`${pathAt(args, i)}:set`, changeFieldQueue));
            events.push(args.link[i].on(`${pathAt(args, i)}:unset`, changeFieldQueue));
        }

        events.push(
            args.field.once('destroy', () => {
                for (let i = 0; i < events.length; i++) {
                    events[i].unbind();
                }
            })
        );

        return events;
    });

    // add field
    editor.method('attributes:addField', (args) => {
        let panel = args.panel;

        if (!panel) {
            panel = createPanel();
            panel.flexWrap = 'nowrap';
            panel.WebkitFlexWrap = 'nowrap';
            panel.style.display = '';

            if (args.type) {
                panel.class.add(`field-${args.type}`);
            } else {
                panel.class.add('field');
            }

            (args.parent || root).append(panel);
        }

        let label;
        if (args.name) {
            label = createLabel({
                text: args.name
            });
            label.class.add('label-field');
            panel._label = label;
            panel.append(label);

            if (args.reference) {
                const tooltip = (label._tooltip = editor.call('attributes:reference', {
                    title: args.reference.title,
                    subTitle: args.reference.subTitle,
                    description: args.reference.description
                }));

                tooltip.attach({
                    target: label,
                    element: label.element
                });
            }
        }

        if (args.canOverrideTemplate && args.path) {
            editor.call('attributes:registerOverridePath', args.path, panel.element);
        }

        let field;

        args.linkEvents = [];

        // if we provide multiple paths for a single Observer then turn args.link into an array
        if (args.paths && args.paths instanceof Array && args.link && !(args.link instanceof Array)) {
            const link = args.link;
            args.link = [];
            for (let i = 0; i < args.paths.length; i++) {
                args.link.push(link);
            }
        }

        const linkField = (args.linkField = function () {
            if (args.link) {
                const link = function (field: any, path?: string | string[]) {
                    const data: any = {
                        field: field,
                        type: args.type,
                        slider: args.slider,
                        enum: args.enum,
                        link: args.link,
                        trim: args.trim,
                        name: args.name,
                        stopHistory: args.stopHistory
                    };

                    if (!path) {
                        path = args.paths || args.path;
                    }

                    if (path instanceof Array) {
                        data.paths = path;
                    } else {
                        data.path = path;
                    }

                    args.linkEvents = args.linkEvents.concat(editor.call('attributes:linkField', data));

                    // Give the field a uniquely addressable css class that we can target from Selenium
                    if (field.element && typeof path === 'string') {
                        field.element.classList.add(`field-path-${path.replace(/\./g, '-')}`);
                    }
                };

                if (field instanceof Array) {
                    for (let i = 0; i < field.length; i++) {
                        let paths = args.paths;

                        if (paths) {
                            paths = paths.map((p) => {
                                return `${p}.${i}`;
                            });
                        }

                        link(field[i], paths || `${args.path}.${i}`);
                    }
                } else {
                    link(field);
                }
            }
        });

        args.unlinkField = function () {
            for (let i = 0; i < args.linkEvents.length; i++) {
                args.linkEvents[i].unbind();
            }

            args.linkEvents = [];
        };

        switch (args.type) {
            case 'string':
                if (args.enum) {
                    field = createSelectInput({
                        options: args.enum
                    });
                } else {
                    field = createTextInput();
                }

                field.value = args.value || '';
                field.flexGrow = 1;

                if (args.placeholder) {
                    field.placeholder = args.placeholder;
                }

                linkField();

                panel.append(field);
                break;

            case 'tags': {
                // TODO: why isn't this in a seperate class/file???

                const innerPanel = createPanel();
                const tagType = args.tagType || 'string';

                if (args.enum) {
                    field = createSelectInput({
                        options: args.enum,
                        type: tagType
                    });
                    field.renderChanges = false;
                    field.on('change', (value) => {
                        if (tagType === 'string') {
                            if (!value) {
                                return;
                            }

                            value = value.trim();
                        }

                        addTag(value);
                        field.value = '';
                    });

                    innerPanel.append(field);
                } else {
                    field = createTextInput();
                    field.blurOnEnter = false;
                    field.renderChanges = false;

                    field.element.addEventListener('keydown', (evt) => {
                        if (evt.keyCode !== 13 || !field.value) {
                            return;
                        }

                        addTag(field.value.trim());
                        field.value = '';
                    });

                    innerPanel.append(field);

                    const btnAdd = createButton({
                        text: '&#57632'
                    });
                    btnAdd.flexGrow = 0;
                    btnAdd.on('click', () => {
                        if (!field.value) {
                            return;
                        }

                        addTag(field.value.trim());
                        field.value = '';
                    });
                    innerPanel.append(btnAdd);
                }

                const tagsPanel = createPanel();
                tagsPanel.class.add('tags');
                tagsPanel.flex = true;
                innerPanel.append(tagsPanel);

                let tagItems = {};
                let tagIndex = {};
                let tagList = [];
                let addTag = undefined;
                let removeTag = undefined;
                let insertElement = undefined;

                const onRemoveClick = function () {
                    if (innerPanel.disabled) {
                        return;
                    }

                    removeTag(this.tag);
                };

                removeTag = function (tag: string | number) {
                    if (tagType === 'string' && !tag) {
                        return;
                    }
                    if (tag === null || tag === undefined) {
                        return;
                    }

                    if (!Object.prototype.hasOwnProperty.call(tagIndex, tag)) {
                        return;
                    }

                    const records = [];

                    for (let i = 0; i < args.link.length; i++) {
                        const path = pathAt(args, i);
                        if (args.link[i].get(path).indexOf(tag) === -1) {
                            continue;
                        }

                        records.push({
                            item: args.link[i],
                            path: path,
                            value: tag
                        });

                        historyState(args.link[i], false);
                        args.link[i].removeValue(path, tag);
                        historyState(args.link[i], true);
                    }

                    if (!args.stopHistory) {
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
                                    item.insert(records[i].path, records[i].value);
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
                    }
                };

                addTag = function (tag: string | number) {
                    const records = [];

                    // convert to number if needed
                    if (args.tagType === 'number') {
                        const numeric = parseInt(String(tag), 10);
                        if (isNaN(numeric)) {
                            return;
                        }
                        tag = numeric;
                    }

                    for (let i = 0; i < args.link.length; i++) {
                        const path = pathAt(args, i);
                        if (args.link[i].get(path).indexOf(tag) !== -1) {
                            continue;
                        }

                        records.push({
                            item: args.link[i],
                            path: path,
                            value: tag
                        });

                        historyState(args.link[i], false);
                        args.link[i].insert(path, tag);
                        historyState(args.link[i], true);
                    }

                    if (!args.stopHistory) {
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
                    }
                };

                const onInsert = function (tag: string | number) {
                    if (!Object.prototype.hasOwnProperty.call(tagIndex, tag)) {
                        tagIndex[tag] = 0;
                        tagList.push(tag);
                    }

                    tagIndex[tag]++;
                    insertElement(tag);
                };

                const onRemove = function (tag: string | number) {
                    if (!tagIndex[tag]) {
                        return;
                    }

                    tagIndex[tag]--;

                    if (!tagIndex[tag]) {
                        tagsPanel.innerElement.removeChild(tagItems[tag]);
                        const ind = tagList.indexOf(tag);
                        if (ind !== -1) {
                            tagList.splice(ind, 1);
                        }

                        delete tagItems[tag];
                        delete tagIndex[tag];
                    } else {
                        if (tagIndex[tag] === args.link.length) {
                            tagItems[tag].classList.remove('partial');
                        } else {
                            tagItems[tag].classList.add('partial');
                        }
                    }
                };

                // when tag field is initialized
                const onSet = function (values: (string | number)[], oldValues?: (string | number)[]) {
                    if (oldValues) {
                        for (let i = 0; i < oldValues.length; i++) {
                            onRemove(oldValues[i]);
                        }
                    }

                    for (let i = 0; i < values.length; i++) {
                        const value = values[i];
                        onInsert(value);
                    }
                };

                const sortTags = function () {
                    tagList.sort((a, b) => {
                        if (args.tagToString) {
                            a = args.tagToString(a);
                            b = args.tagToString(b);
                        }

                        if (a > b) {
                            return 1;
                        }
                        if (a < b) {
                            return -1;
                        }
                        return 0;
                    });
                };

                insertElement = function (tag: string | number) {
                    if (!tagItems[tag]) {
                        sortTags();

                        const item = document.createElement('div');
                        tagItems[tag] = item;
                        item.classList.add('tag');
                        const itemText = document.createElement('span');
                        itemText.textContent = args.tagToString ? args.tagToString(tag) : tag;
                        item.appendChild(itemText);

                        // the original tag value before tagToString is called. Useful
                        // if the tag value is an id for example
                        (item as any).originalValue = tag;

                        // attach click handler on text part of the tag - bind the listener
                        // to the tag item so that `this` refers to that tag in the listener
                        if (args.onClickTag) {
                            itemText.addEventListener('click', args.onClickTag.bind(item));
                        }

                        const icon = document.createElement('span');
                        icon.innerHTML = '&#57650;';
                        icon.classList.add('icon');
                        (icon as any).tag = tag;
                        icon.addEventListener('click', onRemoveClick, false);
                        item.appendChild(icon);

                        const ind = tagList.indexOf(tag);
                        if (tagItems[tagList[ind + 1]]) {
                            tagsPanel.appendBefore(item, tagItems[tagList[ind + 1]]);
                        } else {
                            tagsPanel.append(item);
                        }
                    }

                    if (tagIndex[tag] === args.link.length) {
                        tagItems[tag].classList.remove('partial');
                    } else {
                        tagItems[tag].classList.add('partial');
                    }
                };

                if (args.placeholder) {
                    field.placeholder = args.placeholder;
                }

                // list
                args.linkEvents = [];

                args.linkField = function () {
                    if (args.link) {
                        if (!(args.link instanceof Array)) {
                            args.link = [args.link];
                        }

                        for (let i = 0; i < args.link.length; i++) {
                            const path = pathAt(args, i);
                            const tags = args.link[i].get(path);

                            args.linkEvents.push(args.link[i].on(`${path}:set`, onSet));
                            args.linkEvents.push(args.link[i].on(`${path}:insert`, onInsert));
                            args.linkEvents.push(args.link[i].on(`${path}:remove`, onRemove));

                            if (!tags) {
                                continue;
                            }

                            for (let t = 0; t < tags.length; t++) {
                                if (tagType === 'string' && !tags[t]) {
                                    continue;
                                } else if (tags[t] === null || tags[t] === undefined) {
                                    continue;
                                }

                                if (!Object.prototype.hasOwnProperty.call(tagIndex, tags[t])) {
                                    tagIndex[tags[t]] = 0;
                                    tagList.push(tags[t]);
                                }

                                tagIndex[tags[t]]++;
                            }
                        }
                    }

                    sortTags();

                    for (let i = 0; i < tagList.length; i++) {
                        insertElement(tagList[i]);
                    }
                };

                args.unlinkField = function () {
                    for (let i = 0; i < args.linkEvents.length; i++) {
                        args.linkEvents[i].unbind();
                    }

                    args.linkEvents = [];

                    for (const key in tagItems) {
                        tagsPanel.innerElement.removeChild(tagItems[key]);
                    }

                    tagList = [];
                    tagIndex = {};
                    tagItems = {};
                };

                args.linkField();

                panel.once('destroy', args.unlinkField);

                panel.append(innerPanel);
                break;
            }

            case 'text':
                field = createTextAreaInput();

                field.value = args.value || '';
                field.flexGrow = 1;

                if (args.placeholder) {
                    field.placeholder = args.placeholder;
                }

                linkField();

                panel.append(field);
                break;

            case 'number':
                if (args.enum) {
                    field = createSelectInput({
                        options: args.enum,
                        type: 'number'
                    });
                } else if (args.slider) {
                    field = createSliderInput();
                } else {
                    field = createNumberInput();
                }

                field.value = args.value || 0;
                field.flexGrow = 1;

                if (args.allowNull) {
                    field.allowNull = true;
                }

                if (args.placeholder) {
                    field.placeholder = args.placeholder;
                }

                if (args.precision != null) {
                    field.precision = args.precision;
                }

                if (args.step != null) {
                    field.step = args.step;
                }

                if (args.min != null) {
                    field.min = args.min;
                }

                if (args.max != null) {
                    field.max = args.max;
                }

                linkField();

                panel.append(field);
                break;

            case 'checkbox':
                if (args.enum) {
                    field = createSelectInput({
                        options: args.enum,
                        type: 'boolean'
                    });
                    field.flexGrow = 1;
                } else {
                    field = createCheckbox();
                }

                field.value = args.value || 0;
                field.class.add('tick');

                linkField();

                panel.append(field);
                break;

            case 'vec2':
            case 'vec3':
            case 'vec4': {
                const channels = parseInt(args.type[3], 10);
                field = [];

                for (let i = 0; i < channels; i++) {
                    field[i] = createNumberInput();
                    field[i].flexGrow = 1;
                    field[i].style.width = '24px';
                    field[i].value = (args.value && args.value[i]) || 0;
                    panel.append(field[i]);

                    if (args.placeholder) {
                        field[i].placeholder = args.placeholder[i];
                    }

                    if (args.precision != null) {
                        field[i].precision = args.precision;
                    }

                    if (args.step != null) {
                        field[i].step = args.step;
                    }

                    if (args.min != null) {
                        field[i].min = args.min;
                    }

                    if (args.max != null) {
                        field[i].max = args.max;
                    }

                    // if (args.link)
                    //     field[i].link(args.link, args.path + '.' + i);
                }

                linkField();
                break;
            }

            case 'rgb':
                field = createColorInput(args);

                if (args.channels != null) {
                    field.channels = args.channels;
                }

                linkField();
                panel.append(field);
                break;

            case 'asset':
                field = createAssetInput({
                    assets: editor.call('assets:raw'),
                    assetType: args.kind || args.assetType || '*',
                    allowDragDrop: true,
                    validateAssetFn: (asset: Observer) => {
                        if (legacyScripts && asset.get('type') === 'script') {
                            return false;
                        }

                        return args.filterFn ? args.filterFn(asset) : true;
                    },
                    dragEnterFn: args.over,
                    dragLeaveFn: args.leave
                });
                field.flexGrow = 1;
                linkField();
                if (args.value) {
                    field.value = args.value;
                }
                panel.append(field);
                break;

            case 'entity':
                field = createEntityInput({
                    entities: editor.call('entities:raw'),
                    allowDragDrop: true,
                    pickEntityFn: (callback: (resourceId: string | null) => void) => {
                        let evtEntityPick = editor.once('picker:entity', (entity) => {
                            callback(entity ? entity.get('resource_id') : null);
                            evtEntityPick = null;
                        });

                        editor.call('picker:entity', field.value, args.filter || null);

                        editor.once('picker:entity:close', () => {
                            if (evtEntityPick) {
                                evtEntityPick.unbind();
                                evtEntityPick = null;
                            }
                        });
                    }
                });
                field.flexGrow = 1;
                linkField();
                panel.append(field);
                break;

            case 'image':
                panel.flex = false;

                field = new Image();
                field.style.maxWidth = '100%';
                field.style.display = 'block';
                field.src = args.src;

                panel.append(field);
                break;

            case 'progress':
                field = createProgress();
                field.flexGrow = 1;

                panel.append(field);
                break;

            case 'code':
                field = createCode();
                field.flexGrow = 1;

                if (args.value) {
                    field.text = args.value;
                }

                panel.append(field);
                break;

            case 'button':
                field = createButton();
                field.flexGrow = 1;
                field.text = args.text || 'Button';
                panel.append(field);
                break;

            case 'element':
                field = args.element;
                panel.append(field);
                break;

            case 'curveset': {
                field = createCurveInput(args);
                field.flexGrow = 1;
                field.text = args.text || '';

                // Warning: Curve fields do not currently support multiselect
                if (args.link) {
                    let link = args.link;
                    if (args.link instanceof Array) {
                        link = args.link[0];
                    }

                    const path = pathAt(args, 0);

                    field.link(link, args.canRandomize ? [path, `${path}2`] : [path]);
                }

                let curvePickerOn = false;

                const toggleCurvePicker = function () {
                    if (!field.class.contains('disabled') && !curvePickerOn) {
                        editor.call('picker:curve', field.value, args);

                        curvePickerOn = true;

                        // position picker
                        const rectPicker = editor.call('picker:curve:rect');
                        const rectField = field.element.getBoundingClientRect();
                        editor.call('picker:curve:position', rectField.right - rectPicker.width, rectField.bottom);

                        args.keepZoom = false;

                        let combine = false;

                        const evtChangeStart = editor.on('picker:curve:change:start', () => {
                            combine = true;
                        });

                        const evtChangeEnd = editor.on('picker:curve:change:end', () => {
                            combine = false;
                        });

                        const evtPickerChanged = editor.on('picker:curve:change', (paths, values) => {
                            if (!field._link) {
                                return;
                            }

                            const link = field._link;

                            const previous = {
                                paths: [],
                                values: []
                            };

                            let path;
                            for (let i = 0, len = paths.length; i < len; i++) {
                                path = pathAt(args, 0); // always use 0 because we do not support multiselect
                                // use the second curve path if needed
                                if (args.canRandomize && paths[i][0] !== '0') {
                                    path += '2';
                                }

                                path += paths[i].substring(1);

                                previous.paths.push(path);
                                previous.values.push(field._link.get(path));
                            }

                            const undo = function () {
                                const item = link.latest();

                                if (!item) {
                                    return;
                                }

                                args.keepZoom = true;

                                let history = false;
                                if (item.history) {
                                    history = item.history.enabled;
                                    item.history.enabled = false;
                                }

                                for (let i = 0, len = previous.paths.length; i < len; i++) {
                                    item.set(previous.paths[i], previous.values[i]);
                                }

                                if (item.history) {
                                    item.history.enabled = history;
                                }

                                args.keepZoom = false;
                            };

                            const redo = function () {
                                const item = link.latest();

                                if (!item) {
                                    return;
                                }

                                args.keepZoom = true;

                                let history = false;
                                if (item.history) {
                                    history = item.history.enabled;
                                    item.history.enabled = false;
                                }

                                for (let i = 0, len = paths.length; i < len; i++) {
                                    path = pathAt(args, 0); // always use 0 because we do not support multiselect
                                    // use the second curve path if needed
                                    if (args.canRandomize && paths[i][0] !== '0') {
                                        path += '2';
                                    }

                                    path += paths[i].substring(1);

                                    item.set(path, values[i]);
                                }

                                if (item.history) {
                                    item.history.enabled = history;
                                }

                                args.keepZoom = false;
                            };

                            redo();

                            // add custom history event
                            editor.api.globals.history.add({
                                name: `${path}.curves`,
                                combine: combine,
                                undo: undo,
                                redo: redo
                            });
                        });

                        const evtRefreshPicker = field.on('change', (value) => {
                            editor.call('picker:curve:set', value, args);
                        });

                        editor.once('picker:curve:close', () => {
                            evtRefreshPicker.unbind();
                            evtPickerChanged.unbind();
                            evtChangeStart.unbind();
                            evtChangeEnd.unbind();
                            curvePickerOn = false;
                        });
                    }
                };

                // open curve editor on click
                field.on('click', toggleCurvePicker);

                // close picker if field destroyed
                field.on('destroy', () => {
                    if (curvePickerOn) {
                        editor.call('picker:curve:close');
                    }
                });

                panel.append(field);
                break;
            }

            case 'gradient':
                field = createGradientInput(args);
                field.flexGrow = 1;
                field.text = args.text || '';

                linkField();
                panel.append(field);
                break;

            case 'array':
                field = editor.call('attributes:addArrayField', args);
                panel.append(field);

                break;

            default:
                field = createLabel();
                field.flexGrow = 1;
                field.text = args.value || '';
                field.class.add('selectable');

                if (args.placeholder) {
                    field.placeholder = args.placeholder;
                }

                linkField();

                panel.append(field);
                break;
        }

        if (args.className && field?.class) {
            field.class.add(args.className);
        } else if (args.className && field?.classList) {
            field.classList.add(args.className);
        }

        return field;
    });

    let inspectedItems = [];

    editor.on('attributes:clear', () => {
        for (let i = 0; i < inspectedItems.length; i++) {
            inspectedItems[i].unbind();
        }
        inspectedItems = [];
    });

    editor.method('attributes:inspect', (type, item) => {
        clearPanel();

        // clear if destroyed
        inspectedItems.push(
            item.once('destroy', () => {
                editor.call('attributes:clear');
            })
        );

        root.headerText = type;
        editor.emit(`attributes:inspect[${type}]`, [item]);
        editor.emit('attributes:inspect[*]', type, [item]);
    });

    editor.on('selector:change', (type, items) => {
        clearPanel();

        // nothing selected
        if (items.length === 0) {
            const label = createLabel({ text: 'Select anything to Inspect' });
            label.style.display = 'block';
            label.style.textAlign = 'center';
            root.append(label);

            root.headerText = title;

            return;
        }

        // clear if destroyed
        for (let i = 0; i < items.length; i++) {
            inspectedItems.push(
                items[i].once('destroy', () => {
                    editor.call('attributes:clear');
                })
            );
        }

        root.headerText = type;
        editor.emit(`attributes:inspect[${type}]`, items);
        editor.emit('attributes:inspect[*]', type, items);
    });

    editor.emit('selector:change', null, []);
});
