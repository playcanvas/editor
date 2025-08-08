import { Element, Container, LabelGroup, Panel, Button, ArrayInput, BindingTwoWay } from '@playcanvas/pcui';

import { AssetInput } from '../../common/pcui/element/element-asset-input.ts';
import { tooltip, tooltipRefItem } from '../../common/tooltips.ts';
import { LegacyTooltip } from '../../common/ui/tooltip.ts';
import '../storage/clipboard-context-menu.ts';

const isEnabledAttribute = ({ label, type }) => label === 'enabled' && type === 'boolean';

/**
 * @import { Attribute } from './attribute.type.d.ts'
 * @import { Tooltip } from '../../common/pcui/element/element-tooltip.js'
 * @import { TemplateOverrideInspector } from '../templates/templates-override-inspector.js'
 */

const CLASS_ROOT = 'pcui-inspector';

class AttributesInspector extends Container {
    /**
     * @type {TemplateOverrideInspector}
     */
    _templateOverridesInspector;

    _clipboardTypes: Set<string> | null;

    constructor(args) {
        args = Object.assign({
            flex: true
        }, args);

        super(args);

        this.class.add(CLASS_ROOT);

        this._observers = null;

        this._history = args.history;
        this._assets = args.assets;
        this._entities = args.entities;
        this._settings = args.settings;
        this._projectSettings = args.projectSettings;
        this._userSettings = args.userSettings;
        this._sceneSettings = args.sceneSettings;
        this._sessionSettings = args.sessionSettings;

        this._fields = {};
        this._fieldAttributes = {};

        this._templateOverridesInspector = args.templateOverridesInspector;

        this._suspendChangeEvt = false;
        this._onAttributeChangeHandler = this._onAttributeChange.bind(this);

        this._clipboardTypes = editor.call('clipboard:types') ?? null;

        // entity attributes
        args.attributes.forEach((attr) => {
            this.addAttribute(attr);
        });
    }

    /**
     * @param {Attribute} attr - Attribute data
     * @returns {string | null} - Key for the field
     */
    _getFieldKey(attr) {
        if (attr.path) {
            return attr.path;
        }
        if (attr.alias) {
            return attr.alias;
        }
        if (attr.paths) {
            return attr.paths[0];
        }

        return null;
    }

    _createTooltipGroup(target, tooltipData) {
        let actualTarget = target;
        if (target instanceof LabelGroup) {
            actualTarget = target.label;
        } else if (target instanceof AssetInput) {
            actualTarget = target._label;
        }

        const group = new Container({
            class: 'tooltip-group'
        });
        tooltip().attach({
            container: group,
            target: actualTarget,
            horzAlignEl: this
        });

        if (tooltipData) {
            group.append(tooltipRefItem({
                reference: tooltipData
            }));
        }

        return group;
    }

    _onAttributeChange() {
        if (!this._suspendChangeEvt && this._events.change) {
            this.emit('change', this.value);
        }
    }

    /**
     * Creates a field for the given attribute
     * @param {Attribute} attr - The attribute data
     * @returns {Element} - The created field
     */
    createFieldForAttribute(attr) {
        const fieldArgs = Object.assign({
            binding: new BindingTwoWay({
                history: this._history
            }),
            assets: this._assets,
            entities: this._entities,
            projectSettings: this._projectSettings
        }, attr.args);

        const field = Element.create(attr.type, fieldArgs);
        let evtChange = field.on('change', this._onAttributeChangeHandler);
        field.once('destroy', () => {
            if (!evtChange) {
                return;
            }
            evtChange.unbind();
            evtChange = null;
        });

        // if clipboard types are available
        if (this._clipboardTypes) {
            // check if attribute has type and path and is of known type
            if (attr.type && attr.path && this._clipboardTypes.has(attr.type)) {
                // once the field is parented
                field.once('parent', (parent) => {
                    let target = field;

                    // if part of a label group, provide copying for the whole element
                    if (parent instanceof LabelGroup) {
                        target = parent;
                    }

                    // modify type based on various rules
                    let type = attr.type;

                    if (type === 'select') {
                        type = attr.args.type;
                    }
                    if (type === 'assets') {
                        type = 'array:asset';
                    }
                    if (type === 'slider') {
                        type = 'number';
                    }
                    if ((type === 'asset' || type === 'array:asset') && attr.args?.assetType) {
                        type += `:${attr.args.assetType}`;
                    }

                    // try to bring context menu
                    const onContextMenu = (evt) => {
                        // do not interfere with inputs and buttons
                        if (evt.target.tagName === 'BUTTON' ||
                            evt.target.tagName === 'INPUT') {

                            return;
                        }

                        // supress default context menu
                        evt.stopPropagation();
                        evt.preventDefault();

                        // call context menu
                        editor.call('clipboard:contextmenu:open', evt.clientX + 1, evt.clientY, attr.path, type, target.dom);
                    };

                    let element = target.dom;
                    element.addEventListener('contextmenu', onContextMenu);

                    // clean up on field destroy
                    field.once('destroy', () => {
                        element.removeEventListener('contextmenu', onContextMenu);
                        element = null;
                    });

                    if (((target instanceof LabelGroup) || (target instanceof AssetInput)) && type !== 'label') {
                        target.label.dom.style.position = 'relative';

                        // paste button
                        const btnPaste = new Button({
                            icon: 'E353',
                            enabled: false,
                            class: 'pcui-clipboard-button'
                        });
                        target.label.dom.appendChild(btnPaste.dom);

                        btnPaste.on('click', () => {
                            const pasted = editor.call('clipboard:paste', attr.path, type);
                            if (pasted) {
                                editor.call('clipboard:flashElement', target.dom);
                            }
                        });

                        // copy button
                        const btnCopy = new Button({
                            icon: 'E126',
                            enabled: false,
                            class: ['pcui-clipboard-button', 'pcui-clipboard-button-copy']
                        });
                        target.label.dom.appendChild(btnCopy.dom);

                        // when copy button clicked
                        btnCopy.on('click', () => {
                            const copied = editor.call('clipboard:copy', attr.path, type);
                            if (!copied) {
                                btnCopy.enabled = false;
                                btnPaste.enabled = false;
                            } else {
                                // toggle paste button
                                btnPaste.enabled = editor.call('clipboard:validPaste', attr.path, type);
                                editor.call('clipboard:flashElement', target.dom);
                            }
                        });

                        // tooltip on hover for copy
                        const tooltipCopy = LegacyTooltip.attach({
                            target: btnCopy.dom,
                            text: 'Copy',
                            align: 'bottom',
                            root: editor.call('layout.root')
                        });

                        // tooltip on hover for paste
                        const tooltipPaste = LegacyTooltip.attach({
                            target: btnPaste.dom,
                            text: 'Paste',
                            align: 'bottom',
                            root: editor.call('layout.root')
                        });

                        // enabled/disable buttons when hovering on field
                        target.on('hover', () => {
                            const canCopy = editor.call('clipboard:validCopy', attr.path, type);
                            if (!canCopy) {
                                btnCopy.hidden = true;
                                btnPaste.hidden = true;
                            } else {
                                btnCopy.hidden = false;
                                btnPaste.hidden = false;
                                btnCopy.enabled = true;
                                btnPaste.enabled = editor.call('clipboard:validPaste', attr.path, type);

                                const humanReadableType = editor.call('clipboard:typeToHuman', type);
                                tooltipCopy.text = `Copy ${humanReadableType}`;

                                const clipboardType = editor.call('clipboard:typeToHuman', editor.call('clipboard:type'));
                                tooltipPaste.text = `Paste${clipboardType ? ` ${clipboardType}` : ''}`;
                                tooltipPaste.innerElement.classList.toggle('pcui-tooltip-disabled', !btnPaste.enabled);
                            }
                        });
                    }

                    // TODO:
                    // extra rule for array of assets, to copy individual assets within the group
                });
            } else if (attr.type && attr.paths) {
                // TODO:
                // implement copy-paste for multi-path fields
            }
        }

        const key = this._getFieldKey(attr);
        if (key) {
            if (this._fields[key]) {
                this._fields[key].destroy();
            }

            this._fields[key] = field;
            if (attr.path || attr.paths) {
                this._fieldAttributes[key] = attr;
                if (this._observers) {
                    this._linkObservers(key);
                }
            }
        }

        return field;
    }

    /**
     * @param {Attribute} attr - Attribute data
     * @param {*} [index] - Index to insert the attribute at
     */
    addAttribute(attr, index) {
        try {

            // If the attribute is a boolean and has an 'enabled' sub-attribute, add a toggle field to the header
            const enabledSubAttribute = attr.args?.attributes?.find(isEnabledAttribute);

            const field = this.createFieldForAttribute(attr);

            /**
             * @type {Container}
             */
            let tooltipGroup;

            if (attr.type !== 'asset' && attr.type !== 'json' && attr.type !== 'array:json') {
                if (attr.label) {
                    const labelGroup = new LabelGroup({
                        text: attr.label,
                        field: field,
                        labelAlignTop: attr.type === 'assets' || attr.type.startsWith('array') || attr.type === 'layers' || attr.type === 'json'
                    });

                    // If the attribute is a boolean named 'enabled' it will be added as as toggle field to the header, so we ignore it here
                    if (!isEnabledAttribute(attr)) {
                        this.append(labelGroup);
                        if (index >= 0) {
                            this.move(labelGroup, index);
                        }
                    }

                    let tooltipData;
                    if (attr.reference) {
                        tooltipData = editor.call('attributes:reference:get', attr.reference);
                    } else if (attr.tooltip) {
                        tooltipData = attr.tooltip;
                    }

                    tooltipGroup = this._createTooltipGroup(labelGroup, tooltipData);
                } else {
                    this.append(field);
                    if (index >= 0) {
                        this.move(field, index);
                    }
                }
            } else if (attr.type === 'asset') {
                field.text = attr.label;
                this.append(field);
                if (index >= 0) {
                    this.move(field, index);
                }

                let tooltipData;
                if (attr.reference) {
                    tooltipData = editor.call('attributes:reference:get', attr.reference);
                } else if (attr.tooltip) {
                    tooltipData = attr.tooltip;
                }
                tooltipGroup = this._createTooltipGroup(field, tooltipData);
            } else {
                const panel = new Panel({
                    headerText: attr.label,
                    collapsible: true,
                    flex: true
                });

                panel.append(field);

                // If this contains a boolean sub-attribute named 'enabled', we create a toggle field and promote it to the panel header
                if (enabledSubAttribute) {
                    enabledSubAttribute.args.type = 'toggle';
                    const enabledField = this.createFieldForAttribute(enabledSubAttribute);

                    const enabledFieldLabelGroup = new LabelGroup({
                        text: enabledSubAttribute.value ? 'Enabled' : 'Disabled',
                        field: enabledField,
                        labelAlignTop: false,
                        class: 'enabled-label-group'
                    });

                    enabledField.on('change', (value) => {
                        enabledFieldLabelGroup.label.text = value ? 'Enabled' : 'Disabled';
                    });

                    panel.header.append(enabledFieldLabelGroup);
                }

                this.append(panel);
                if (index >= 0) {
                    this.move(panel, index);
                }

                let tooltipData;
                if (attr.reference) {
                    tooltipData = editor.call('attributes:reference:get', attr.reference);
                } else if (attr.tooltip) {
                    tooltipData = attr.tooltip;
                }

                tooltipGroup = this._createTooltipGroup(panel.header, tooltipData);
            }

            if (this._templateOverridesInspector) {
                if (attr.path) {
                    const field = this.getField(attr.path);
                    this._templateOverridesInspector.registerElementForPath(attr.path, attr.type === 'asset' ? field : field.parent, tooltipGroup);

                    if (field instanceof ArrayInput) {
                        const pathsIndex = {};

                        // register each array element for template overrides
                        field.on('linkElement', (element, index, path) => {
                            pathsIndex[index] = path;

                            const arrayElementPanel = element.parent;
                            this._templateOverridesInspector.registerElementForPath(path, arrayElementPanel);

                            element.once('destroy', () => {
                                if (pathsIndex[index] === path) {
                                    this._templateOverridesInspector.unregisterElementForPath(path);
                                    delete pathsIndex[index];
                                }
                            });
                        });

                        field.on('unlinkElement', (element, index) => {
                            if (pathsIndex[index]) {
                                this._templateOverridesInspector.unregisterElementForPath(pathsIndex[index]);
                                delete pathsIndex[index];
                            }
                        });
                    }
                } else if (attr.paths) {
                    attr.paths.forEach((path) => {
                        // use first path to get field as subsequent paths
                        // are not going to be used to index the field in the attribute inspector
                        const field = this.getField(attr.paths[0]);
                        this._templateOverridesInspector.registerElementForPath(path, attr.type === 'asset' ? field : field.parent, tooltipGroup);
                    });
                }
            }
        } catch (err) {
            log.error(err);
        }
    }

    removeAttribute(path) {
        if (this._fields[path]) {
            if (this._fields[path] instanceof AssetInput) {
                this._fields[path].destroy();
            } else {
                this._fields[path].parent.destroy();
            }
            delete this._fields[path];
        }

        delete this._fieldAttributes[path];
    }

    moveAttribute(path, index) {
        let field = this._fields[path];
        if (!field) {
            return;
        }

        if (!(field instanceof AssetInput)) {
            field = field.parent;
        }

        this.move(field, index);
    }

    _linkObservers(key) {
        const field = this.getField(key);
        const attr = this._fieldAttributes[key];
        if (attr.observer) {
            const observer = this[`_${attr.observer}`];
            if (observer) {
                field.link([observer], attr.path || attr.paths);
            } else {
                log.error(`This attributes inspector does not contain a valid observer for attr: "${key}". attr.observer is currently: "${attr.observer}".`);
            }
        } else {
            field.link(this._observers, attr.path || attr.paths);
        }
    }

    link(observers) {
        this.unlink();

        this._observers = observers;

        for (const key in this._fieldAttributes) {
            this._linkObservers(key);
        }
    }

    unlink() {
        if (!this._observers) {
            return;
        }

        this._observers = null;

        for (const key in this._fieldAttributes) {
            const field = this.getField(key);
            field.unlink();
        }
    }

    getField(path) {
        return this._fields[path];
    }

    destroy() {
        if (this._destroyed) {
            return;
        }

        if (this._templateOverridesInspector) {
            for (const key in this._fieldAttributes) {
                const attr = this._fieldAttributes[key];
                if (attr.path) {
                    this._templateOverridesInspector.unregisterElementForPath(attr.path);
                } else if (attr.paths) {
                    attr.paths.forEach((path) => {
                        // use first path to get field as subsequent paths
                        // are not going to be used to index the field in the attribute inspector
                        this._templateOverridesInspector.unregisterElementForPath(path);
                    });
                }
            }
        }

        super.destroy();
    }

    set value(value) {
        if (!value) {
            return;
        }

        const suspend = this._suspendChangeEvt;
        this._suspendChangeEvt = false;

        for (const key in this._fields) {
            const parts = key.split('.');
            const valuePath = parts[parts.length - 1];
            if (value.hasOwnProperty(valuePath)) {
                this._fields[key].value = value[valuePath];
            }
        }

        this._suspendChangeEvt = suspend;

        this._onAttributeChange();
    }

    get value() {
        const result = {};
        for (const key in this._fields) {
            const field = this._fields[key];
            const parts = key.split('.');
            result[parts[parts.length - 1]] = field.value;
        }

        return result;
    }

    set values(values) {
        const suspend = this._suspendChangeEvt;
        this._suspendChangeEvt = false;

        for (const key in this._fields) {
            const parts = key.split('.');
            const valuePath = parts[parts.length - 1];
            this._fields[key].values = values.map(val => val[valuePath]);
        }

        this._suspendChangeEvt = suspend;

        this._onAttributeChange();
    }
}

Element.register('json', AttributesInspector, {});

export { AttributesInspector };
