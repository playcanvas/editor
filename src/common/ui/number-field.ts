import { LegacyElement } from './element';

class LegacyNumberField extends LegacyElement {
    constructor(args: Record<string, any> = {}) {
        super();
        this.precision = (args.precision != null) ? args.precision : null;
        this.step = (args.step != null) ? args.step : ((args.precision != null) ? 1 / Math.pow(10, args.precision) : 1);

        this.max = (args.max !== null) ? args.max : null;
        this.min = (args.min !== null) ? args.min : null;

        this.allowNull = !!args.allowNull;

        this.element = document.createElement('div');
        this._element.classList.add('ui-number-field');

        this.elementInput = document.createElement('input');
        this.elementInput.ui = this;
        this.elementInput.tabIndex = 0;
        this.elementInput.classList.add('field');
        this.elementInput.type = 'text';
        this.elementInput.addEventListener('focus', this._onInputFocus.bind(this), false);
        this.elementInput.addEventListener('blur', this._onInputBlur.bind(this), false);
        this.elementInput.addEventListener('keydown', this._onKeyDown.bind(this), false);
        this.elementInput.addEventListener('dblclick', this._onFullSelect.bind(this), false);
        this.elementInput.addEventListener('contextmenu', this._onFullSelect.bind(this), false);
        this._element.appendChild(this.elementInput);

        if (args.default !== undefined) {
            this.value = args.default;
        }

        this.elementInput.addEventListener('change', this._onChange.bind(this), false);

        this.blurOnEnter = true;
        this.refocusable = true;

        this._lastValue = this.value;
        this._mouseMove = null;
        this._dragging = false;
        this._dragDiff = 0;
        this._dragStart = 0;

        this.on('disable', this._onDisable.bind(this));
        this.on('enable', this._onEnable.bind(this));
        this.on('change', this._onChangeField.bind(this));

        if (args.placeholder) {
            this.placeholder = args.placeholder;
        }
    }

    set value(value: number | null) {
        if (this._link) {
            if (!this._link.set(this.path, value)) {
                this.elementInput.value = this._link.get(this.path);
            }
        } else {
            if (value !== null) {
                if (this.max !== null && this.max < value) {
                    value = this.max;
                }

                if (this.min !== null && this.min > value) {
                    value = this.min;
                }
            }

            value = (value !== null && value !== undefined && (this.precision !== null) ? parseFloat(value.toFixed(this.precision)) : value);
            if (value === undefined) {
                value = null;
            }

            const different = this._lastValue !== value;

            this._lastValue = value;
            this.elementInput.value = value;

            if (different) {
                this.emit('change', value);
            }
        }
    }

    get value() {
        if (this._link) {
            return this._link.get(this.path);
        }
        return this.elementInput.value !== '' ? parseFloat(this.elementInput.value) : null;
    }

    set placeholder(value: string) {
        if (!value) {
            this._element.removeAttribute('placeholder');
        } else {
            this._element.setAttribute('placeholder', value);
        }
    }

    get placeholder() {
        return this._element.getAttribute('placeholder');
    }

    set proxy(value: string) {
        if (!value) {
            this._element.removeAttribute('proxy');
        } else {
            this._element.setAttribute('proxy', value);
        }
    }

    get proxy() {
        return this._element.getAttribute('proxy');
    }

    _onLinkChange(value: number | null) {
        this.elementInput.value = value || 0;
        this.emit('change', value || 0);
    }

    _onChange() {
        const value = parseFloat(this.elementInput.value);
        if (isNaN(value)) {
            if (this.allowNull) {
                this.value = null;
            } else {
                this.elementInput.value = 0;
                this.value = 0;
            }
        } else {
            this.elementInput.value = value;
            this.value = value;
        }
    }

    focus(select: boolean) {
        this.elementInput.focus();
        if (select) {
            this.elementInput.select();
        }
    }

    _onInputFocus() {
        this.class.add('focus');
    }

    _onInputBlur() {
        this.class.remove('focus');
    }

    _onKeyDown(evt: KeyboardEvent) {
        if (evt.keyCode === 27) {
            return this.elementInput.blur();
        }

        if (this.blurOnEnter && evt.keyCode === 13) {
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

            return;
        }

        if (this.disabled || [38, 40].indexOf(evt.keyCode) === -1) {
            return;
        }

        let inc = evt.keyCode === 40 ? -1 : 1;

        if (evt.shiftKey) {
            inc *= 10;
        }

        let value = this.value + (this.step || 1) * inc;

        if (this.max != null) {
            value = Math.min(this.max, value);
        }

        if (this.min != null) {
            value = Math.max(this.min, value);
        }

        if (this.precision != null) {
            value = parseFloat(value.toFixed(this.precision));
        }

        this.value = value;
        this.value = value;
    }

    _onFullSelect() {
        this.elementInput.select();
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

export { LegacyNumberField };
