Object.assign(pcui, (function () {
    'use strict';

    const CLASS_SELECT_INPUT = 'pcui-select-input';
    const CLASS_SELECT_INPUT_CONTAINER_VALUE = CLASS_SELECT_INPUT + '-container-value';
    const CLASS_MULTI_SELECT = CLASS_SELECT_INPUT + '-multi';
    const CLASS_ALLOW_INPUT = 'pcui-select-input-allow-input';
    const CLASS_VALUE = CLASS_SELECT_INPUT + '-value';
    const CLASS_ICON = CLASS_SELECT_INPUT + '-icon';
    const CLASS_INPUT = CLASS_SELECT_INPUT + '-textinput';
    const CLASS_LIST = CLASS_SELECT_INPUT + '-list';
    const CLASS_TAGS = CLASS_SELECT_INPUT + '-tags';
    const CLASS_TAGS_EMPTY = CLASS_SELECT_INPUT + '-tags-empty';
    const CLASS_TAG = CLASS_SELECT_INPUT + '-tag';
    const CLASS_TAG_NOT_EVERYWHERE = CLASS_SELECT_INPUT + '-tag-not-everywhere';
    const CLASS_SHADOW = CLASS_SELECT_INPUT + '-shadow';
    const CLASS_FIT_HEIGHT = CLASS_SELECT_INPUT + '-fit-height';
    const CLASS_SELECTED = 'pcui-selected';
    const CLASS_HIGHLIGHTED = CLASS_SELECT_INPUT + '-label-highlighted';
    const CLASS_CREATE_NEW = CLASS_SELECT_INPUT + '-create-new';
    const CLASS_OPEN = 'pcui-open';

    const DEFAULT_BOTTOM_OFFSET = 25;


    /**
     * @name pcui.SelectInput
     * @classdesc An input that allows selecting from a dropdown or entering tags.
     * @property {Boolean} renderChanges If true then the input will flash when its value changes.
     * @property {String} placeholder The placeholder text to show next to the current value.
     * @property {Boolean} multiSelect If true then the input value becomes an array allowing the selection of multiple options. Defaults to false.
     * @property {Object[]} options The dropdown options of the input. Contains an array of objects with the following format {v: Any, t: String} where v is the value and t is the text of the option.
     * @property {Any[]} invalidOptions An array of values against which new values are checked before they are created. If a value is in the array it will not be created.
     * @extends pcui.Element
     * @mixes pcui.IBindable
     * @mixes pcui.IFocusable
     */
    class SelectInput extends pcui.Element {
        /**
         * Creates a new SelectInput.
         * @param {Object} args The arguments. Extends the pcui.Element constructor arguments.
         * @param {Boolean} [args.allowNull] If true then null is a valid input value. Defaults to false.
         * @param {Boolean} [args.allowInput] If true then a text field is shown for the user to search for values or enter new ones. Defaults to false.
         * @param {Boolean} [args.allowCreate] If true then the input allows creating new values from the text field. Only used when allowInput is true. Defaults to false.
         * @param {Function} [args.createFn] A function to be executed when the user selects to create a new value. The function takes the new value as a parameter.
         * @param {String} [args.createLabelText] The placeholder text to show when creating a new value. Used when allowInput and allowCreate are both true.
         * @param {String} [args.type] The type of each value. Can be one of 'string', 'number' or 'boolean'.
         */
        constructor(args) {
            if (!args) args = {};

            // main container
            const container = new pcui.Container();
            super(container.dom, args);
            this._container = container;
            this._container.parent = this;

            this.class.add(CLASS_SELECT_INPUT);

            this._containerValue = new pcui.Container({
                class: CLASS_SELECT_INPUT_CONTAINER_VALUE
            });
            this._container.append(this._containerValue);

            // focus / hover shadow element
            this._domShadow = document.createElement('div');
            this._domShadow.classList.add(CLASS_SHADOW);
            this._containerValue.append(this._domShadow);

            this._allowInput = args.allowInput || false;
            if (this._allowInput) {
                this.class.add(CLASS_ALLOW_INPUT);
            }

            this._allowCreate = args.allowCreate || false;
            this._createFn = args.createFn;
            this._createLabelText = args.createLabelText || null;

            // displays current value
            this._labelValue = new pcui.Label({
                class: CLASS_VALUE,
                tabIndex: 0
            });
            this._labelValue.on('click', this._onValueClick.bind(this));
            this._containerValue.append(this._labelValue);

            this._timeoutLabelValueTabIndex = null;

            // dropdown icon
            this._labelIcon = new pcui.Label({
                class: CLASS_ICON,
                hidden: args.allowInput && args.multiSelect
            });
            this._containerValue.append(this._labelIcon);

            // input for searching or adding new entries
            this._input = new pcui.TextInput({
                class: CLASS_INPUT,
                blurOnEnter: false,
                keyChange: true
            });
            this._containerValue.append(this._input);

            this._lastInputValue = '';
            this._suspendInputChange = false;
            this._input.on('change', this._onInputChange.bind(this));
            this._input.on('keydown', this._onInputKeyDown.bind(this));
            this._input.on('focus', this._onFocus.bind(this));
            this._input.on('blur', this._onBlur.bind(this));

            if (args.placeholder) {
                this.placeholder = args.placeholder;
            }

            // dropdown list
            this._containerOptions = new pcui.Container({
                class: CLASS_LIST,
                hidden: true
            });
            this._containerValue.append(this._containerOptions);

            // tags container
            this._containerTags = new pcui.Container({
                class: CLASS_TAGS,
                flex: true,
                flexDirection: 'row',
                hidden: true
            });
            this._container.append(this._containerTags);

            if (args.multiSelect) {
                this.class.add(CLASS_MULTI_SELECT);
                this._containerTags.hidden = false;
            }

            // events
            this._domEvtKeyDown = this._onKeyDown.bind(this);
            this._domEvtFocus = this._onFocus.bind(this);
            this._domEvtBlur = this._onBlur.bind(this);
            this._domEvtMouseDown = this._onMouseDown.bind(this);
            this._domEvtWindowMouseDown = this._onWindowMouseDown.bind(this);
            this._domEvtWheel = this._onWheel.bind(this);

            this._labelValue.dom.addEventListener('keydown', this._domEvtKeyDown);
            this._labelValue.dom.addEventListener('focus', this._domEvtFocus);
            this._labelValue.dom.addEventListener('blur', this._domEvtBlur);
            this._labelValue.dom.addEventListener('mousedown', this._domEvtMouseDown);

            this._containerOptions.dom.addEventListener('wheel', this._domEvtWheel, { passive: true });

            this.on('hide', this.close.bind(this));

            this._type = args.type || 'string';

            this._optionsIndex = {};
            this._labelsIndex = {};
            this._labelHighlighted = null;
            this.invalidOptions = args.invalidOptions;
            this.options = args.options || [];
            this._optionsFn = args.optionsFn;

            this._allowNull = args.allowNull || false;

            this._values = null;

            if (args.value !== undefined) {
                this.value = args.value;
            } else if (args.defaultValue) {
                this.value = args.defaultValue;
            } else {
                this.value = null;
            }

            this.renderChanges = args.renderChanges || false;

            this.on('change', () => {
                this._updateInputFieldsVisibility();

                if (this.renderChanges && !this.multiSelect) {
                    this._labelValue.flash();
                }
            });

            this._updateInputFieldsVisibility(false);
        }

        _initializeCreateLabel() {
            const container = new pcui.Container({
                class: CLASS_CREATE_NEW,
                flex: true,
                flexDirection: 'row'
            });

            const label = new pcui.Label({
                text: this._input.value,
                tabIndex: -1
            });
            container.append(label);

            let evtChange = this._input.on('change', value => {
                // check if label is destroyed
                // during change event
                if (label.destroyed) return;
                label.text = value;
                if (this.invalidOptions && this.invalidOptions.indexOf(value) !== -1) {
                    if (!container.hidden) {
                        container.hidden = true;
                        this._resizeShadow();
                    }
                } else {
                    if (container.hidden) {
                        container.hidden = false;
                        this._resizeShadow();
                    }
                }
            });

            container.on('click', (e) => {
                e.stopPropagation();

                const text = label.text;

                this.focus();
                this.close();

                if (this._createFn) {
                    this._createFn(text);
                } else if (text) {
                    this._onSelectValue(text);
                }
            });

            label.on('destroy', () => {
                evtChange.unbind();
                evtChange = null;
            });

            const labelCreateText = new pcui.Label({
                text: this._createLabelText
            });
            container.append(labelCreateText);

            this._containerOptions.append(container);
        }

        _convertSingleValue(value) {
            if (value === null && this._allowNull) return value;

            if (this._type === 'string') {
                if (!value) {
                    value = '';
                } else {
                    value = value.toString();
                }
            } else if (this._type === 'number') {
                if (!value) {
                    value = 0;
                } else {
                    value = parseInt(value, 10);
                }
            } else if (this._type === 'boolean') {
                return !!value;
            }

            return value;
        }

        _convertValue(value) {
            if (value === null && this._allowNull) return value;

            if (this.multiSelect) {
                if (!Array.isArray(value)) return value;

                return value.map(val => this._convertSingleValue(val));
            }

            return this._convertSingleValue(value);
        }

        // toggle dropdown list
        _onValueClick() {
            if (!this.enabled || this.readOnly) return;

            this.toggle();
        }

        // Update our value with the specified selected option
        _onSelectValue(value) {
            value = this._convertSingleValue(value);

            if (!this.multiSelect) {
                this.value = value;
                return;
            }

            if (this._values) {
                let dirty = false;
                this._values.forEach(arr => {
                    if (!arr) {
                        arr = [value];
                        dirty = true;
                    } else {
                        if (arr.indexOf(value) === -1) {
                            arr.push(value);
                            dirty = true;
                        }
                    }
                });

                if (dirty) {
                    this._onMultipleValuesChange(this._values);

                    this.emit('change', this.value);

                    if (this._binding) {
                        this._binding.addValues([value]);
                    }
                }
            } else {
                if (!this._value || !Array.isArray(this._value)) {
                    this.value = [value];
                } else {
                    if (this._value.indexOf(value) === -1) {
                        this._value.push(value);

                        this._addTag(value);

                        this.emit('change', this.value);

                        if (this._binding) {
                            this._binding.addValues([value]);
                        }
                    }
                }
            }
        }

        _highlightLabel(label) {
            if (this._labelHighlighted === label) return;

            if (this._labelHighlighted) {
                this._labelHighlighted.class.remove(CLASS_HIGHLIGHTED);
            }

            this._labelHighlighted = label;

            if (this._labelHighlighted) {
                this._labelHighlighted.class.add(CLASS_HIGHLIGHTED);

                // scroll into view if necessary
                const labelTop = this._labelHighlighted.dom.offsetTop;
                const scrollTop = this._containerOptions.dom.scrollTop;
                if (labelTop < scrollTop) {
                    this._containerOptions.dom.scrollTop = labelTop;
                } else if (labelTop + this._labelHighlighted.height > this._containerOptions.height + scrollTop) {
                    this._containerOptions.dom.scrollTop = labelTop + this._labelHighlighted.height - this._containerOptions.height;
                }
            }
        }

        // when the value is changed show the correct title
        _onValueChange(value) {
            if (!this.multiSelect) {
                this._labelValue.value = this._optionsIndex[value] || '';

                value = '' + value;
                for (var key in this._labelsIndex) {
                    if (key === value) {
                        this._labelsIndex[key].class.add(CLASS_SELECTED);
                    } else {
                        this._labelsIndex[key].class.remove(CLASS_SELECTED);
                    }
                }
            } else {
                this._labelValue.value = '';
                this._containerTags.clear();
                this._containerTags.class.add(CLASS_TAGS_EMPTY);

                if (value && Array.isArray(value)) {
                    value.forEach(val => {
                        this._addTag(val);
                        if (this._labelsIndex[val]) {
                            this._labelsIndex[val].class.add(CLASS_SELECTED);
                        }
                    });

                    for (const key in this._labelsIndex) {
                        if (value.indexOf(this._convertSingleValue(key)) !== -1) {
                            this._labelsIndex[key].class.add(CLASS_SELECTED);
                        } else {
                            this._labelsIndex[key].class.remove(CLASS_SELECTED);
                        }
                    }
                }
            }
        }

        _onMultipleValuesChange(values) {
            this._labelValue.value = '';
            this._containerTags.clear();
            this._containerTags.class.add(CLASS_TAGS_EMPTY);

            const tags = {};
            const valueCounts = {};
            values.forEach(arr => {
                if (!arr) return;
                arr.forEach(val => {
                    if (!tags[val]) {
                        tags[val] = this._addTag(val);
                        valueCounts[val] = 1;
                    } else {
                        valueCounts[val]++;
                    }
                });
            });

            // add special class to tags that do not exist everywhere
            for (var val in valueCounts) {
                if (valueCounts[val] !== values.length) {
                    tags[val].class.add(CLASS_TAG_NOT_EVERYWHERE);
                    if (this._labelsIndex[val]) {
                        this._labelsIndex[val].class.remove(CLASS_SELECTED);
                    }
                }
            }
        }

        _addTag(value) {
            const container = new pcui.Container({
                flex: true,
                flexDirection: 'row',
                class: CLASS_TAG
            });

            container.append(new pcui.Label({
                text: this._optionsIndex[value] || value
            }));

            const btnRemove = new pcui.Button({
                size: 'small',
                icon: 'E132',
                tabIndex: -1
            });

            container.append(btnRemove);

            btnRemove.on('click', () => this._removeTag(container, value));

            this._containerTags.append(container);
            this._containerTags.class.remove(CLASS_TAGS_EMPTY);

            if (this._labelsIndex[value]) {
                this._labelsIndex[value].class.add(CLASS_SELECTED);
            }

            container.value = value;

            return container;
        }

        _removeTag(tagElement, value) {
            tagElement.destroy();

            if (this._labelsIndex[value]) {
                this._labelsIndex[value].class.remove(CLASS_SELECTED);
            }

            if (this._values) {
                this._values.forEach(arr => {
                    if (!arr) return;
                    const idx = arr.indexOf(value);
                    if (idx !== -1) {
                        arr.splice(idx, 1);
                    }
                });
            } else if (this._value && Array.isArray(this._value)) {
                const idx = this._value.indexOf(value);
                if (idx !== -1) {
                    this._value.splice(idx, 1);
                }
            }

            this.emit('change', this.value);

            if (this._binding) {
                this._binding.removeValues([value]);
            }
        }

        _onInputChange(value) {
            if (this._suspendInputChange) return;

            if (this._lastInputValue === value) return;

            this.open();

            this._lastInputValue = value;

            this._filterOptions(value);
        }

        _filterOptions(filter) {
            const searchIndex = {};

            if (filter) {
                const searchItems = this.options.map(option => {
                    return [option.t, option.v];
                });

                const searchResults = editor.call('search:items', searchItems, filter);
                searchResults.forEach(result => {
                    searchIndex[result] = true;
                });
            }

            let highlighted = false;
            this._containerOptions.forEachChild(label => {
                label.hidden = !!filter && !searchIndex[label._optionValue] && !label.class.contains(CLASS_CREATE_NEW);
                if (!highlighted && !label.hidden) {
                    this._highlightLabel(label);
                    highlighted = true;
                }
            });

            this._resizeShadow();
        }

        _onInputKeyDown(evt) {
            if (evt.keyCode === 13 && this.enabled && !this.readOnly) {
                evt.stopPropagation();
                evt.preventDefault();

                // on enter
                let value;

                if (this._labelHighlighted && this._labelHighlighted._optionValue !== undefined) {
                    value = this._labelHighlighted._optionValue;
                } else {
                    value = this._input.value;
                }

                if (value !== undefined) {
                    this.focus();
                    this.close();

                    if (this._optionsIndex[value]) {
                        this._onSelectValue(value);
                    } else if (this._allowCreate) {
                        if (this._createFn) {
                            this._createFn(value);
                        } else {
                            this._onSelectValue(value);
                        }
                    }

                    return;
                }
            }

            this._onKeyDown(evt);
        }

        _onWindowMouseDown(evt) {
            if (this.dom.contains(evt.target)) return;
            this.close();
        }

        _onKeyDown(evt) {
            // close options on ESC and blur
            if (evt.keyCode === 27) {
                this.close();
                return;
            }

            // handle tab
            if (evt.keyCode === 9) {
                this.close();
                return;
            }

            if (!this.enabled || this.readOnly) return;

            if (evt.keyCode === 13 && !this._allowInput) {
                if (this._labelHighlighted && this._labelHighlighted._optionValue !== undefined) {
                    this._onSelectValue(this._labelHighlighted._optionValue);
                    this.close();
                }

                return;
            }

            if ([38, 40].indexOf(evt.keyCode) === -1) {
                return;
            }

            evt.stopPropagation();
            evt.preventDefault();

            if ((this._allowInput || this.multiSelect) && this._containerOptions.hidden) {
                this.open();
                return;
            }

            if (this._containerOptions.hidden) {
                if (!this._options.length) return;

                let index = -1;
                for (let i = 0; i < this._options.length; i++) {
                    if (this._options[i].v === this.value) {
                        index = i;
                        break;
                    }
                }

                if (evt.keyCode === 38) {
                    index--;
                } else if (evt.keyCode === 40) {
                    index++;
                }

                if (index >= 0 && index < this._options.length) {
                    this._onSelectValue(this._options[index].v);
                }
            } else {
                if (!this._containerOptions.dom.childNodes.length) return;

                if (!this._labelHighlighted) {
                    this._highlightLabel(this._containerOptions.dom.childNodes[0].ui);
                } else {
                    let highlightedLabelDom = this._labelHighlighted.dom;
                    do {
                        if (evt.keyCode === 38) {
                            highlightedLabelDom = highlightedLabelDom.previousSibling;
                        } else if (evt.keyCode === 40) {
                            highlightedLabelDom = highlightedLabelDom.nextSibling;
                        }
                    } while (highlightedLabelDom && highlightedLabelDom.ui.hidden);

                    if (highlightedLabelDom) {
                        this._highlightLabel(highlightedLabelDom.ui);
                    }
                }
            }
        }

        _resizeShadow() {
            this._domShadow.style.height = (this._containerValue.height + this._containerOptions.height) + 'px';
        }

        _onMouseDown() {
            if (!this._allowInput) {
                this.focus();
            }
        }

        _onFocus() {
            this.class.add(pcui.CLASS_FOCUS);
            this.emit('focus');
            if (!this._input.hidden) {
                this.open();
            }
        }

        _onBlur() {
            this.class.remove(pcui.CLASS_FOCUS);
            this.emit('blur');
        }

        _onWheel(evt) {
            // prevent scrolling on other stuff like the viewport
            // when we are scrolling on the select input
            evt.stopPropagation();
        }

        _updateInputFieldsVisibility(focused) {
            let showInput = false;
            let focusInput = false;

            if (this._allowInput) {
                if (focused) {
                    showInput = true;
                    focusInput = true;
                } else {
                    showInput = this.multiSelect || !this._labelsIndex[this.value];
                }
            }

            this._labelValue.hidden = showInput;
            this._labelIcon.hidden = showInput;
            this._input.hidden = !showInput;

            if (focusInput) {
                this._input.focus();
            }

            if (!this._labelValue.hidden) {
                // prevent label from being focused
                // right after input gets unfocused
                this._labelValue.tabIndex = -1;

                if (!this._timeoutLabelValueTabIndex) {
                    this._timeoutLabelValueTabIndex = requestAnimationFrame(() => {
                        this._timeoutLabelValueTabIndex = null;
                        this._labelValue.tabIndex = 0;
                    });
                }
            }

        }

        focus() {
            if (this._input.hidden) {
                this._labelValue.dom.focus();
            } else {
                this._input.focus();
            }
        }

        blur() {
            if (this._allowInput) {
                this._input.blur();
            } else {
                this._labelValue.dom.blur();
            }
        }

        /**
         * @name pcui.SelectInput#open
         * @description Opens the dropdown menu
         */
        open() {
            if (!this._containerOptions.hidden || !this.enabled || this.readOnly) return;

            this._updateInputFieldsVisibility(true);

            // auto-update options if necessary
            if (this._optionsFn) {
                this.options = this._optionsFn();
            }

            if (this._containerOptions.dom.childNodes.length === 0) return;

            // highlight label that displays current value
            this._containerOptions.forEachChild(label => {
                label.hidden = false;
                if (label._optionValue === this.value) {
                    this._highlightLabel(label);
                }
            });
            if (!this._labelHighlighted) {
                this._highlightLabel(this._containerOptions.dom.childNodes[0].ui);
            }

            // show options
            this._containerOptions.hidden = false;
            this.class.add(CLASS_OPEN);

            // register keydown on entire window
            window.addEventListener('keydown', this._domEvtKeyDown);
            // register mousedown on entire window
            window.addEventListener('mousedown', this._domEvtWindowMouseDown);

            // if the dropdown list goes below the window show it above the field
            const startField = this._allowInput ? this._input.dom : this._labelValue.dom;
            const rect = startField.getBoundingClientRect();
            let fitHeight = (rect.bottom + this._containerOptions.height + DEFAULT_BOTTOM_OFFSET >= window.innerHeight);
            if (fitHeight && rect.top - this._containerOptions.height < 0) {
                // if showing it above the field means that some of it will not be visible
                // then show it below instead and adjust the max height to the maximum available space
                fitHeight = false;
                this._containerOptions.style.maxHeight = (window.innerHeight - rect.bottom - DEFAULT_BOTTOM_OFFSET) + 'px';
            }

            if (fitHeight) {
                this.class.add(CLASS_FIT_HEIGHT);
            } else {
                this.class.remove(CLASS_FIT_HEIGHT);
            }

            // resize the outer shadow to fit the element and the dropdown list
            // we need this because the dropdown list is position: absolute
            this._resizeShadow();
        }

        /**
         * @name pcui.SelectInput#close
         * @description Closes the dropdown menu
         */
        close() {
            // there is a potential bug here if the user has set a max height
            // themselves then this will be overriden
            this._containerOptions.style.maxHeight = '';

            this._highlightLabel(null);

            this._updateInputFieldsVisibility(false);

            this._suspendInputChange = true;
            this._input.value = '';
            this._lastInputValue = '';
            this._suspendInputChange = false;

            if (this._containerOptions.hidden) return;

            this._containerOptions.hidden = true;

            this._domShadow.style.height = '';

            this.class.remove(CLASS_OPEN);
            window.removeEventListener('keydown', this._domEvtKeyDown);
            window.removeEventListener('mousedown', this._domEvtWindowMouseDown);
        }

        /**
         * @name pcui.SelectInput#toggle
         * @description Toggles the dropdown menu
         */
        toggle() {
            if (this._containerOptions.hidden) {
                this.open();
            } else {
                this.close();
            }
        }

        unlink() {
            super.unlink();

            if (!this._containerOptions.hidden) {
                this.close();
            }
        }

        destroy() {
            if (this._destroyed) return;

            this._labelValue.dom.removeEventListener('keydown', this._domEvtKeyDown);
            this._labelValue.dom.removeEventListener('mousedown', this._domEvtMouseDown);
            this._labelValue.dom.removeEventListener('focus', this._domEvtFocus);
            this._labelValue.dom.removeEventListener('blur', this._domEvtBlur);

            this._containerOptions.dom.removeEventListener('wheel', this._domEvtWheel);

            window.removeEventListener('keydown', this._domEvtKeyDown);
            window.removeEventListener('mousedown', this._domEvtWindowMouseDown);

            if (this._timeoutLabelValueTabIndex) {
                cancelAnimationFrame(this._timeoutLabelValueTabIndex);
                this._timeoutLabelValueTabIndex = null;
            }

            super.destroy();
        }

        get options() {
            return this._options.slice();
        }

        set options(value) {
            if (this._options && this._options.equals(value)) return;

            this._containerOptions.clear();
            this._labelHighlighted = null;
            this._optionsIndex = {};
            this._labelsIndex = {};
            this._options = value;

            // store each option value -> title pair in the optionsIndex
            this._options.forEach(option => {
                this._optionsIndex[option.v] = option.t;
                if (option.v === '') return;

                const label = new pcui.Label({
                    text: option.t,
                    tabIndex: -1
                });

                label._optionValue = option.v;

                // store labels in an index too
                this._labelsIndex[option.v] = label;

                // on clicking an option set it as the value and close the dropdown list
                label.on('click', (e) => {
                    e.stopPropagation();
                    this._onSelectValue(option.v);
                    this.close();
                });
                this._containerOptions.append(label);
            });

            if (this._createLabelText) {
                this._initializeCreateLabel();
            }

            if (this.multiSelect && this._values) {
                this._onMultipleValuesChange(this._values);
            } else {
                this._onValueChange(this.value);
            }

            if (this._lastInputValue) {
                this._filterOptions(this._lastInputValue);
            }
        }

        get invalidOptions() {
            return this._invalidOptions;
        }

        set invalidOptions(value) {
            this._invalidOptions = value || null;
        }

        get multiSelect() {
            return this.class.contains(CLASS_MULTI_SELECT);
        }

        get value() {
            if (!this.multiSelect) {
                return this._value;
            }

            // if multi-select then construct an array
            // value from the tags that are currently visible
            const result = [];
            this._containerTags.dom.childNodes.forEach(dom => {
                result.push(dom.ui.value);
            });

            return result;
        }

        set value(value) {
            this._values = null;

            this._suspendInputChange = true;
            this._input.value = '';
            this._lastInputValue = '';
            this._suspendInputChange = false;

            this.class.remove(pcui.CLASS_MULTIPLE_VALUES);

            value = this._convertValue(value);

            if (this._value === value || this.multiSelect && this._value && this._value.equals(value)) {
                // if the value is null because we are showing multiple values
                // but someone wants to actually set the value of all observers to null
                // then make sure we do not return early
                if (value !== null || !this._allowNull || !this.class.contains(pcui.CLASS_MULTIPLE_VALUES)) {
                    return;
                }
            }

            this._value = value;
            this._onValueChange(value);

            this.emit('change', value);

            if (this._binding) {
                this._binding.setValue(value);
            }
        }

        set values(values) {
            values = values.map(this._convertValue.bind(this));

            let different = false;
            const value = values[0];
            const multiSelect = this.multiSelect;

            this._values = null;

            for (let i = 1; i < values.length; i++) {
                if (values[i] !== value && (!multiSelect || !values[i] || !values[i].equals(value))) {
                    different = true;
                    break;
                }
            }

            if (different) {
                this._labelValue.values = values;

                // show all different tags
                if (multiSelect) {
                    this._values = values;
                    this._value = null;
                    this._onMultipleValuesChange(this._values);
                    this.emit('change', this.value);
                } else {
                    if (this._value !== null) {
                        this._value = null;
                        this.emit('change', null);
                    }
                }

                this.class.add(pcui.CLASS_MULTIPLE_VALUES);
            } else {
                this.value = values[0];
            }
        }

        get placeholder() {
            return this._input.placeholder;
        }

        set placeholder(value) {
            this._input.placeholder = value;
        }
    }

    utils.implements(SelectInput, pcui.IBindable);
    utils.implements(SelectInput, pcui.IFocusable);

    pcui.Element.register('select', SelectInput, { renderChanges: true });
    pcui.Element.register('multiselect', SelectInput, { multiSelect: true, renderChanges: true });
    pcui.Element.register('tags', SelectInput, { allowInput: true, allowCreate: true, multiSelect: true, renderChanges: true });

    return {
        SelectInput: SelectInput
    };
})());
