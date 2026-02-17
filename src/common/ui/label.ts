import { LegacyElement } from './element';

class LegacyLabel extends LegacyElement {
    constructor(args: Record<string, any> = {}) {
        super();
        this._text = args.text || '';
        this._unsafe = !!args.unsafe;

        this.element = document.createElement('span');
        this._element.classList.add('ui-label');

        if (this._text) {
            this._setText(this._text);
        }

        this.on('change', this._onChange.bind(this));

        if (args.placeholder) {
            this.placeholder = args.placeholder;
        }
    }

    set text(value: string) {
        if (this._link) {
            if (!this._link.set(this.path, value)) {
                value = this._link.get(this.path);
                this._setText(value);
            }
        } else {
            if (this._text === value) {
                return;
            }

            this._text = value;
            if (value === undefined || value === null) {
                this._text = '';
            }

            this._setText(this._text);
            this.emit('change', value);
        }
    }

    get text() {
        if (this._link) {
            return this._link.get(this.path);
        }
        return this._text;
    }

    set value(value: string) {
        this.text = value;
    }

    get value() {
        return this.text;
    }

    set placeholder(value: string) {
        this._element.setAttribute('placeholder', value);
    }

    get placeholder() {
        return this._element.getAttribute('placeholder');
    }

    _setText(text: string) {
        if (this._unsafe) {
            this._element.innerHTML = text;
        } else {
            this._element.textContent = text;
        }
    }

    _onChange() {
        if (!this.renderChanges) {
            return;
        }

        this.flash();
    }

    _onLinkChange(value: string) {
        this.text = value;
        this.emit('change', value);
    }
}

export { LegacyLabel };
