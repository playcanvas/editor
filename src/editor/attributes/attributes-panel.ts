import { CubemapThumbnailRenderer } from '@/common/thumbnail-renderers/cubemap-thumbnail-renderer';
import { FontThumbnailRenderer } from '@/common/thumbnail-renderers/font-thumbnail-renderer';
import { MaterialThumbnailRenderer } from '@/common/thumbnail-renderers/material-thumbnail-renderer';
import { ModelThumbnailRenderer } from '@/common/thumbnail-renderers/model-thumbnail-renderer';
import { SpriteThumbnailRenderer } from '@/common/thumbnail-renderers/sprite-thumbnail-renderer';
import { LegacyButton } from '@/common/ui/button';
import { LegacyCheckbox } from '@/common/ui/checkbox';
import { LegacyCode } from '@/common/ui/code';
import { LegacyColorField } from '@/common/ui/color-field';
import { LegacyCurveField } from '@/common/ui/curve-field';
import { LegacyImageField } from '@/common/ui/image-field';
import { LegacyLabel } from '@/common/ui/label';
import { LegacyNumberField } from '@/common/ui/number-field';
import { LegacyPanel } from '@/common/ui/panel';
import { LegacyProgress } from '@/common/ui/progress';
import { LegacySelectField } from '@/common/ui/select-field';
import { LegacySlider } from '@/common/ui/slider';
import { LegacyTextField } from '@/common/ui/text-field';
import { LegacyTextAreaField } from '@/common/ui/textarea-field';
import { buildQueryUrl } from '@/common/utils';

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
        const panel = new LegacyPanel(args.name || '');
        // parent
        (args.parent || root).append(panel);

        // folding
        panel.foldable = args.foldable || args.folded;
        panel.folded = args.folded;

        return panel;
    });

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

    // get the right path from args
    const pathAt = function (args, index) {
        return args.paths ? args.paths[index] : args.path;
    };

    editor.method('attributes:linkField', (args) => {
        var update, changeField, changeFieldQueue;
        args.field._changing = false;
        const events = [];

        if (!(args.link instanceof Array)) {
            args.link = [args.link];
        }

        update = function () {
            let different = false;
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
                if (value) {
                    value = value.map((v) => {
                        return Math.floor(v * 255);
                    });
                }
            } else if (args.type === 'asset') {
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
                    if (!/^\* /.test(args.field._title.text)) {
                        args.field._title.text = `* ${args.field._title.text}`;
                    }
                } else {
                    args.field.class.remove('star');
                    if (/^\* /.test(args.field._title.text)) {
                        args.field._title.text = args.field._title.text.substring(2);
                    }
                }

                if (different) {
                    args.field.class.add('null');
                    args.field._title.text = 'various';
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
            args.field.value = value;

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

        changeField = function (value) {
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
                value = value.trim();
            }

            if (args.type === 'rgb') {
                value = value.map((v) => {
                    return v / 255;
                });
            } else if (args.type === 'asset') {
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

        changeFieldQueue = function () {
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

            historyEnd = function (items, value) {
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
            events.push(args.field.on('click', () => {
                colorPickerOn = true;

                // set picker color
                editor.call('picker:color', args.field.value);

                let items = [];

                // picking starts
                const evtColorPickStart = editor.on('picker:color:start', () => {
                    items = historyStart();
                });

                // picked color
                const evtColorPick = editor.on('picker:color', (color) => {
                    args.field.value = color;
                });

                const evtColorPickEnd = editor.on('picker:color:end', () => {
                    historyEnd(items.slice(0), args.field.value.map((v) => {
                        return v / 255;
                    }));
                });

                // position picker
                const rectPicker = editor.call('picker:color:rect');
                const rectField = args.field.element.getBoundingClientRect();
                editor.call('picker:color:position', rectField.left - rectPicker.width, rectField.top);

                // color changed, update picker
                const evtColorToPicker = args.field.on('change', function () {
                    editor.call('picker:color:set', this.value);
                });

                // picker closed
                editor.once('picker:color:close', () => {
                    evtColorPick.unbind();
                    evtColorPickStart.unbind();
                    evtColorPickEnd.unbind();
                    evtColorToPicker.unbind();
                    colorPickerOn = false;
                    args.field.element.focus();
                });
            }));

            // close picker if field destroyed
            args.field.once('destroy', () => {
                if (colorPickerOn) {
                    editor.call('picker:color:close');
                }
            });
        } else if (args.slider) {
            let sliderRecords;

            events.push(args.field.on('start', () => {
                sliderRecords = historyStart();
            }));

            events.push(args.field.on('end', () => {
                historyEnd(sliderRecords.slice(0), args.field.value);
            }));
        }

        update();
        events.push(args.field.on('change', changeField));

        for (let i = 0; i < args.link.length; i++) {
            events.push(args.link[i].on(`${pathAt(args, i)}:set`, changeFieldQueue));
            events.push(args.link[i].on(`${pathAt(args, i)}:unset`, changeFieldQueue));
        }

        events.push(args.field.once('destroy', () => {
            for (let i = 0; i < events.length; i++) {
                events[i].unbind();
            }
        }));

        return events;
    });

    // add field
    editor.method('attributes:addField', (args) => {
        let panel = args.panel;

        if (!panel) {
            panel = new LegacyPanel();
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
            label = new LegacyLabel({
                text: args.name
            });
            label.class.add('label-field');
            panel._label = label;
            panel.append(label);

            if (args.reference) {
                const tooltip = label._tooltip = editor.call('attributes:reference', {
                    title: args.reference.title,
                    subTitle: args.reference.subTitle,
                    description: args.reference.description
                });

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

        const linkField = args.linkField = function () {
            if (args.link) {
                const link = function (field, path) {
                    const data = {
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

                        link(field[i], paths || (`${args.path}.${i}`));
                    }
                } else {
                    link(field);
                }
            }
        };

        args.unlinkField = function () {
            for (let i = 0; i < args.linkEvents.length; i++) {
                args.linkEvents[i].unbind();
            }

            args.linkEvents = [];
        };

        switch (args.type) {
            case 'string':
                if (args.enum) {
                    field = new LegacySelectField({
                        options: args.enum
                    });
                } else {
                    field = new LegacyTextField();
                }

                field.value = args.value || '';
                field.flexGrow = 1;

                if (args.placeholder) {
                    field.placeholder = args.placeholder;
                }

                linkField();

                panel.append(field);
                break;

            case 'tags':
                // TODO: why isn't this in a seperate class/file???

                var innerPanel = new LegacyPanel();
                var tagType = args.tagType || 'string';

                if (args.enum) {
                    field = new LegacySelectField({
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
                    field = new LegacyTextField();
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

                    const btnAdd = new LegacyButton({
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


                var tagsPanel = new LegacyPanel();
                tagsPanel.class.add('tags');
                tagsPanel.flex = true;
                innerPanel.append(tagsPanel);

                var tagItems = { };
                var tagIndex = { };
                var tagList = [];

                var onRemoveClick = function () {
                    if (innerPanel.disabled) {
                        return;
                    }

                    removeTag(this.tag);
                };

                var removeTag = function (tag) {
                    if (tagType === 'string' && !tag) {
                        return;
                    }
                    if (tag === null || tag === undefined) {
                        return;
                    }

                    if (!tagIndex.hasOwnProperty(tag)) {
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

                var addTag = function (tag) {
                    const records = [];

                    // convert to number if needed
                    if (args.tagType === 'number') {
                        tag = parseInt(tag, 10);
                        if (isNaN(tag)) {
                            return;
                        }
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

                var onInsert = function (tag) {
                    if (!tagIndex.hasOwnProperty(tag)) {
                        tagIndex[tag] = 0;
                        tagList.push(tag);
                    }

                    tagIndex[tag]++;
                    insertElement(tag);
                };

                var onRemove = function (tag) {
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
                var onSet = function (values, oldValues) {
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

                var sortTags = function () {
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

                var insertElement = function (tag) {
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
                        item.originalValue = tag;

                        // attach click handler on text part of the tag - bind the listener
                        // to the tag item so that `this` refers to that tag in the listener
                        if (args.onClickTag) {
                            itemText.addEventListener('click', args.onClickTag.bind(item));
                        }

                        const icon = document.createElement('span');
                        icon.innerHTML = '&#57650;';
                        icon.classList.add('icon');
                        icon.tag = tag;
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

                                if (!tagIndex.hasOwnProperty(tags[t])) {
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
                    tagIndex = { };
                    tagItems = { };
                };

                args.linkField();

                panel.once('destroy', args.unlinkField);

                panel.append(innerPanel);
                break;

            case 'text':
                field = new LegacyTextAreaField();

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
                    field = new LegacySelectField({
                        options: args.enum,
                        type: 'number'
                    });
                } else if (args.slider) {
                    field = new LegacySlider();
                } else {
                    field = new LegacyNumberField();
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
                    field = new LegacySelectField({
                        options: args.enum,
                        type: 'boolean'
                    });
                    field.flexGrow = 1;
                } else {
                    field = new LegacyCheckbox();
                }

                field.value = args.value || 0;
                field.class.add('tick');

                linkField();

                panel.append(field);
                break;

            case 'vec2':
            case 'vec3':
            case 'vec4':
                var channels = parseInt(args.type[3], 10);
                field = [];

                for (let i = 0; i < channels; i++) {
                    field[i] = new LegacyNumberField();
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

            case 'rgb':
                field = new LegacyColorField();

                if (args.channels != null) {
                    field.channels = args.channels;
                }

                linkField();

                var colorPickerOn = false;
                field.on('click', () => {
                    colorPickerOn = true;

                    // set picker color
                    editor.call('picker:color', field.value);

                    // picking starts
                    const evtColorPickStart = editor.on('picker:color:start', () => {
                    });

                    // picked color
                    const evtColorPick = editor.on('picker:color', (color) => {
                        field.value = color;
                    });

                    // position picker
                    const rectPicker = editor.call('picker:color:rect');
                    const rectField = field.element.getBoundingClientRect();
                    editor.call('picker:color:position', rectField.left - rectPicker.width, rectField.top);

                    // color changed, update picker
                    const evtColorToPicker = field.on('change', function () {
                        editor.call('picker:color:set', this.value);
                    });

                    // picker closed
                    editor.once('picker:color:close', () => {
                        evtColorPick.unbind();
                        evtColorPickStart.unbind();
                        evtColorToPicker.unbind();
                        colorPickerOn = false;
                        field.element.focus();
                    });
                });

                // close picker if field destroyed
                field.on('destroy', () => {
                    if (colorPickerOn) {
                        editor.call('picker:color:close');
                    }
                });

                panel.append(field);
                break;

            case 'asset':
                field = new LegacyImageField({
                    canvas: args.kind === 'material' || args.kind === 'model' || args.kind === 'cubemap' || args.kind === 'font' || args.kind === 'sprite'
                });
                var evtPick;

                if (label) {
                    label.renderChanges = false;
                    field._label = label;

                    label.style.width = '32px';
                    label.flexGrow = 1;
                }


                var panelFields = document.createElement('div');
                panelFields.classList.add('top');

                var panelControls = document.createElement('div');
                panelControls.classList.add('controls');

                var fieldTitle = field._title = new LegacyLabel();
                fieldTitle.text = 'Empty';
                fieldTitle.parent = panel;
                fieldTitle.flexGrow = 1;
                fieldTitle.placeholder = '...';

                var btnEdit = new LegacyButton({
                    text: '&#57648;'
                });
                btnEdit.disabled = true;
                btnEdit.parent = panel;
                btnEdit.flexGrow = 0;

                var btnRemove = new LegacyButton({
                    text: '&#57650;'
                });
                btnRemove.disabled = true;
                btnRemove.parent = panel;
                btnRemove.flexGrow = 0;

                fieldTitle.on('click', () => {
                    const asset = editor.call('assets:get', field.value);
                    editor.call('picker:asset', {
                        type: args.kind,
                        currentAsset: asset
                    });

                    evtPick = editor.once('picker:asset', (asset) => {
                        const oldValues = { };
                        if (args.onSet && args.link && args.link instanceof Array) {
                            for (let i = 0; i < args.link.length; i++) {
                                let id = 0;
                                if (args.link[i]._type === 'asset') {
                                    id = args.link[i].get('id');
                                } else if (args.link[i]._type === 'entity') {
                                    id = args.link[i].get('resource_id');
                                } else {
                                    continue;
                                }

                                oldValues[id] = args.link[i].get(pathAt(args, i));
                            }
                        }

                        field.emit('beforechange', asset.get('id'));
                        field.value = asset.get('id');
                        evtPick = null;
                        if (args.onSet) {
                            args.onSet(asset, oldValues);
                        }
                    });

                    editor.once('picker:asset:close', () => {
                        if (evtPick) {
                            evtPick.unbind();
                            evtPick = null;
                        }
                        field.element.focus();
                    });
                });

                field.on('click', function () {
                    if (!this.value) {
                        return;
                    }

                    const asset = editor.call('assets:get', this.value);
                    if (!asset) {
                        return;
                    }
                    editor.call('selector:set', 'asset', [asset]);

                    if (legacyScripts && asset.get('type') === 'script') {
                        editor.call('assets:panel:currentFolder', 'scripts');
                    } else {
                        const path = asset.get('path');
                        if (path.length) {
                            editor.call('assets:panel:currentFolder', editor.call('assets:get', path[path.length - 1]));
                        } else {
                            editor.call('assets:panel:currentFolder', null);
                        }
                    }
                });
                btnEdit.on('click', () => {
                    field.emit('click');
                });

                btnRemove.on('click', () => {
                    field.emit('beforechange', null);
                    field.value = null;
                });

                var previewRenderer;
                var renderQueued;
                var queueRender;

                var evtThumbnailChange;
                var updateThumbnail = function (empty) {
                    const asset = editor.call('assets:get', field.value);

                    if (previewRenderer) {
                        previewRenderer.destroy();
                        previewRenderer = null;
                    }

                    if (empty) {
                        field.image = '';
                    } else if (!asset) {
                        field.image = `${config.url.home}/editor/scene/img/asset-placeholder-texture.png`;
                    } else {
                        if (asset.has('thumbnails.m')) {
                            const src = asset.get('thumbnails.m');
                            if (src.startsWith('data:image/png;base64')) {
                                field.image = asset.get('thumbnails.m');
                            } else {
                                field.image = buildQueryUrl(config.url.home + asset.get('thumbnails.m'), { t: asset.get('file.hash') });
                            }
                        } else {
                            field.image = `/editor/scene/img/asset-placeholder-${asset.get('type')}.png`;
                        }

                        if (args.kind === 'material') {
                            previewRenderer = new MaterialThumbnailRenderer(asset, field.elementImage);
                        } else if (args.kind === 'model') {
                            previewRenderer = new ModelThumbnailRenderer(asset, field.elementImage);
                        } else if (args.kind === 'cubemap') {
                            previewRenderer = new CubemapThumbnailRenderer(asset, field.elementImage, editor.call('assets:raw'));
                        } else if (args.kind === 'font') {
                            previewRenderer = new FontThumbnailRenderer(asset, field.elementImage);
                        } else if (args.kind === 'sprite') {
                            previewRenderer = new SpriteThumbnailRenderer(asset, field.elementImage, editor.call('assets:raw'));
                        }
                    }

                    if (queueRender) {
                        queueRender();
                    }
                };

                if (args.kind === 'material' || args.kind === 'model' || args.kind === 'font' || args.kind === 'sprite' || args.kind === 'cubemap') {
                    if (args.kind !== 'sprite' && args.kind !== 'cubemap') {
                        field.elementImage.classList.add('flipY');
                    }

                    const renderPreview = function () {
                        renderQueued = false;

                        if (previewRenderer) {
                            // render
                            previewRenderer.render();
                        } else {
                            let ctx = field.elementImage.ctx;
                            if (!ctx) {
                                ctx = field.elementImage.ctx = field.elementImage.getContext('2d');
                            }

                            ctx.clearRect(0, 0, field.elementImage.width, field.elementImage.height);
                        }
                    };

                    renderPreview();

                    queueRender = function () {
                        if (renderQueued) {
                            return;
                        }
                        renderQueued = true;
                        requestAnimationFrame(renderPreview);
                    };

                    field.once('destroy', () => {
                        if (previewRenderer) {
                            previewRenderer.destroy();
                            previewRenderer = null;
                        }
                    });
                }

                linkField();

                var updateField = function () {
                    const value = field.value;

                    fieldTitle.text = field.class.contains('null') ? 'various' : 'Empty';

                    btnEdit.disabled = !value;
                    btnRemove.disabled = !value && !field.class.contains('null');

                    if (evtThumbnailChange) {
                        evtThumbnailChange.unbind();
                        evtThumbnailChange = null;
                    }

                    if (!value) {
                        if (field.class.contains('star')) {
                            fieldTitle.text = `* ${fieldTitle.text}`;
                        }

                        field.empty = true;
                        updateThumbnail(true);

                        return;
                    }

                    field.empty = false;

                    const asset = editor.call('assets:get', value);

                    if (!asset) {
                        return updateThumbnail();
                    }

                    evtThumbnailChange = asset.on('file.hash.m:set', updateThumbnail);
                    updateThumbnail();

                    fieldTitle.text = asset.get('name');

                    if (field.class.contains('star')) {
                        fieldTitle.text = `* ${fieldTitle.text}`;
                    }
                };
                field.on('change', updateField);

                if (args.value) {
                    field.value = args.value;
                }

                updateField();

                var assetDropRef = editor.call('drop:target', {
                    ref: panel,
                    filter: function (type, data) {
                        const rectA = root.innerElement.getBoundingClientRect();
                        const rectB = panel.element.getBoundingClientRect();
                        return data.id && (args.kind === '*' || type === `asset.${args.kind}`) && parseInt(data.id, 10) !== field.value && !editor.call('assets:get', parseInt(data.id, 10)).get('source') && rectB.top > rectA.top && rectB.bottom < rectA.bottom;
                    },
                    drop: function (type, data) {
                        if ((args.kind !== '*' && type !== `asset.${args.kind}`) || editor.call('assets:get', parseInt(data.id, 10)).get('source')) {
                            return;
                        }

                        const oldValues = { };
                        if (args.onSet && args.link && args.link instanceof Array) {
                            for (let i = 0; i < args.link.length; i++) {
                                let id = 0;
                                if (args.link[i]._type === 'asset') {
                                    id = args.link[i].get('id');
                                } else if (args.link[i]._type === 'entity') {
                                    id = args.link[i].get('resource_id');
                                } else {
                                    continue;
                                }

                                oldValues[id] = args.link[i].get(pathAt(args, i));
                            }
                        }

                        field.emit('beforechange', parseInt(data.id, 10));
                        field.value = parseInt(data.id, 10);

                        if (args.onSet) {
                            const asset = editor.call('assets:get', parseInt(data.id, 10));
                            if (asset) {
                                args.onSet(asset, oldValues);
                            }
                        }
                    },
                    over: function (type, data) {
                        if (args.over) {
                            args.over(type, data);
                        }
                    },
                    leave: function () {
                        if (args.leave) {
                            args.leave();
                        }
                    }
                });
                field.on('destroy', () => {
                    assetDropRef.destroy();
                    if (evtThumbnailChange) {
                        evtThumbnailChange.unbind();
                        evtThumbnailChange = null;
                    }
                });

                // thumbnail
                panel.append(field);
                // right side
                panel.append(panelFields);
                // controls
                panelFields.appendChild(panelControls);
                // label
                if (label) {
                    panel.innerElement.removeChild(label.element);
                    panelControls.appendChild(label.element);
                }
                panelControls.classList.remove('label-field');
                // edit
                panelControls.appendChild(btnEdit.element);
                // remove
                panelControls.appendChild(btnRemove.element);

                // title
                panelFields.appendChild(fieldTitle.element);
                break;

            // entity picker
            case 'entity':
                field = new LegacyLabel();
                field.class.add('add-entity');
                field.flexGrow = 1;
                field.class.add('null');

                field.text = 'Select Entity';
                field.placeholder = '...';

                panel.append(field);

                var icon = document.createElement('span');
                icon.classList.add('icon');

                icon.addEventListener('click', (e) => {
                    e.stopPropagation();

                    if (editor.call('permissions:write')) {
                        field.text = '';
                    }
                });

                field.on('change', (value) => {
                    if (value) {
                        const entity = editor.call('entities:get', value);
                        if (!entity) {
                            field.text = null;
                            return;
                        }

                        field.element.innerHTML = entity.get('name');
                        field.element.appendChild(icon);
                        field.placeholder = '';

                        if (value !== 'various') {
                            field.class.remove('null');
                        }
                    } else {
                        field.element.innerHTML = 'Select Entity';
                        field.placeholder = '...';
                        field.class.add('null');
                    }
                });

                linkField();

                var getCurrentEntity = function () {
                    let entity = null;
                    if (args.link) {
                        if (!(args.link instanceof Array)) {
                            args.link = [args.link];
                        }

                        // get initial value only if it's the same for all
                        // links otherwise set it to null
                        for (let i = 0, len = args.link.length; i < len; i++) {
                            const val = args.link[i].get(pathAt(args, i));
                            if (entity !== val) {
                                if (entity) {
                                    entity = null;
                                    break;
                                } else {
                                    entity = val;
                                }
                            }
                        }
                    }

                    return entity;
                };

                field.on('click', () => {
                    var evtEntityPick = editor.once('picker:entity', (entity) => {
                        field.text = entity ? entity.get('resource_id') : null;
                        evtEntityPick = null;
                    });

                    const initialValue = getCurrentEntity();

                    editor.call('picker:entity', initialValue, args.filter || null);

                    editor.once('picker:entity:close', () => {
                        if (evtEntityPick) {
                            evtEntityPick.unbind();
                            evtEntityPick = null;
                        }
                    });
                });

                // highlight on hover
                field.on('hover', () => {
                    const entity = getCurrentEntity();
                    if (!entity) {
                        return;
                    }

                    editor.call('entities:panel:highlight', entity, true);

                    field.once('blur', () => {
                        editor.call('entities:panel:highlight', entity, false);
                    });

                    field.once('click', () => {
                        editor.call('entities:panel:highlight', entity, false);
                    });
                });

                editor.call('drop:target', {
                    ref: field,
                    filter: function (type, data) {
                        const rectA = root.innerElement.getBoundingClientRect();
                        const rectB = field.element.getBoundingClientRect();
                        return type === 'entity' && data.resource_id !== field.value && rectB.top > rectA.top && rectB.bottom < rectA.bottom;
                    },
                    drop: function (type, data) {
                        if (type !== 'entity') {
                            return;
                        }

                        field.value = data.resource_id;
                    },
                    over: function (type, data) {
                        if (args.over) {
                            args.over(type, data);
                        }
                    },
                    leave: function () {
                        if (args.leave) {
                            args.leave();
                        }
                    }
                });


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
                field = new LegacyProgress();
                field.flexGrow = 1;

                panel.append(field);
                break;

            case 'code':
                field = new LegacyCode();
                field.flexGrow = 1;

                if (args.value) {
                    field.text = args.value;
                }

                panel.append(field);
                break;

            case 'button':
                field = new LegacyButton();
                field.flexGrow = 1;
                field.text = args.text || 'Button';
                panel.append(field);
                break;

            case 'element':
                field = args.element;
                panel.append(field);
                break;

            case 'curveset':
                field = new LegacyCurveField(args);
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

                var curvePickerOn = false;

                var toggleCurvePicker = function () {
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

            case 'gradient':
                field = new LegacyCurveField(args);
                field.flexGrow = 1;
                field.text = args.text || '';

                if (args.link) {
                    let link = args.link;
                    if (args.link instanceof Array) {
                        link = args.link[0];
                    }
                    const path = pathAt(args, 0);
                    field.link(link, [path]);
                }

                var gradientPickerVisible = false;

                var toggleGradientPicker = function () {
                    if (!field.class.contains('disabled') && !gradientPickerVisible) {
                        editor.call('picker:gradient', field.value, args);

                        gradientPickerVisible = true;

                        // position picker
                        const rectPicker = editor.call('picker:gradient:rect');
                        const rectField = field.element.getBoundingClientRect();
                        editor.call('picker:gradient:position', rectField.right - rectPicker.width, rectField.bottom);

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
                            for (let i = 0; i < paths.length; i++) {
                                // always use 0 because we do not support multiselect
                                path = pathAt(args, 0) + paths[i].substring(1);
                                previous.paths.push(path);
                                previous.values.push(field._link.get(path));
                            }

                            const undo = function () {
                                const item = link.latest();

                                if (!item) {
                                    return;
                                }

                                let history = false;
                                if (item.history) {
                                    history = item.history.enabled;
                                    item.history.enabled = false;
                                }

                                for (let i = 0; i < previous.paths.length; i++) {
                                    item.set(previous.paths[i], previous.values[i]);
                                }

                                if (item.history) {
                                    item.history.enabled = history;
                                }
                            };

                            const redo = function () {
                                const item = link.latest();

                                if (!item) {
                                    return;
                                }

                                let history = false;
                                if (item.history) {
                                    history = item.history.enabled;
                                    item.history.enabled = false;
                                }

                                for (let i = 0; i < paths.length; i++) {
                                    // always use 0 because we do not support multiselect
                                    path = pathAt(args, 0) + paths[i].substring(1);
                                    item.set(path, values[i]);
                                }

                                if (item.history) {
                                    item.history.enabled = history;
                                }
                            };

                            redo();

                            editor.api.globals.history.add({
                                name: `${path}.curves`,
                                combine: false,
                                undo: undo,
                                redo: redo
                            });
                        });

                        const evtRefreshPicker = field.on('change', (value) => {
                            editor.call('picker:gradient:set', value, args);
                        });

                        editor.once('picker:gradient:close', () => {
                            evtRefreshPicker.unbind();
                            evtPickerChanged.unbind();
                            gradientPickerVisible = false;
                        });
                    }
                };

                // open curve editor on click
                field.on('click', toggleGradientPicker);

                panel.append(field);
                break;

            case 'array':
                field = editor.call('attributes:addArrayField', args);
                panel.append(field);

                break;

            default:
                field = new LegacyLabel();
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

        if (args.className && field instanceof Element) {
            field.class.add(args.className);
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
        inspectedItems.push(item.once('destroy', () => {
            editor.call('attributes:clear');
        }));

        root.headerText = type;
        editor.emit(`attributes:inspect[${type}]`, [item]);
        editor.emit('attributes:inspect[*]', type, [item]);
    });

    editor.on('selector:change', (type, items) => {
        clearPanel();

        // nothing selected
        if (items.length === 0) {
            const label = new LegacyLabel({ text: 'Select anything to Inspect' });
            label.style.display = 'block';
            label.style.textAlign = 'center';
            root.append(label);

            root.headerText = title;

            return;
        }

        // clear if destroyed
        for (let i = 0; i < items.length; i++) {
            inspectedItems.push(items[i].once('destroy', () => {
                editor.call('attributes:clear');
            }));
        }

        root.headerText = type;
        editor.emit(`attributes:inspect[${type}]`, items);
        editor.emit('attributes:inspect[*]', type, items);
    });

    editor.emit('selector:change', null, []);
});
