import { LegacyElement } from './element.ts';

class LegacyTextField extends LegacyElement {
    constructor(args = {}) {
        super();
        this.element = document.createElement('div');
        this._element.classList.add('ui-text-field');

        this.elementInput = document.createElement('input');
        this.elementInput.ui = this;
        this.elementInput.classList.add('field');
        this.elementInput.type = 'text';
        this.elementInput.tabIndex = 0;
        this.elementInput.addEventListener('focus', this._onInputFocus.bind(this), false);
        this.elementInput.addEventListener('blur', this._onInputBlur.bind(this), false);
        this._element.appendChild(this.elementInput);

        if (args.default !== undefined) {
            this.value = args.default;
        }

        this.elementInput.addEventListener('change', this._onChange.bind(this), false);
        this.elementInput.addEventListener('keydown', this._onKeyDown.bind(this), false);
        this.elementInput.addEventListener('contextmenu', this._onFullSelect.bind(this), false);
        this.evtKeyChange = false;
        this.ignoreChange = false;

        this.blurOnEnter = true;
        this.refocusable = true;

        this.on('disable', this._onDisable.bind(this));
        this.on('enable', this._onEnable.bind(this));
        this.on('change', this._onChangeField.bind(this));

        if (args.placeholder) {
            this.placeholder = args.placeholder;
        }
    }

    set value(value) {
        if (this._link) {
            if (!this._link.set(this.path, value)) {
                this.elementInput.value = this._link.get(this.path);
            }
        } else {
            if (this.elementInput.value === value) {
                return;
            }

            this.elementInput.value = value || '';
            this.emit('change', value);
        }
    }

    get value() {
        if (this._link) {
            return this._link.get(this.path);
        }
        return this.elementInput.value;
    }

    set placeholder(value) {
        if (!value) {
            this._element.removeAttribute('placeholder');
        } else {
            this._element.setAttribute('placeholder', value);
        }
    }

    get placeholder() {
        return this._element.getAttribute('placeholder');
    }

    set proxy(value) {
        if (!value) {
            this._element.removeAttribute('proxy');
        } else {
            this._element.setAttribute('proxy', value);
        }
    }

    get proxy() {
        return this._element.getAttribute('proxy');
    }

    set keyChange(value) {
        if (!!this.evtKeyChange === !!value) {
            return;
        }

        if (value) {
            this.elementInput.addEventListener('keyup', this._onChange.bind(this), false);
        } else {
            this.elementInput.removeEventListener('keyup', this._onChange.bind(this));
        }
    }

    get keyChange() {
        return !!this.evtKeyChange;
    }

    _onLinkChange(value) {
        this.elementInput.value = value;
        this.emit('change', value);
    }

    _onChange() {
        if (this.ignoreChange) {
            return;
        }

        this.value = this.value || '';

        if (!this._link) {
            this.emit('change', this.value);
        }
    }

    _onKeyDown(evt) {
        if (evt.keyCode === 27) {
            this.elementInput.blur();
        } else if (this.blurOnEnter && evt.keyCode === 13) {
            let focused = false;

            let parent = this.parent;
            while (parent) {
                if (parent.focus) {
                    parent.focus();
                    focused = true;
                    break;
                }

                parent = parent.parent;
            }

            if (!focused) {
                this.elementInput.blur();
            }
        }
    }

    _onFullSelect() {
        this.elementInput.select();
    }

    focus(select) {
        this.elementInput.focus();
        if (select) {
            this.elementInput.select();
        }
    }

    _onInputFocus() {
        this.class.add('focus');
        this.emit('input:focus');
    }

    _onInputBlur() {
        this.class.remove('focus');
        this.emit('input:blur');
    }

    _onDisable() {
        this.elementInput.readOnly = true;
    }

    _onEnable() {
        this.elementInput.readOnly = false;
    }

    _onChangeField() {
        if (!this.renderChanges) {
            return;
        }

        this.flash();
    }
}

export { LegacyTextField };
