import { LegacyElement } from './element';

class LegacyCheckbox extends LegacyElement {
    constructor(args: Record<string, any> = {}) {
        super();
        this._text = args.text || '';

        this.element = document.createElement('div');
        this._element.classList.add('ui-checkbox', 'noSelect');
        this._element.tabIndex = 0;

        this._element.addEventListener('keydown', this._onKeyDown.bind(this), false);

        this.on('click', this._onClick.bind(this));
        this.on('change', this._onChange.bind(this));
    }

    set value(value: boolean | null) {
        if (this._link) {
            this._link.set(this.path, value);
        } else {
            if (this._element.classList.contains('checked') !== value) {
                this._onLinkChange(value);
            }
        }
    }

    get value() {
        if (this._link) {
            return this._link.get(this.path);
        }
        return this._element.classList.contains('checked');
    }

    _onClick() {
        this.value = !this.value;
        this._element.blur();
    }

    _onChange() {
        if (!this.renderChanges) {
            return;
        }
        this.flash();
    }

    _onKeyDown(evt: KeyboardEvent) {
        if (evt.keyCode === 27) {
            return this._element.blur();
        }

        if (evt.keyCode !== 32 || this.disabled) {
            return;
        }

        evt.stopPropagation();
        evt.preventDefault();
        this.value = !this.value;
    }

    _onLinkChange(value: boolean | null) {
        if (value === null) {
            this._element.classList.remove('checked');
            this._element.classList.add('null');
        } else if (value) {
            this._element.classList.add('checked');
            this._element.classList.remove('null');
        } else {
            this._element.classList.remove('checked', 'null');
        }
        this.emit('change', value);
    }
}

export { LegacyCheckbox };
