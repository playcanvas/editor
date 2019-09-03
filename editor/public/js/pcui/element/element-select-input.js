Object.assign(pcui, (function () {
    'use strict';

    const CLASS_SELECT_INPUT = 'pcui-select-input';
    const CLASS_VALUE = CLASS_SELECT_INPUT + '-value';
    const CLASS_ICON = CLASS_SELECT_INPUT + '-icon';
    const CLASS_INPUT = CLASS_SELECT_INPUT + '-textinput';
    const CLASS_LIST = CLASS_SELECT_INPUT + '-list';
    const CLASS_TAGS = CLASS_SELECT_INPUT + '-tags';
    const CLASS_SHADOW = CLASS_SELECT_INPUT + '-shadow';
    const CLASS_FIT_HEIGHT = CLASS_SELECT_INPUT + '-fit-height';
    const CLASS_SELECTED = 'pcui-selected';
    const CLASS_OPEN = 'pcui-open';

    class SelectInput extends pcui.Element {
        constructor(args) {
            if (!args) args = {};

            // main container
            const container = new pcui.Container();
            super(container.dom, args);
            this._container = container;
            this._container.parent = this;

            this.class.add(CLASS_SELECT_INPUT);

            this.dom.tabIndex = 0;

            // focus / hover shadow element
            this._domShadow = document.createElement('div');
            this._domShadow.classList.add(CLASS_SHADOW);
            this._container.append(this._domShadow);

            // displays current value
            this._labelValue = new pcui.Label({
                class: CLASS_VALUE
            });
            this._labelValue.on('click', this._onValueClick.bind(this));
            this._container.append(this._labelValue);

            // dropdown icon
            this._labelIcon = new pcui.Label({
                class: CLASS_ICON
            });
            this._container.append(this._labelIcon);

            // input for searching or adding new entries
            this._input = new pcui.TextInput({
                class: CLASS_INPUT,
                hidden: true
            });
            this._container.append(this._input);

            // dropdown list
            this._containerOptions = new pcui.Container({
                class: CLASS_LIST,
                hidden: true
            });
            this._container.append(this._containerOptions);

            // tags container
            this._containerTags = new pcui.Container({
                class: CLASS_TAGS,
                hidden: true
            });
            this._container.append(this._containerTags);

            // events
            this._domEvtKeyDown = this._onKeyDown.bind(this);
            this._domEvtFocus = this._onFocus.bind(this);
            this._domEvtBlur = this._onBlur.bind(this);

            this.dom.addEventListener('keydown', this._domEvtKeyDown);
            this.dom.addEventListener('focus', this._domEvtFocus);
            this.dom.addEventListener('blur', this._domEvtBlur);

            this._type = args.type || 'string';

            this._optionsIndex = {};
            this._labelsIndex = {};
            this.options = args.options || [];

            if (args.value !== undefined) {
                this.value = args.value;
            } else if (args.defaultValue) {
                this.value = args.defaultValue;
            } else {
                this.value = null;
            }
        }

        _convertValue(value) {
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

        // toggle dropdown list
        _onValueClick() {
            if (!this.enabled || this.readOnly) return;

            this.toggle();
        }

        // when the value is changed show the correct title
        _onValueChange(value) {
            this._labelValue.value = this._optionsIndex[value] || '';
            value = '' + value;
            for (var key in this._labelsIndex) {
                if (key === value) {
                    this._labelsIndex[key].class.add(CLASS_SELECTED);
                } else {
                    this._labelsIndex[key].class.remove(CLASS_SELECTED);
                }
            }
        }

        _onKeyDown(evt) {
            // close options on ESC and blur
            if (evt.keyCode === 27) {
                this.close();
                this.blur();
                return;
            }

            if (!this.enabled || this.readOnly || [38, 40].indexOf(evt.keyCode) === -1) {
                return;
            }

            evt.stopPropagation();
            evt.preventDefault();

            // on up / down keys go to the prev / next value
            for (let i = 0; i < this._options.length; i++) {
                if (this._options[i].v === this.value) {
                    i = (evt.keyCode === 38 ? i - 1 : i + 1);
                    i = Math.max(0, Math.min(this._options.length - 1, i));
                    this.value = this._options[i].v;
                    break;
                }
            }
        }

        _onFocus() {
            this.emit('focus');
        }

        _onBlur() {
            this.emit('blur');
        }

        focus() {
            this.dom.focus();
        }

        blur() {
            this.dom.blur();
        }

        open() {
            // show options
            this._containerOptions.hidden = false;
            this.class.add(CLASS_OPEN);

            // register keydown on entire window
            window.addEventListener('keydown', this._domEvtKeyDown);

            // resize the outer shadow to fit the element and the dropdown list
            // we need this because the dropdown list is position: absolute
            this._domShadow.style.height = (this.height + this._containerOptions.height) + 'px';

            // if the dropdown list goes below the window show it above the field
            const rect = this.dom.getBoundingClientRect();
            if (rect.bottom + this._containerOptions.height > window.innerHeight) {
                this.class.add(CLASS_FIT_HEIGHT);
            } else {
                this.class.remove(CLASS_FIT_HEIGHT);
            }
        }

        close() {
            this._containerOptions.hidden = true;

            this._domShadow.style.height = '';

            this.class.remove(CLASS_OPEN);
            window.removeEventListener('keydown', this._domEvtKeyDown);
        }

        toggle() {
            if (this._containerOptions.hidden) {
                this.open();
            } else {
                this.close();
            }
        }

        destroy() {
            if (this._destroyed) return;

            this.dom.removeEventListener('keydown', this._domEvtKeyDown);
            this.dom.removeEventListener('focus', this._domEvtFocus);
            this.dom.removeEventListener('blur', this._domEvtBlur);
            window.removeEventListener('keydown', this._domEvtKeyDown);

            super.destroy();
        }

        get options() {
            return this._options.slice();
        }

        set options(value) {
            if (this._options && this._options.equals(value)) return;

            this._containerOptions.clear();
            this._optionsIndex = {};
            this._labelsIndex = {};
            this._options = value;

            // store each option value -> title pair in the optionsIndex
            this._options.forEach(option => {
                this._optionsIndex[option.v] = option.t;
                if (option.v === '') return;

                const label = new pcui.Label({
                    text: option.t
                });

                // store labels in an index too
                this._labelsIndex[option.v] = label;

                // on clicking an option set it as the value and close the dropdown list
                label.on('click', (e) => {
                    e.stopPropagation();
                    this.value = option.v;
                    this.close();
                });
                this._containerOptions.append(label);
            });

            this._onValueChange(this.value);
        }

        get value() {
            return this._value;
        }

        set value(value) {
            value = this._convertValue(value);

            if (this._value === value) return;

            this.class.remove(pcui.CLASS_MULTIPLE_VALUES);

            this._value = value;
            this._onValueChange(value);

            this.emit('change', value);

            if (this._binding) {
                this._binding.setValue(value);
            }
        }

        set values(values) {
            values = values.map(this._convertValue.bind(this));
            this._labelValue.values = values;
            if (this._labelValue.class.contains(pcui.CLASS_MULTIPLE_VALUES)) {
                if (this._value !== null) {
                    this._value = null;
                    this.emit('change', null);
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

    return {
        SelectInput: SelectInput
    };
})());
