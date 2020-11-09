Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ARRAY_INPUT = 'pcui-array-input';
    const CLASS_ARRAY_EMPTY = 'pcui-array-empty';
    const CLASS_ARRAY_SIZE = CLASS_ARRAY_INPUT + '-size';
    const CLASS_ARRAY_CONTAINER = CLASS_ARRAY_INPUT + '-items';
    const CLASS_ARRAY_ELEMENT = CLASS_ARRAY_INPUT + '-item';
    const CLASS_ARRAY_DELETE = CLASS_ARRAY_ELEMENT + '-delete';

    var DEFAULTS = utils.deepCopy(pcui.DEFAULTS);

    /**
     * @event
     * @name pcui.ArrayInput#linkElement
     * @param {pcui.Element} element The array element
     * @param {Number} index The index of the array element
     * @param {String} path The path linked
     * @description Fired when an array element is linked to observers
     */

    /**
     * @event
     * @name pcui.ArrayInput#unlinkElement
     * @param {pcui.Element} element The array element
     * @param {Number} index The index of the array element
     * @description Fired when an array element is unlinked from observers
     */

    /**
     * @name pcui.ArrayInput
     * @classdesc Element that allows editing an array of values.
     * @property {Boolean} renderChanges If true the input will flash when changed.
     * @extends pcui.Element
     */
    class ArrayInput extends pcui.Element {
        /**
         * Creates a new pcui.ArrayInput.
         * @param {Object} args The arguments.
         * @param {String} [args.type] The type of values that the array can hold.
         * Can be one of 'boolean', 'number', 'string', 'asset', 'entity', 'rgb',
         * 'vec2', 'vec3', 'vec4', 'curveset'.
         * @param {Object} [args.elementArgs] Arguments for each array Element.
         */
        constructor(args) {
            args = Object.assign({}, args);

            // remove binding because we want to set it later
            const binding = args.binding;
            delete args.binding;

            const container = new pcui.Container({
                flex: true
            });

            super(container.dom, args);

            this._container = container;
            this._container.parent = this;

            this.class.add(CLASS_ARRAY_INPUT, CLASS_ARRAY_EMPTY);

            this._usePanels = args.usePanels || false;

            this._sizeInput = new pcui.NumericInput({
                class: [CLASS_ARRAY_SIZE],
                placeholder: 'Array Size',
                value: 0,
                hideSlider: true,
                step: 1,
                precision: 0,
                min: 0
            });
            this._sizeInput.on('change', this._onSizeChange.bind(this));
            this._sizeInput.on('focus', this._onFocus.bind(this));
            this._sizeInput.on('blur', this._onBlur.bind(this));
            this._suspendSizeChangeEvt = false;
            this._container.append(this._sizeInput);

            this._containerArray = new pcui.Container({
                class: CLASS_ARRAY_CONTAINER,
                hidden: true
            });
            this._containerArray.on('append', () => {
                this._containerArray.hidden = false;
            });
            this._containerArray.on('remove', () => {
                this._containerArray.hidden = this._arrayElements.length == 0;
            });
            this._container.append(this._containerArray);
            this._suspendArrayElementEvts = false;
            this._arrayElementChangeTimeout = null;

            this._getDefaultFn = args.getDefaultFn || null;

            let valueType = args.elementArgs && args.elementArgs.type || args.type;
            if (!DEFAULTS.hasOwnProperty(valueType)) {
                valueType = 'string';
            }

            this._valueType = valueType;
            this._elementType = args.type;
            this._elementArgs = args.elementArgs || args;

            this._arrayElements = [];

            // set binding now
            this.binding = binding;

            this._values = [];

            if (args.value) {
                this.value = args.value;
            }

            this.renderChanges = args.renderChanges || false;
        }

        _onSizeChange(size) {
            // if size is explicitely 0 then add empty class
            // size can also be null with multi-select so do not
            // check just !size
            if (size === 0) {
                this.class.add(CLASS_ARRAY_EMPTY);
            } else {
                this.class.remove(CLASS_ARRAY_EMPTY);
            }

            if (size === null) return;
            if (this._suspendSizeChangeEvt) return;

            // initialize default value for each new array element
            let defaultValue;
            const initDefaultValue = () => {
                if (this._getDefaultFn) {
                    defaultValue = this._getDefaultFn();
                } else {
                    defaultValue = DEFAULTS[this._valueType];
                    if (this._valueType === 'curveset') {
                        defaultValue = utils.deepCopy(defaultValue);
                        if (Array.isArray(this._elementArgs.curves)) {
                            for (let i = 0; i < this._elementArgs.curves.length; i++) {
                                defaultValue.keys.push([0, 0]);
                            }
                        }
                    } else if (this._valueType === 'gradient') {
                        defaultValue = utils.deepCopy(defaultValue);
                        if (this._elementArgs.channels) {
                            for (let i = 0; i < this._elementArgs.channels; i++) {
                                defaultValue.keys.push([0, 1]);
                            }
                        }
                    }
                }
            };

            // resize array
            const values = this._values.map(array => {
                if (!array) {
                    array = new Array(size);
                    for (let i = 0; i < size; i++) {
                        if (defaultValue === undefined) initDefaultValue();
                        array[i] = utils.deepCopy(defaultValue);
                    }
                } else if (array.length < size) {
                    const newArray = new Array(size - array.length);
                    for (let i = 0; i < newArray.length; i++) {
                        if (defaultValue === undefined) initDefaultValue();
                        newArray[i] = utils.deepCopy(defaultValue);
                    }
                    array = array.concat(newArray);
                } else {
                    const newArray = new Array(size);
                    for (let i = 0; i < size; i++) {
                        newArray[i] = utils.deepCopy(array[i]);
                    }
                    array = newArray;
                }

                return array;
            });

            if (!values.length) {
                const array = new Array(size);
                for (let i = 0; i < size; i++) {
                    if (defaultValue === undefined) initDefaultValue();
                    array[i] = utils.deepCopy(defaultValue);
                }
                values.push(array);
            }

            this._updateValues(values, true);
        }

        _onFocus() {
            this.emit('focus');
        }

        _onBlur() {
            this.emit('blur');
        }

        _createArrayElement() {
            const args = Object.assign({}, this._elementArgs);
            if (args.binding) {
                args.binding = args.binding.clone();
            } else if (this._binding) {
                args.binding = this._binding.clone();
            }

            // set renderChanges after value is set
            // to prevent flashing on initial value set
            args.renderChanges = false;

            let container;
            if (this._usePanels) {
                container = new pcui.Panel({
                    headerText: `[${this._arrayElements.length}]`,
                    removable: true,
                    collapsible: true,
                    class: [CLASS_ARRAY_ELEMENT, CLASS_ARRAY_ELEMENT + '-' + this._elementType]
                });
            } else {
                container = new pcui.Container({
                    flex: true,
                    flexDirection: 'row',
                    alignItems: 'center',
                    class: [CLASS_ARRAY_ELEMENT, CLASS_ARRAY_ELEMENT + '-' + this._elementType]
                });
            }

            if (this._elementType === 'json' && args.attributes) {
                args.attributes = args.attributes.map(attr => {
                    if (!attr.path) return attr;

                    // fix paths to include array element index
                    attr = Object.assign({}, attr);
                    const parts = attr.path.split('.');
                    parts.splice(parts.length - 1, 0, this._arrayElements.length);
                    attr.path = parts.join('.');

                    return attr;
                });
            }

            const element = pcui.Element.create(this._elementType, args);
            container.append(element);

            element.renderChanges = this.renderChanges;

            const entry = {
                container: container,
                element: element
            };

            this._arrayElements.push(entry);

            if (!this._usePanels) {
                const btnDelete = new pcui.Button({
                    icon: 'E289',
                    size: 'small',
                    class: CLASS_ARRAY_DELETE,
                    tabIndex: -1 // skip buttons on tab
                });
                btnDelete.on('click', () => {
                    this._removeArrayElement(entry);
                });

                container.append(btnDelete);
            } else {
                container.on('click:remove', () => {
                    this._removeArrayElement(entry);
                });
            }

            element.on('change', (value) => {
                this._onArrayElementChange(entry, value);
            });

            this._containerArray.append(container);

            return entry;
        }

        _removeArrayElement(entry) {
            const index = this._arrayElements.indexOf(entry);
            if (index === -1) return;

            // remove row from every array in values
            const values = this._values.map(array => {
                if (!array) return null;
                array.splice(index, 1);
                return array;
            });

            this._updateValues(values, true);
        }

        _onArrayElementChange(entry, value) {
            if (this._suspendArrayElementEvts) return;

            const index = this._arrayElements.indexOf(entry);
            if (index === -1) return;

            // Set the value to the same row of every array in values.
            this._values.forEach(array => {
                if (array && array.length > index) {
                    array[index] = value;
                }
            });

            // use a timeout here because when our values change they will
            // first emit change events on each array element. However since the
            // whole array changed we are going to fire a 'change' event later from
            // our '_updateValues' function. We only want to emit a 'change' event
            // here when only the array element changed value and not the whole array so
            // wait a bit and fire the change event later otherwise the _updateValues function
            // will cancel this timeout and fire a change event for the whole array instead
            this._arrayElementChangeTimeout = setTimeout(() => {
                this._arrayElementChangeTimeout = null;
                this.emit('change', this.value);
            });
        }

        _linkArrayElement(element, index) {
            const observers = this._binding.observers;
            const paths = this._binding.paths;
            const useSinglePath = paths.length === 1 || observers.length !== paths.length;
            element.unlink();
            element.value = null;

            this.emit('unlinkElement', element, index);

            const path = (useSinglePath ? paths[0] + `.${index}` : paths.map(path => `${path}.${index}`));
            element.link(observers, path);

            this.emit('linkElement', element, index, path);
        }

        _updateValues(values, applyToBinding) {
            this._values = values || [];

            this._suspendArrayElementEvts = true;
            this._suspendSizeChangeEvt = true;

            // apply values to the binding
            if (applyToBinding && this._binding) {
                this._binding.setValues(values);
            }

            // each row of this array holds
            // all the values for that row
            const valuesPerRow = [];
            // holds the length of each array
            const arrayLengths = [];

            values.forEach(array => {
                if (!array) return;

                arrayLengths.push(array.length);

                array.forEach((item, i) => {
                    if (!valuesPerRow[i]) {
                        valuesPerRow[i] = [];
                    }

                    valuesPerRow[i].push(item);
                });
            });

            let lastElementIndex = -1;
            for (let i = 0; i < valuesPerRow.length; i++) {
                // if the number of values on this row does not match
                // the number of arrays then stop adding rows
                if (valuesPerRow[i].length !== values.length) {
                    break;
                }

                // create row if it doesn't exist
                if (!this._arrayElements[i]) {
                    this._createArrayElement();
                }

                // bind to observers for that row or just display the values
                if (this._binding && this._binding.observers) {
                    this._linkArrayElement(this._arrayElements[i].element, i);
                } else {
                    if (valuesPerRow[i].length > 1) {
                        this._arrayElements[i].element.values = valuesPerRow[i];
                    } else {
                        this._arrayElements[i].element.value = valuesPerRow[i][0];
                    }
                }

                lastElementIndex = i;
            }

            // destory elements that are no longer in our values
            for (let i = this._arrayElements.length - 1; i > lastElementIndex; i--) {
                this._arrayElements[i].container.destroy();
                this._arrayElements.splice(i, 1);
            }


            this._sizeInput.values = arrayLengths;

            this._suspendSizeChangeEvt = false;
            this._suspendArrayElementEvts = false;

            if (this._arrayElementChangeTimeout) {
                clearTimeout(this._arrayElementChangeTimeout);
                this._arrayElementChangeTimeout = null;
            }

            this.emit('change', this.value);
        }

        focus() {
            this._sizeInput.focus();
        }

        blur() {
            this._sizeInput.blur();
        }

        destroy() {
            if (this._destroyed) return;
            this._arrayElements.length = 0;
            super.destroy();
        }

        get binding() {
            return super.binding;
        }

        // override binding setter to create
        // the same type of binding on each array element too
        set binding(value) {
            super.binding = value;

            this._arrayElements.forEach(entry => {
                entry.element.binding = value ? value.clone() : null;
            });
        }

        get value() {
            // construct value from values of array elements
            return this._arrayElements.map(entry => entry.element.value);
        }

        set value(value) {
            if (!Array.isArray(value)) {
                value = [null];
            }

            const current = this.value || [];
            if (current.equals(value)) return;

            // update values and binding
            this._updateValues(new Array(this._values.length || 1).fill(value), true);
        }

        set values(values) {
            if (this._values.equals(values)) return;
            // update values but do not update binding
            this._updateValues(values, false);
        }

        get renderChanges() {
            return this._renderChanges;
        }

        set renderChanges(value) {
            this._renderChanges = value;
            this._arrayElements.forEach(entry => {
                entry.element.renderChanges = value;
            });
        }
    }

    utils.implements(ArrayInput, pcui.IBindable);
    utils.implements(ArrayInput, pcui.IFocusable);

    for (const type in DEFAULTS) {
        pcui.Element.register(`array:${type}`, ArrayInput, { type: type, renderChanges: true });
    }
    pcui.Element.register('array:select', ArrayInput, { type: 'select', renderChanges: true });

    return {
        ArrayInput: ArrayInput
    };
})());
